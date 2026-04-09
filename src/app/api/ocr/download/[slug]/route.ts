import { NextRequest, NextResponse } from "next/server";
import { getIndex, getPage } from "@/lib/ocr-store";

/**
 * GET /api/ocr/download/[slug]
 *
 * Returns the full concatenated text of all OCR'd pages as a downloadable .txt file.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const index = await getIndex();
  const entry = index[params.slug];
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pages: string[] = [];
  for (let i = 1; i <= entry.pageCount; i++) {
    const page = await getPage(params.slug, i);
    if (page?.rawText) {
      pages.push(`--- Page ${i} ---\n${page.rawText}`);
    }
  }

  const fullText = pages.join("\n\n");
  const filename = `${entry.title ?? params.slug}.txt`;

  return new NextResponse(fullText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
