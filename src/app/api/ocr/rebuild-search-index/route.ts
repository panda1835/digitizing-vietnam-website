import { NextResponse } from "next/server";
import { getIndex, rebuildSearchIndex } from "@/lib/ocr-store";

/**
 * POST /api/ocr/rebuild-search-index
 *
 * Rebuilds the _search.json index for all OCR documents.
 * Run this once to create indexes for existing documents.
 */
export async function POST() {
  const index = await getIndex();
  let rebuilt = 0;
  const errors: string[] = [];

  for (const [slug, entry] of Object.entries(index)) {
    if (entry.pageCount <= 0) continue;
    if (entry.status !== "partial" && entry.status !== "complete" && entry.status !== "corrected") continue;

    try {
      await rebuildSearchIndex(slug, entry.pageCount);
      rebuilt++;
    } catch (e: any) {
      errors.push(`${slug}: ${e.message}`);
    }
  }

  return NextResponse.json({ rebuilt, errors: errors.length > 0 ? errors : undefined });
}
