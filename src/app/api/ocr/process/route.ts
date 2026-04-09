import { NextRequest, NextResponse } from "next/server";
import { setIndexEntry, setPage, computeRawText, rebuildSearchIndex } from "@/lib/ocr-store";
import { callKandianguji } from "@/lib/kandianguji-ocr";
import { pdf } from "pdf-to-img";
import fs from "fs/promises";
import path from "path";

/**
 * POST /api/ocr/process
 * Body: { slug: string }
 *
 * Reads data/ocr/{slug}/source.pdf, converts each page to an image,
 * sends it to Kandianguji OCR, and writes data/ocr/{slug}/page_NNN.json
 * for each page.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const slug: string = body?.slug;
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const pdfPath = path.join(process.cwd(), "data", "ocr", slug, "source.pdf");
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await fs.readFile(pdfPath);
  } catch {
    return NextResponse.json(
      { error: `PDF not found for slug "${slug}". Upload it first.` },
      { status: 404 }
    );
  }

  await setIndexEntry(slug, { status: "processing" });

  try {
    const doc = await pdf(pdfBuffer, { scale: 2 });

    let pageCount = 0;
    let pageNum = 0;

    for await (const pageImage of doc) {
      pageNum++;
      const imageBase64 = pageImage.toString("base64");

      try {
        const result = await callKandianguji(imageBase64);
        const rawText = computeRawText(result.spatialData);
        await setPage(slug, pageNum, {
          pageNumber: pageNum,
          rawText,
          spatialData: result.spatialData,
          candidateData: result.candidateData,
        });
      } catch {
        // Write empty page on error
        await setPage(slug, pageNum, {
          pageNumber: pageNum,
          rawText: "",
          spatialData: [],
        });
      }
      pageCount = pageNum;
    }

    await setIndexEntry(slug, { status: "complete", pageCount });
    try { await rebuildSearchIndex(slug, pageCount); } catch { /* non-critical */ }
    return NextResponse.json({ success: true, slug, pageCount });
  } catch (e: any) {
    await setIndexEntry(slug, { status: "error" });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
