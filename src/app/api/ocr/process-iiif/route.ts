import { NextRequest, NextResponse } from "next/server";
import { getIndex, setIndexEntry, setPage, computeRawText } from "@/lib/ocr-store";
import { visionToSpatialData } from "@/lib/vision-to-spatial";
import { getCanvasesFromManifest } from "@/lib/iiif-utils";

/**
 * POST /api/ocr/process-iiif
 *
 * Processes all (or a range of) pages of a IIIF manifest through Vision API.
 * Each canvas image is fetched individually, OCR'd, and saved.
 *
 * Body: { slug: string, startPage?: number, endPage?: number }
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_CLOUD_VISION_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { slug, startPage, endPage } = await req.json();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const index = await getIndex();
  const entry = index[slug];
  if (!entry || !entry.manifestUrl) {
    return NextResponse.json(
      { error: "No IIIF manifest URL found for this slug" },
      { status: 404 }
    );
  }

  // Update status to processing
  await setIndexEntry(slug, { status: "processing" });

  try {
    // Fetch manifest
    const manifestRes = await fetch(entry.manifestUrl);
    if (!manifestRes.ok) {
      await setIndexEntry(slug, { status: "error" });
      return NextResponse.json({ error: "Failed to fetch manifest" }, { status: 502 });
    }
    const manifest = await manifestRes.json();
    const canvases = getCanvasesFromManifest(manifest);

    const start = startPage ?? 1;
    const end = Math.min(endPage ?? canvases.length, canvases.length);

    let processedCount = 0;
    const errors: string[] = [];

    for (let i = start - 1; i < end; i++) {
      const canvas = canvases[i];
      if (!canvas.imageUrl) {
        errors.push(`Page ${i + 1}: no image URL`);
        continue;
      }

      try {
        // Fetch image
        const imageRes = await fetch(canvas.imageUrl);
        if (!imageRes.ok) {
          errors.push(`Page ${i + 1}: image fetch failed (${imageRes.status})`);
          continue;
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
          errors.push(`Page ${i + 1}: Vision API error (${visionRes.status})`);
          continue;
        }

        const visionData = await visionRes.json();
        const annotation = visionData?.responses?.[0]?.fullTextAnnotation;

        const pageWidth = annotation?.pages?.[0]?.width ?? 1000;
        const pageHeight = annotation?.pages?.[0]?.height ?? 1000;

        const spatialData = annotation
          ? visionToSpatialData(annotation, pageWidth, pageHeight)
          : [];
        const rawText = computeRawText(spatialData);

        await setPage(slug, i + 1, {
          pageNumber: i + 1,
          rawText,
          spatialData,
        });

        processedCount++;
      } catch (e: any) {
        errors.push(`Page ${i + 1}: ${e.message}`);
      }
    }

    // Update index
    await setIndexEntry(slug, {
      status: errors.length < canvases.length ? "complete" : "error",
      pageCount: canvases.length,
    });

    return NextResponse.json({
      success: true,
      slug,
      totalCanvases: canvases.length,
      processedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e: any) {
    await setIndexEntry(slug, { status: "error" });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
