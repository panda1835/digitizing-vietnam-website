import { NextRequest, NextResponse } from "next/server";
import { visionToSpatialData, spatialDataToRawText } from "@/lib/vision-to-spatial";
import { getCanvasesFromManifest } from "@/lib/iiif-utils";
import { setPage, setIndexEntry, getIndex, computeRawText } from "@/lib/ocr-store";

/**
 * POST /api/ocr/test-iiif-page
 *
 * Tests OCR on a single page from a IIIF manifest.
 * Body: { manifestUrl: string, pageIndex: number, slug?: string }
 * If slug is provided, saves the result to disk for that page.
 * Returns: { spatialData, rawText, pageWidth, pageHeight, imageUrl }
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_CLOUD_VISION_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { manifestUrl, pageIndex, slug } = await req.json();
  if (!manifestUrl || pageIndex == null) {
    return NextResponse.json(
      { error: "Missing manifestUrl or pageIndex" },
      { status: 400 }
    );
  }

  // Fetch manifest and get image URL for the requested page
  const manifestRes = await fetch(manifestUrl);
  if (!manifestRes.ok) {
    return NextResponse.json({ error: "Failed to fetch manifest" }, { status: 502 });
  }
  const manifest = await manifestRes.json();
  const canvases = getCanvasesFromManifest(manifest);

  if (pageIndex < 0 || pageIndex >= canvases.length) {
    return NextResponse.json(
      { error: `pageIndex ${pageIndex} out of range (0-${canvases.length - 1})` },
      { status: 400 }
    );
  }

  const canvas = canvases[pageIndex];
  if (!canvas.imageUrl) {
    return NextResponse.json({ error: "No image URL found for this canvas" }, { status: 404 });
  }

  // Fetch the image and convert to base64
  const imageRes = await fetch(canvas.imageUrl);
  if (!imageRes.ok) {
    return NextResponse.json(
      { error: `Failed to fetch image: ${imageRes.status}` },
      { status: 502 }
    );
  }
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  const imageBase64 = imageBuffer.toString("base64");

  // Call Vision API
  const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  const visionBody = {
    requests: [
      {
        image: { content: imageBase64 },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        imageContext: { languageHints: ["zh-Hant", "vi", "zh"] },
      },
    ],
  };

  const visionRes = await fetch(visionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(visionBody),
  });

  if (!visionRes.ok) {
    const text = await visionRes.text();
    return NextResponse.json(
      { error: `Vision API error: ${visionRes.status}`, detail: text },
      { status: 502 }
    );
  }

  const visionData = await visionRes.json();
  const annotation = visionData?.responses?.[0]?.fullTextAnnotation ?? null;

  if (!annotation) {
    return NextResponse.json({
      spatialData: [],
      rawText: "",
      imageUrl: canvas.imageUrl,
      message: "No text detected",
    });
  }

  const pageWidth = annotation.pages?.[0]?.width ?? 1000;
  const pageHeight = annotation.pages?.[0]?.height ?? 1000;
  const spatialData = visionToSpatialData(annotation, pageWidth, pageHeight);
  const rawText = spatialDataToRawText(spatialData);

  // If a slug is provided, persist the OCR result for this page
  let saved = false;
  if (slug) {
    const pageNumber = pageIndex + 1;
    await setPage(slug, pageNumber, {
      pageNumber,
      rawText,
      spatialData,
    });
    // Update index pageCount to reflect total canvases
    const index = await getIndex();
    const current = index[slug];
    if (current) {
      await setIndexEntry(slug, {
        pageCount: canvases.length,
        status: current.status === "queued" ? "pending" : current.status,
      });
    }
    saved = true;
  }

  // Count chars with bboxes for diagnostics
  const charsWithBbox = spatialData.filter((c: any) => c.bbox && c.text.trim()).length;

  return NextResponse.json({
    spatialData,
    rawText,
    pageWidth,
    pageHeight,
    imageUrl: canvas.imageUrl,
    canvasLabel: canvas.label,
    totalCanvases: canvases.length,
    saved,
    charsWithBbox,
    totalChars: spatialData.length,
  });
}
