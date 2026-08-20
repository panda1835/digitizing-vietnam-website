// src/app/api/corpus/search/route.ts
import { NextRequest, NextResponse } from "next/server";

import { getSources } from "@/lib/corpus/local-store";
import { runSearch, type SearchMode } from "@/lib/corpus/retrieval";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODES: SearchMode[] = ["exact", "keyword", "semantic", "hybrid"];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = params.get("q") ?? "";
  const requested = (params.get("mode") ?? "hybrid") as SearchMode;
  const mode = MODES.includes(requested) ? requested : "hybrid";
  const slug = params.get("slug") ?? undefined;
  const limit = Math.min(200, Number(params.get("limit") ?? 50) || 50);

  const sources = getSources();
  if (!query.trim()) {
    return NextResponse.json({ query, mode, sources, results: [], total: 0 });
  }

  try {
    const results = await runSearch({
      query,
      mode,
      slug,
      limit,
      apiKey: process.env.GEMINI_API_KEY ?? null,
    });
    return NextResponse.json({ query, mode, sources, results, total: results.length });
  } catch (error: any) {
    // A semantic failure should not take the whole search down — say what
    // happened and let the caller fall back to keyword.
    return NextResponse.json(
      { query, mode, sources, results: [], total: 0, error: error?.message ?? "Search failed" },
      { status: 500 }
    );
  }
}
