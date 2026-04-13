import { NextRequest, NextResponse } from "next/server";
import { callKandianguji } from "@/lib/kandianguji-ocr";
import { callKimHanNom, callHybridOcr } from "@/lib/kimhannom-ocr";

/**
 * POST /api/ocr/process-page
 *
 * Accepts a single image (multipart/form-data, field "image") or
 * a base64-encoded image string (JSON body: { imageBase64, mimeType }).
 *
 * Runs OCR using the selected engine and returns { spatialData, rawText, pageWidth, pageHeight }.
 */
export async function POST(req: NextRequest) {
  let imageBase64: string;
  let detMode = "auto";
  let detLayout = true;
  let engine = "kandianguji";
  let kimToken = "";
  let kimOcrId = 1;
  let kimLangType = 2;
  let kimEpitaph = 0;

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

    const engineField = formData.get("engine");
    if (engineField && typeof engineField === "string") engine = engineField;
    const tokenField = formData.get("kim_token");
    if (tokenField && typeof tokenField === "string") kimToken = tokenField;
    const ocrIdField = formData.get("kim_ocr_id");
    if (ocrIdField && typeof ocrIdField === "string") kimOcrId = parseInt(ocrIdField, 10) || 1;
    const langTypeField = formData.get("kim_lang_type");
    if (langTypeField && typeof langTypeField === "string") kimLangType = parseInt(langTypeField, 10) || 2;
    const epitaphField = formData.get("kim_epitaph");
    if (epitaphField && typeof epitaphField === "string") kimEpitaph = parseInt(epitaphField, 10) || 0;
  } else {
    const body = await req.json();
    if (!body.imageBase64) {
      return NextResponse.json({ error: "No imageBase64 provided" }, { status: 400 });
    }
    imageBase64 = body.imageBase64;
    if (body.det_mode) detMode = body.det_mode;
    if (body.det_layout === false) detLayout = false;
    if (body.engine) engine = body.engine;
    if (body.kim_token) kimToken = body.kim_token;
    if (body.kim_ocr_id) kimOcrId = body.kim_ocr_id;
    if (body.kim_lang_type) kimLangType = body.kim_lang_type;
    if (body.kim_epitaph) kimEpitaph = body.kim_epitaph;
  }

  try {
    if (engine === "kimhannom" || engine === "hybrid") {
      if (!kimToken) {
        return NextResponse.json(
          { error: "Kim Hán Nôm token is required. Log in at kimhannom.fit.hcmus.edu.vn and copy the token from browser cookies." },
          { status: 400 }
        );
      }

      if (engine === "hybrid") {
        const result = await callHybridOcr(imageBase64, {
          token: kimToken,
          ocrId: kimOcrId,
          langType: kimLangType,
          epitaph: kimEpitaph,
          detMode,
          detLayout,
        });
        return NextResponse.json(result);
      }

      const result = await callKimHanNom(imageBase64, {
        token: kimToken,
        ocrId: kimOcrId,
        langType: kimLangType,
        epitaph: kimEpitaph,
      });
      return NextResponse.json(result);
    }

    const result = await callKandianguji(imageBase64, { detMode, detLayout });
    return NextResponse.json(result);
  } catch (e: any) {
    const status = e.message?.includes("not set") ? 500 : 502;
    return NextResponse.json({ error: e.message }, { status });
  }
}
