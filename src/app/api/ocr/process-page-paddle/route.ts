import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ocr/process-page-paddle
 *
 * Proxies OCR requests to the local PaddleOCR Flask service.
 * Accepts same input as /api/ocr/process-page (multipart form with "image" field).
 * Returns same output format: { spatialData, rawText, pageWidth, pageHeight }
 */
const PADDLE_OCR_URL = process.env.PADDLE_OCR_URL || "http://localhost:5555/ocr";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const lang = formData.get("lang")?.toString() || "chinese_cht";

    // Forward to PaddleOCR service
    const proxyForm = new FormData();
    proxyForm.append("image", file);
    proxyForm.append("lang", lang);

    const res = await fetch(PADDLE_OCR_URL, {
      method: "POST",
      body: proxyForm,
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `PaddleOCR service error: ${res.status}`, detail: text },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    if (e.cause?.code === "ECONNREFUSED") {
      return NextResponse.json(
        { error: "PaddleOCR service not running. Start it with: python services/paddle-ocr/server.py" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
