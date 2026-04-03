import { NextRequest, NextResponse } from "next/server";
import { visionToSpatialData, spatialDataToRawText } from "@/lib/vision-to-spatial";

/**
 * POST /api/ocr/process-page
 *
 * Accepts a single image (multipart/form-data, field "image") or
 * a base64-encoded image string (JSON body: { imageBase64, mimeType }).
 *
 * Runs Google Cloud Vision DOCUMENT_TEXT_DETECTION and returns
 * { spatialData, rawText } — no files written to disk.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_CLOUD_VISION_API_KEY not configured" },
      { status: 500 }
    );
  }

  let imageBase64: string;
  let mimeType = "image/jpeg";

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }
    mimeType = file.type || "image/jpeg";
    const buffer = await file.arrayBuffer();
    imageBase64 = Buffer.from(buffer).toString("base64");
  } else {
    const body = await req.json();
    if (!body.imageBase64) {
      return NextResponse.json({ error: "No imageBase64 provided" }, { status: 400 });
    }
    imageBase64 = body.imageBase64;
    mimeType = body.mimeType ?? "image/jpeg";
  }

  // Call Google Cloud Vision REST API
  const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  const visionBody = {
    requests: [
      {
        image: { content: imageBase64 },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        imageContext: {
          languageHints: ["zh-Hant", "vi", "zh"],
        },
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
  } catch (e) {
    return NextResponse.json({ error: "Failed to reach Vision API" }, { status: 502 });
  }

  if (!visionRes.ok) {
    const text = await visionRes.text();
    return NextResponse.json(
      { error: `Vision API error: ${visionRes.status}`, detail: text },
      { status: 502 }
    );
  }

  const visionData = await visionRes.json();
  const annotation =
    visionData?.responses?.[0]?.fullTextAnnotation ?? null;

  if (!annotation) {
    return NextResponse.json({
      spatialData: [],
      rawText: "",
      message: "No text detected",
    });
  }

  const pageWidth = annotation.pages?.[0]?.width ?? 1000;
  const pageHeight = annotation.pages?.[0]?.height ?? 1000;

  const spatialData = visionToSpatialData(annotation, pageWidth, pageHeight);
  const rawText = spatialDataToRawText(spatialData);

  return NextResponse.json({ spatialData, rawText, pageWidth, pageHeight });
}
