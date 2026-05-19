import { NextRequest, NextResponse } from "next/server";
import { ocrSupabase } from "@/lib/ocr-supabase";

/**
 * GET /api/admin/ocr/qn-suggestions/<slug>?max=5&scope=both
 *
 * User-derived Quốc Ngữ suggestions. Aggregates the `quocNgu` readings a
 * user has already typed across the corpus so the focused-char editor can
 * surface "you read this glyph as X before" candidates instead of making
 * the user retype.
 *
 * Faithful port of text-search's nom_ocr/qn_suggestions.py, adapted to
 * DVN's normalized schema:
 *   - glyph  = the latest non-Quốc-Ngữ ("manuscript") text_version of a
 *              text_unit (same rule getPage() uses to resolve `text`)
 *   - qn     = the latest source='quoc-ngu' text_version of that unit
 *   - scope  = "text" when the unit's document == <slug>, else "global"
 *
 * Bounded to units that actually have a QN reading (only those can be
 * suggestions). `scope`:
 *   text   — only readings typed inside this document (higher signal)
 *   global — readings from every document (cross-text fallback)
 *   both   — same-text first (by count), then global for QN values not
 *            already present, capped at `max` per glyph.
 *
 * Output: { suggestions: { "<glyph>": [
 *   { qn, count, uncertainCount, scope }, ... ] } }
 */

const SRC_QN = "quoc-ngu";
const IN_CHUNK = 100;

interface Stat {
  count: number;
  uncertainCount: number;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = decodeURIComponent(params.slug);
    const url = new URL(req.url);
    const max = Math.max(
      1,
      Math.min(20, parseInt(url.searchParams.get("max") ?? "5", 10) || 5)
    );
    const scope = (url.searchParams.get("scope") ?? "both") as
      | "both"
      | "text"
      | "global";

    const db = ocrSupabase();

    // The document under edit — used to label this-text vs cross-text.
    const { data: docRow } = await db
      .from("documents")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    const thisDocId = (docRow as { id: string } | null)?.id ?? null;

    // 1. Every Quốc-Ngữ version row. Latest per unit wins (append-only).
    const { data: qnRows, error: qnErr } = await db
      .from("text_versions")
      .select("text_unit_id, text, created_at")
      .eq("source", SRC_QN)
      .order("created_at");
    if (qnErr) throw new Error(`text_versions(qn): ${qnErr.message}`);
    const qnByUnit = new Map<string, string>();
    for (const r of (qnRows ?? []) as {
      text_unit_id: string;
      text: string;
    }[]) {
      const t = (r.text ?? "").trim();
      if (t) qnByUnit.set(r.text_unit_id, t); // ordered asc → last = latest
      else qnByUnit.delete(r.text_unit_id);
    }
    const unitIds = [...qnByUnit.keys()];
    if (unitIds.length === 0) {
      return NextResponse.json({ suggestions: {} });
    }

    // 2. Those units: page (→ document scope) + qn_uncertain flag.
    const unitMeta = new Map<
      string,
      { pageId: string; qnUncertain: boolean }
    >();
    for (const part of chunk(unitIds, IN_CHUNK)) {
      const { data, error } = await db
        .from("text_units")
        .select("id, page_id, qn_uncertain")
        .in("id", part);
      if (error) throw new Error(`text_units: ${error.message}`);
      for (const u of (data ?? []) as {
        id: string;
        page_id: string;
        qn_uncertain: boolean;
      }[]) {
        unitMeta.set(u.id, {
          pageId: u.page_id,
          qnUncertain: !!u.qn_uncertain,
        });
      }
    }
    const pageIds = [...new Set([...unitMeta.values()].map((m) => m.pageId))];
    const pageDoc = new Map<string, string>();
    for (const part of chunk(pageIds, IN_CHUNK)) {
      const { data, error } = await db
        .from("pages")
        .select("id, document_id")
        .in("id", part);
      if (error) throw new Error(`pages: ${error.message}`);
      for (const p of (data ?? []) as {
        id: string;
        document_id: string;
      }[]) {
        pageDoc.set(p.id, p.document_id);
      }
    }

    // 3. Glyph = latest non-QN version per unit (same rule as getPage).
    const glyphByUnit = new Map<string, string>();
    for (const part of chunk(unitIds, IN_CHUNK)) {
      const { data, error } = await db
        .from("text_versions")
        .select("text_unit_id, text, source, created_at")
        .in("text_unit_id", part)
        .neq("source", SRC_QN)
        .order("created_at");
      if (error) throw new Error(`text_versions(manuscript): ${error.message}`);
      for (const v of (data ?? []) as {
        text_unit_id: string;
        text: string;
      }[]) {
        const t = (v.text ?? "").trim();
        if (t) glyphByUnit.set(v.text_unit_id, t); // asc → last = latest
      }
    }

    // 4. Aggregate (glyph, qn) → count / uncertainCount, split by scope.
    const textBucket = new Map<string, Map<string, Stat>>();
    const globalBucket = new Map<string, Map<string, Stat>>();

    function bump(
      bucket: Map<string, Map<string, Stat>>,
      glyph: string,
      qn: string,
      uncertain: boolean
    ) {
      let g = bucket.get(glyph);
      if (!g) {
        g = new Map();
        bucket.set(glyph, g);
      }
      const s = g.get(qn) ?? { count: 0, uncertainCount: 0 };
      s.count += 1;
      if (uncertain) s.uncertainCount += 1;
      g.set(qn, s);
    }

    for (const [unitId, qn] of qnByUnit) {
      const glyph = glyphByUnit.get(unitId);
      if (!glyph) continue;
      const meta = unitMeta.get(unitId);
      if (!meta) continue;
      const docId = pageDoc.get(meta.pageId);
      const isThisDoc = thisDocId != null && docId === thisDocId;
      if (isThisDoc) bump(textBucket, glyph, qn, meta.qnUncertain);
      else bump(globalBucket, glyph, qn, meta.qnUncertain);
    }

    // 5. Merge per qn_suggestions.merged_suggestions semantics.
    const toSorted = (m: Map<string, Stat>, sc: "text" | "global") =>
      [...m.entries()]
        .map(([qn, s]) => ({
          qn,
          count: s.count,
          uncertainCount: s.uncertainCount,
          scope: sc,
        }))
        .sort((a, b) => b.count - a.count || a.qn.localeCompare(b.qn));

    const out: Record<
      string,
      Array<{
        qn: string;
        count: number;
        uncertainCount: number;
        scope: "text" | "global";
      }>
    > = {};

    if (scope === "text") {
      for (const [glyph, m] of textBucket) {
        out[glyph] = toSorted(m, "text").slice(0, max);
      }
    } else if (scope === "global") {
      for (const [glyph, m] of globalBucket) {
        out[glyph] = toSorted(m, "global").slice(0, max);
      }
    } else {
      const glyphs = new Set([
        ...textBucket.keys(),
        ...globalBucket.keys(),
      ]);
      for (const glyph of glyphs) {
        const textItems = toSorted(
          textBucket.get(glyph) ?? new Map(),
          "text"
        );
        const seen = new Set(textItems.map((it) => it.qn));
        const globalItems = toSorted(
          globalBucket.get(glyph) ?? new Map(),
          "global"
        ).filter((it) => !seen.has(it.qn));
        out[glyph] = [...textItems, ...globalItems].slice(0, max);
      }
    }

    return NextResponse.json({ suggestions: out });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
