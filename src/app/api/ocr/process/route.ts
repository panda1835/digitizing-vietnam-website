import { NextRequest, NextResponse } from "next/server";
import { setIndexEntry, setPage, computeRawText } from "@/lib/ocr-store";
import { visionToSpatialData } from "@/lib/vision-to-spatial";
import fs from "fs/promises";
import path from "path";

/**
 * POST /api/ocr/process
 * Body: { slug: string }
 *
 * Reads data/ocr/{slug}/source.pdf, sends it to Google Cloud Vision
 * batchAnnotateFiles (up to ~20MB synchronously), and writes
 * data/ocr/{slug}/page_NNN.json for each page.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_CLOUD_VISION_API_KEY not configured" },
      { status: 500 }
    );
  }

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

  const pdfBase64 = pdfBuffer.toString("base64");

  // Call Vision API - batchAnnotateFiles handles multi-page PDFs synchronously
  const visionUrl = `https://vision.googleapis.com/v1/files:annotate?key=${apiKey}`;
  const visionBody = {
    requests: [
      {
        inputConfig: {
          content: pdfBase64,
          mimeType: "application/pdf",
        },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        imageContext: {
          languageHints: ["zh-Hant", "vi", "zh"],
        },
        // Process all pages (Vision caps at 5 for sync; use async for larger docs)
        pages: [],
      },
    ],
  };

  let visionRes: Response;
  try {
    visionRes = await fetch(visionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visionBody),
    });
  } catch {
    await setIndexEntry(slug, { status: "error" });
    return NextResponse.json({ error: "Failed to reach Vision API" }, { status: 502 });
  }

  if (!visionRes.ok) {
    const text = await visionRes.text();
    await setIndexEntry(slug, { status: "error" });
    return NextResponse.json(
      { error: `Vision API error: ${visionRes.status}`, detail: text },
      { status: 502 }
    );
  }

  const visionData = await visionRes.json();
  const responses: any[] =
    visionData?.responses?.[0]?.responses ?? [];

  if (!responses.length) {
    await setIndexEntry(slug, { status: "error" });
    return NextResponse.json({ error: "No pages returned by Vision API" }, { status: 502 });
  }

  let pageCount = 0;
  for (let i = 0; i < responses.length; i++) {
    const pageResp = responses[i];
    const annotation = pageResp?.fullTextAnnotation ?? null;
    const pageNum = i + 1;

    if (!annotation) {
      // Write empty page
      await setPage(slug, pageNum, {
        pageNumber: pageNum,
        rawText: "",
        spatialData: [],
      });
    } else {
      const pageWidth = annotation.pages?.[0]?.width ?? 1000;
      const pageHeight = annotation.pages?.[0]?.height ?? 1000;
      const { spatialData, candidateData } = visionToSpatialData(annotation, pageWidth, pageHeight);
      const rawText = computeRawText(spatialData);
      await setPage(slug, pageNum, { pageNumber: pageNum, rawText, spatialData, candidateData });
    }
    pageCount = pageNum;
  }

  await setIndexEntry(slug, { status: "complete", pageCount });

  return NextResponse.json({ success: true, slug, pageCount });
}
