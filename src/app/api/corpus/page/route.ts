// src/app/api/corpus/page/route.ts
import { NextRequest, NextResponse } from "next/server";

import { getPage, getSource } from "@/lib/corpus/local-store";
import { locateSpan } from "@/lib/corpus/locate-span";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const slug = params.get("slug");
  const pageNumber = Number(params.get("page") ?? 1);

  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });

  const source = getSource(slug);
  if (!source) return NextResponse.json({ error: "Unknown source" }, { status: 404 });

  const page = getPage(slug, pageNumber);
  if (!page) return NextResponse.json({ error: "Unknown page" }, { status: 404 });

  // Resolve the highlight. Offsets are trusted only when they still frame the
  // quoted text; otherwise the quote is re-located, and if that fails too the
  // client is told plainly rather than shown a highlight in the wrong place.
  const quote = params.get("q");
  const start = params.get("s") !== null ? Number(params.get("s")) : null;
  const end = params.get("e") !== null ? Number(params.get("e")) : null;

  let highlight: {
    start: number;
    end: number;
    match: string;
    similarity: number;
  } | null = null;
  let highlightFailed = false;

  if (start !== null && end !== null && start >= 0 && end <= page.text.length && end > start) {
    const framed = page.text.slice(start, end);
    if (!quote || framed === quote) {
      highlight = { start, end, match: "exact", similarity: 1 };
    }
  }

  if (!highlight && quote) {
    const located = locateSpan(page.text, quote, { hint: start ?? undefined });
    if (located) {
      highlight = {
        start: located.start,
        end: located.end,
        match: located.match,
        similarity: located.similarity,
      };
    } else {
      highlightFailed = true;
    }
  }

  return NextResponse.json({
    source: {
      slug: source.slug,
      title: source.title,
      author: source.author,
      year: source.year,
      pageCount: source.pageCount,
      provenance: source.provenance,
      meanConfidence: source.meanConfidence,
      isSpread: source.isSpread,
    },
    page: {
      pageNumber: page.pageNumber,
      pageLabel: page.pageLabel,
      text: page.text,
      confidence: page.confidence,
      method: page.method,
    },
    highlight,
    highlightFailed,
  });
}
