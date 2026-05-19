import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/ocr/transliterate
 *
 * Server-side proxy to the Nôm Na Việt Hán-Nôm → Quốc Ngữ converter.
 * Avoids browser CORS / UA gating and keeps the upstream URL configurable.
 * Faithful port of nom-ocr-training's /api/transliterate (admin-namespaced
 * here; gated by the admin-subdomain middleware like the other OCR routes).
 *
 * Input  (JSON): {
 *   text: string,
 *   options?: {
 *     showAlternatives?: boolean,   // default true
 *     maxAlternatives?: number,     // default 9 (matches OCR-cell digit hotkeys)
 *     useLLMSelection?: boolean     // default false (the fast path)
 *   }
 * }
 *
 * Output (JSON): { segments: Array<{
 *   nom: string,           // the Hán-Nôm string this segment covers (1+ chars)
 *   vietnamese: string,    // its Quốc Ngữ reading (may be multi-word for phrases)
 *   matched: boolean,
 *   meaning?: string,
 *   alternatives: Array<{ pronunciation: string, finalScore?: number, meaning?: string }>
 * }> }
 *
 * Upstream: POST https://api.nomnaviet.com/api/dictionary/convert-to-viet
 *   - requires a non-empty User-Agent header
 *   - rate limit: 500 req / 15 min per IP
 *   - segments may be multi-char compounds (e.g. "國語" → one segment)
 *
 * Override the upstream URL via the NOMNAVIET_CONVERTER_URL env var.
 */

const UPSTREAM =
  process.env.NOMNAVIET_CONVERTER_URL ||
  "https://api.nomnaviet.com/api/dictionary/convert-to-viet";

interface ConverterSegment {
  nom: string;
  vietnamese: string;
  matched: boolean;
  meaning?: string;
  alternatives: Array<{
    pronunciation: string;
    finalScore?: number;
    meaning?: string;
  }>;
}

export async function POST(req: NextRequest) {
  let text: string;
  let options: {
    showAlternatives?: boolean;
    maxAlternatives?: number;
    useLLMSelection?: boolean;
  } = {};

  try {
    const body = await req.json();
    text = body.text;
    if (body.options && typeof body.options === "object") {
      options = body.options;
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof text !== "string" || text.length === 0) {
    return NextResponse.json(
      { error: "text must be a non-empty string" },
      { status: 400 }
    );
  }

  const upstreamBody = {
    text,
    options: {
      showAlternatives: options.showAlternatives ?? true,
      maxAlternatives: options.maxAlternatives ?? 9,
      useLLMSelection: options.useLLMSelection ?? false,
    },
  };

  try {
    const upstreamRes = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // The converter rejects requests without a UA (BAD_REQUEST
        // "User-Agent header required"). Mirror the OCR proxy's UA so
        // origin-fingerprinting heuristics see the same client.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
        Origin: "https://nomnaviet.com",
        Referer: "https://nomnaviet.com/",
      },
      body: JSON.stringify(upstreamBody),
    });

    if (!upstreamRes.ok) {
      const txt = await upstreamRes.text().catch(() => "");
      console.error(
        `[transliterate proxy] upstream ${upstreamRes.status}:`,
        txt.slice(0, 2000)
      );
      // Pass through 429 so the client can back off the whole batch.
      const passthrough =
        upstreamRes.status === 429 || upstreamRes.status === 503
          ? upstreamRes.status
          : 502;
      return NextResponse.json(
        {
          error: `Upstream HTTP ${upstreamRes.status}`,
          upstreamBody: txt.slice(0, 500),
        },
        { status: passthrough }
      );
    }

    const raw = await upstreamRes.json();
    const segments = parseSegments(raw);
    if (segments.length === 0) {
      console.warn(
        "[transliterate proxy] parsed 0 segments from response:",
        JSON.stringify(raw).slice(0, 500)
      );
    }
    return NextResponse.json({ segments });
  } catch (e: any) {
    console.error("[transliterate proxy] fetch failed:", e);
    return NextResponse.json(
      { error: `Upstream call failed: ${e.message}` },
      { status: 502 }
    );
  }
}

/**
 * Defensive parser. The converter wraps results in
 * `{ success: true, data: { segments: [...] } }` but we accept the bare
 * array shape too in case the upstream changes.
 */
function parseSegments(raw: any): ConverterSegment[] {
  const arr =
    raw?.data?.segments ?? raw?.segments ?? (Array.isArray(raw) ? raw : null);
  if (!Array.isArray(arr)) return [];

  const out: ConverterSegment[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const nom = String(item.nom ?? "");
    const vietnamese = String(item.vietnamese ?? "");
    if (!nom) continue;
    const altsRaw = Array.isArray(item.alternatives) ? item.alternatives : [];
    const alternatives = altsRaw
      .map((a: any) => ({
        pronunciation: String(a?.pronunciation ?? ""),
        finalScore:
          typeof a?.finalScore === "number" ? a.finalScore : undefined,
        meaning: typeof a?.meaning === "string" ? a.meaning : undefined,
      }))
      .filter((a: { pronunciation: string }) => a.pronunciation.length > 0);
    out.push({
      nom,
      vietnamese,
      matched: !!item.matched,
      meaning: typeof item.meaning === "string" ? item.meaning : undefined,
      alternatives,
    });
  }
  return out;
}
