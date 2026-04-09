import { NextRequest, NextResponse } from "next/server";
import { getPage } from "@/lib/ocr-store";

/**
 * POST /api/ocr/suggest
 * Body: { slug, page, offset } or { char, choices }
 *
 * Returns alternative character suggestions from the kandianguji OCR choices
 * stored in the spatial data.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug, page: pageNum, offset, choices: directChoices } = body;

  // Direct choices mode — used by the quick OCR test page
  if (directChoices && Array.isArray(directChoices)) {
    return NextResponse.json({ suggestions: directChoices });
  }

  // Lookup mode — used by the full OCR editor
  if (!slug || pageNum == null || offset == null) {
    return NextResponse.json(
      { error: "Missing slug, page, or offset (or provide choices directly)" },
      { status: 400 }
    );
  }

  const pageData = await getPage(slug, parseInt(pageNum, 10));
  if (!pageData) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const char = pageData.spatialData.find((c) => c.offset === offset);
  if (!char || !char.text.trim()) {
    return NextResponse.json({ error: "Character not found at offset" }, { status: 404 });
  }

  const suggestions = char.choices ?? [];
  return NextResponse.json({ suggestions, originalChar: char.text });
}
