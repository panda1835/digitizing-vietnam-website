import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

/**
 * GET /api/ocr/page-image/[slug]/[page]
 *
 * Serves the extracted page image from data/ocr/{slug}/page_{N}.jpg (or .png).
 * Falls back to a placeholder if the image doesn't exist.
 *
 * Note: Images are extracted from PDFs during the OCR process. If not yet
 * extracted, the reading workshop falls back to the IIIF manifest image.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string; page: string } }
) {
  const pageNum = parseInt(params.page, 10);
  if (isNaN(pageNum)) {
    return new NextResponse("Invalid page", { status: 400 });
  }

  const pageStr = String(pageNum).padStart(3, "0");
  const docDir = path.join(process.cwd(), "data", "ocr", params.slug);

  // Try jpg, then png
  for (const ext of ["jpg", "jpeg", "png"]) {
    const imgPath = path.join(docDir, `page_${pageStr}.${ext}`);
    try {
      const buf = await fs.readFile(imgPath);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": ext === "png" ? "image/png" : "image/jpeg",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      // try next extension
    }
  }

  // No image found
  return new NextResponse("Image not found", { status: 404 });
}
