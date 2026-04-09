import { NextRequest, NextResponse } from "next/server";
import { getPage } from "@/lib/ocr-store";

/**
 * Returns bounding boxes for characters matching a search query on an OCR page.
 * GET /api/ocr/highlight/{slug}/{page}?q=searchQuery
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; page: string } }
) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ highlights: [] });

  const pageNum = parseInt(params.page, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    return NextResponse.json({ highlights: [] });
  }

  // Try the slug as-is, then with han-nom- prefix
  let ocrPage = await getPage(params.slug, pageNum);
  if (!ocrPage) ocrPage = await getPage(`han-nom-${params.slug}`, pageNum);
  if (!ocrPage || !ocrPage.spatialData?.length) {
    return NextResponse.json({ highlights: [] });
  }

  const { rawText, spatialData } = ocrPage;

  // Find all occurrences of the query in rawText (case-insensitive, ignoring newlines)
  const flatText = rawText.replace(/\n/g, "");
  const queryLower = q.toLowerCase();
  const textLower = flatText.toLowerCase();

  const matchOffsets: Array<{ start: number; end: number }> = [];
  let searchFrom = 0;
  while (searchFrom < textLower.length) {
    const idx = textLower.indexOf(queryLower, searchFrom);
    if (idx === -1) break;
    matchOffsets.push({ start: idx, end: idx + q.length });
    searchFrom = idx + 1;
  }

  if (matchOffsets.length === 0) {
    return NextResponse.json({ highlights: [] });
  }

  // Build a map from flat offset (no newlines) to spatialData index
  // spatialData chars correspond to rawText chars (including \n), but offset field is based on rawText
  // We need to map flat offsets to rawText offsets
  const flatToRawOffset: number[] = [];
  for (let i = 0; i < rawText.length; i++) {
    if (rawText[i] !== "\n") {
      flatToRawOffset.push(i);
    }
  }

  // Build rawOffset → spatialData index lookup
  const rawOffsetToSpatial = new Map<number, number>();
  for (let i = 0; i < spatialData.length; i++) {
    rawOffsetToSpatial.set(spatialData[i].offset, i);
  }

  // Collect bounding boxes for each match
  const highlights: Array<Array<{ x: number; y: number }>> = [];

  for (const match of matchOffsets) {
    for (let flatIdx = match.start; flatIdx < match.end; flatIdx++) {
      const rawOffset = flatToRawOffset[flatIdx];
      if (rawOffset === undefined) continue;
      const spatialIdx = rawOffsetToSpatial.get(rawOffset);
      if (spatialIdx === undefined) continue;
      const char = spatialData[spatialIdx];
      if (char.bbox) {
        highlights.push(char.bbox);
      }
    }
  }

  return NextResponse.json({ highlights });
}
