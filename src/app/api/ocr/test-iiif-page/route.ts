import { NextRequest, NextResponse } from "next/server";
import { callKandianguji } from "@/lib/kandianguji-ocr";
import { getCanvasesFromManifest, resolveOcrImageUrl } from "@/lib/iiif-utils";
import { setPage, setIndexEntry, getIndex, computeRawText } from "@/lib/ocr-store";

/**
 * POST /api/ocr/test-iiif-page
 *
 * Tests OCR on a single page from a IIIF manifest using Kandianguji OCR.
 * Body: { manifestUrl: string, pageIndex: number, slug?: string }
 * If slug is provided, saves the result to disk for that page.
 * Returns: { spatialData, rawText, pageWidth, pageHeight, imageUrl }
 */
export async function POST(req: NextRequest) {
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
  const resolvedUrl = await resolveOcrImageUrl(canvas.imageUrl);
  const imageRes = await fetch(resolvedUrl);
  if (!imageRes.ok) {
    return NextResponse.json(
      { error: `Failed to fetch image: ${imageRes.status}` },
      { status: 502 }
    );
  }
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  const imageBase64 = imageBuffer.toString("base64");

  try {
    const result = await callKandianguji(imageBase64);
    const { spatialData, candidateData, rawText, pageWidth, pageHeight } = result;

    // If a slug is provided, persist the OCR result for this page
    let saved = false;
    if (slug) {
      const pageNumber = pageIndex + 1;
      await setPage(slug, pageNumber, {
        pageNumber,
        rawText,
        spatialData,
        candidateData,
      });
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
  } catch (e: any) {
    const status = e.message?.includes("not set") ? 500 : 502;
    return NextResponse.json({ error: e.message }, { status });
  }
}
