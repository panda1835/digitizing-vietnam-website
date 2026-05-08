import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ocr/nomnaviet
 *
 * Server-side proxy to the Nôm Na Việt single-character OCR endpoint.
 * Avoids browser CORS and keeps upstream URL configurable.
 *
 * Input  (JSON): { imageData: string, topK?: number }
 *   imageData — base64 PNG of one cropped character (with or without
 *               "data:image/png;base64," prefix).
 *   topK     — number of candidates to request (default 9).
 *
 * Output (JSON): { candidates: Array<{ char: string; confidence: number }> }
 *
 * Upstream: https://hannom-api.nvnv.app/api/ocr/recognize  (POST { imageData, topK })
 * Override via env NOMNAVIET_OCR_URL.
 */

const UPSTREAM =
  process.env.NOMNAVIET_OCR_URL ||
  "https://hannom-api.nvnv.app/api/ocr/recognize";

export async function POST(req: NextRequest) {
  let imageData: number[];
  let topK = 9;

  try {
    const body = await req.json();
    imageData = body.imageData;
    if (typeof body.topK === "number") topK = body.topK;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Upstream expects a flat array of 4096 grayscale pixel values (64×64).
  if (!Array.isArray(imageData) || imageData.length !== 4096) {
    return NextResponse.json(
      {
        error: `imageData must be an array of 4096 numbers (got ${
          Array.isArray(imageData) ? imageData.length : typeof imageData
        })`,
      },
      { status: 400 }
    );
  }

  try {
    const upstreamRes = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Mimic the browser app's origin so any host/origin checks pass.
        Origin: "https://hannom.nvnv.app",
        Referer: "https://hannom.nvnv.app/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({ imageData, topK }),
    });

    if (!upstreamRes.ok) {
      const text = await upstreamRes.text().catch(() => "");
      // Log full body to dev-server console so we can see the real error.
      console.error(
        `[nomnaviet proxy] upstream ${upstreamRes.status}:`,
        text.slice(0, 2000)
      );
      // Pass through 503/429 so the client can bail the whole batch instead
      // of pounding a service that's down or rate-limiting us.
      const passthrough =
        upstreamRes.status === 503 || upstreamRes.status === 429
          ? upstreamRes.status
          : 502;
      return NextResponse.json(
        {
          error: `Upstream HTTP ${upstreamRes.status}`,
          upstreamBody: text.slice(0, 500),
        },
        { status: passthrough }
      );
    }

    const raw = await upstreamRes.json();
    const candidates = parseCandidates(raw);
    if (candidates.length === 0) {
      console.warn(
        "[nomnaviet proxy] parsed 0 candidates from response:",
        JSON.stringify(raw).slice(0, 500)
      );
    } else {
      console.log(
        `[nomnaviet proxy] OK top1='${candidates[0].char}' conf=${candidates[0].confidence} (${candidates.length} cands)`
      );
    }
    return NextResponse.json({ candidates });
  } catch (e: any) {
    console.error("[nomnaviet proxy] fetch failed:", e);
    return NextResponse.json(
      { error: `Upstream call failed: ${e.message}` },
      { status: 502 }
    );
  }
}

/**
 * Defensive parser — the exact response shape isn't documented, so we
 * accept the common forms seen in handwriting OCR APIs and normalize
 * to { char, confidence }[]. If the shape doesn't match, returns [].
 */
function parseCandidates(raw: any): Array<{ char: string; confidence: number }> {
  const fromArray = (arr: any[]): Array<{ char: string; confidence: number }> => {
    const out: Array<{ char: string; confidence: number }> = [];
    for (const item of arr) {
      if (typeof item === "string") {
        out.push({ char: item, confidence: 0 });
      } else if (Array.isArray(item) && item.length >= 2) {
        out.push({ char: String(item[0]), confidence: Number(item[1]) || 0 });
      } else if (item && typeof item === "object") {
        const char =
          item.char ?? item.character ?? item.text ?? item.label ?? item.value;
        const confidence =
          item.confidence ?? item.score ?? item.prob ?? item.probability ?? 0;
        if (typeof char === "string" && char.length > 0) {
          out.push({ char, confidence: Number(confidence) || 0 });
        }
      }
    }
    return out;
  };

  // Endpoint is batch — response is typically array-of-arrays (one
  // candidate list per input image). We sent 1 image, so peel the outer.
  const peelBatch = (a: any[]): any[] =>
    a.length > 0 && Array.isArray(a[0]) ? a[0] : a;

  if (Array.isArray(raw)) return fromArray(peelBatch(raw));
  if (raw && typeof raw === "object") {
    const arr =
      raw.candidates ??
      raw.predictions ??
      raw.results ??
      raw.data ??
      raw.result ??
      raw.output;
    if (Array.isArray(arr)) return fromArray(peelBatch(arr));
  }
  return [];
}
