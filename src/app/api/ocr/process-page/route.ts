import { NextRequest, NextResponse } from "next/server";
import { callKandianguji } from "@/lib/kandianguji-ocr";

/**
 * POST /api/ocr/process-page
 *
 * Accepts a single image (multipart/form-data, field "image") or
 * a base64-encoded image string (JSON body: { imageBase64, mimeType }).
 *
 * Runs Kandianguji OCR and returns { spatialData, rawText, pageWidth, pageHeight }.
 */
export async function POST(req: NextRequest) {
  let imageBase64: string;
  let detMode = "auto";
  let detLayout = true;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }
    const buffer = await file.arrayBuffer();
    imageBase64 = Buffer.from(buffer).toString("base64");

    const detModeField = formData.get("det_mode");
    if (detModeField && typeof detModeField === "string") detMode = detModeField;
    const detLayoutField = formData.get("det_layout");
    if (detLayoutField === "false") detLayout = false;
  } else {
    const body = await req.json();
    if (!body.imageBase64) {
      return NextResponse.json({ error: "No imageBase64 provided" }, { status: 400 });
    }
    imageBase64 = body.imageBase64;
    if (body.det_mode) detMode = body.det_mode;
    if (body.det_layout === false) detLayout = false;
  }

  try {
    const result = await callKandianguji(imageBase64, { detMode, detLayout });
    return NextResponse.json(result);
  } catch (e: any) {
    const status = e.message?.includes("not set") ? 500 : 502;
    return NextResponse.json({ error: e.message }, { status });
  }
}
