import { NextRequest, NextResponse } from "next/server";
import { callKandianguji } from "@/lib/kandianguji-ocr";

/**
 * POST /api/admin/ocr/run
 *
 * Runs Kandianguji OCR on a single image. Used by the admin OCR test
 * page. The Nôm Na Việt re-OCR pass runs client-side after this returns
 * (see src/lib/nomnaviet-ocr.ts).
 *
 * Accepts:
 *   - multipart/form-data: { image: File, det_mode?, det_layout? }
 *   - JSON: { imageBase64: string, det_mode?: string, det_layout?: boolean }
 *
 * Returns: { spatialData, candidateData, rawText, pageWidth, pageHeight }
 *
 * Requires KANDIANGUJI_TOKEN and KANDIANGUJI_EMAIL env vars.
 */
export async function POST(req: NextRequest) {
  let imageBase64: string;
  let detMode = "auto";
  // Default OFF (see kandianguji-ocr.ts): layout output is unused and
  // det_layout:true returns fewer glyphs. `true` is now explicit opt-in.
  let detLayout = false;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }
    const buffer = await file.arrayBuffer();
    imageBase64 = Buffer.from(buffer).toString("base64");

    const detModeField = formData.get("det_mode");
    if (typeof detModeField === "string") detMode = detModeField;
    const detLayoutField = formData.get("det_layout");
    if (detLayoutField === "true") detLayout = true;
  } else {
    const body = await req.json();
    if (!body.imageBase64) {
      return NextResponse.json(
        { error: "No imageBase64 provided" },
        { status: 400 }
      );
    }
    imageBase64 = body.imageBase64;
    if (body.det_mode) detMode = body.det_mode;
    if (body.det_layout === true) detLayout = true;
  }

  try {
    const result = await callKandianguji(imageBase64, { detMode, detLayout });
    return NextResponse.json(result);
  } catch (e: any) {
    const status = e.message?.includes("not set") ? 500 : 502;
    return NextResponse.json({ error: e.message }, { status });
  }
}
