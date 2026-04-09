import { NextRequest, NextResponse } from "next/server";
import { getIndex, getPage, getSearchIndex } from "@/lib/ocr-store";

/**
 * GET /api/ocr/search/{slug}?q=query
 *
 * Searches all pages of an OCR document for the given query.
 * Uses the prebuilt search index when available for speed.
 * Returns matches with page number and a context snippet.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  const { slug } = params;
  const index = await getIndex();

  // Try slug as-is, then with han-nom- prefix
  const actualSlug = index[slug] ? slug : index[`han-nom-${slug}`] ? `han-nom-${slug}` : slug;
  const entry = index[actualSlug];
  if (!entry || entry.pageCount <= 0) {
    return NextResponse.json({ results: [] });
  }

  const queryLower = q.toLowerCase();
  const results: Array<{ page: number; snippet: string; matchCount: number }> = [];
  const CONTEXT_RADIUS = 20;

  function processText(text: string, pageNum: number) {
    const textLower = text.toLowerCase();
    let matchCount = 0;
    let firstIdx = -1;

    let searchFrom = 0;
    while (searchFrom < textLower.length) {
      const idx = textLower.indexOf(queryLower, searchFrom);
      if (idx === -1) break;
      if (firstIdx === -1) firstIdx = idx;
      matchCount++;
      searchFrom = idx + 1;
    }

    if (matchCount > 0 && firstIdx >= 0) {
      const start = Math.max(0, firstIdx - CONTEXT_RADIUS);
      const end = Math.min(text.length, firstIdx + q!.length + CONTEXT_RADIUS);
      let snippet = text.slice(start, end).replace(/\n/g, " ");
      if (start > 0) snippet = "…" + snippet;
      if (end < text.length) snippet = snippet + "…";
      results.push({ page: pageNum, snippet, matchCount });
    }
  }

  // Fast path: in-memory cached search index
  const searchIdx = await getSearchIndex(actualSlug);
  if (searchIdx) {
    for (const pg of searchIdx.pages) {
      if (!pg.textLower.includes(queryLower)) continue;
      processText(pg.text, pg.page);
    }
    return NextResponse.json({ results, query: q });
  }

  // Slow fallback: individual page files
  for (let p = 1; p <= entry.pageCount; p++) {
    const page = await getPage(actualSlug, p);
    if (!page || !page.rawText) continue;
    processText(page.rawText, p);
  }

  return NextResponse.json({ results, query: q });
}
