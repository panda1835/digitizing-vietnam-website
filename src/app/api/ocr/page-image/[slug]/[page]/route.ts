import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { pdf } from "pdf-to-img";
import { uploadDir, uploadSourcePath } from "@/lib/ocr-store";

/**
 * GET /api/ocr/page-image/[slug]/[page]
 *
 * Serves the page image for a document.
 *
 * Cache-first: looks for `page_NNN.jpg|jpeg|png` under data/uploads/{slug}/
 * (PDF uploads) or data/ocr/{slug}/ (IIIF or pre-move PDFs). If not cached,
 * and a source.pdf exists, renders the requested page on demand via
 * pdf-to-img, writes it to data/uploads/{slug}/page_NNN.png, and serves it.
 * Subsequent requests hit the cache.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string; page: string } }
) {
  const pageNum = parseInt(params.page, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    return new NextResponse("Invalid page", { status: 400 });
  }

  const pageStr = String(pageNum).padStart(3, "0");
  const candidateDirs = [
    path.join(process.cwd(), "data", "uploads", params.slug),
    path.join(process.cwd(), "data", "ocr", params.slug),
  ];

  for (const docDir of candidateDirs) {
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
        // try next extension / dir
      }
    }
  }

  // ── Lazy render from source.pdf ──
  // No cached image. If this is a PDF-upload entry whose source.pdf is on
  // disk, render the requested page now, cache it, and serve. This keeps
  // already-processed PDFs (which only have JSON pages, no PNGs) working
  // without forcing the user to re-run OCR.
  const newPdfPath = uploadSourcePath(params.slug);
  const legacyPdfPath = path.join(process.cwd(), "data", "ocr", params.slug, "source.pdf");

  let pdfBuffer: Buffer | null = null;
  let cacheDir: string;
  try {
    pdfBuffer = await fs.readFile(newPdfPath);
    cacheDir = uploadDir(params.slug);
  } catch {
    try {
      pdfBuffer = await fs.readFile(legacyPdfPath);
      // Even pre-move PDFs cache their lazy-rendered images under uploads/
      // so we have a single source of truth going forward.
      cacheDir = uploadDir(params.slug);
    } catch {
      return new NextResponse("Image not found", { status: 404 });
    }
  }

  try {
    const doc = await pdf(pdfBuffer, { scale: 2 });
    if (pageNum > doc.length) {
      return new NextResponse(`Page ${pageNum} out of range (1-${doc.length})`, { status: 404 });
    }
    const buf = await doc.getPage(pageNum);
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(path.join(cacheDir, `page_${pageStr}.png`), buf);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e: any) {
    return new NextResponse(`Failed to render PDF page: ${e.message}`, { status: 500 });
  }
}
