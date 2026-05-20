import { NextRequest, NextResponse } from "next/server";
import {
  createPdfDocument,
  putPdfPage,
  makeSlug,
} from "@/lib/ocr-store-supabase";

/**
 * POST /api/admin/ocr/import-pdf
 *
 * Self-originating PDF import, one page per request. The client
 * (ImportPdfClient) rasterizes the PDF with pdf.js, JPEG-compresses each
 * page browser-side (resolution-clamped — keeps Storage small), and POSTs
 * the pages here sequentially:
 *
 *   page 1  — multipart { title, pageNumber:1, image }       → makeSlug,
 *             create the `documents` row, upload, page row → returns slug
 *   page n  — multipart { slug, title, pageNumber:n, image } → upload +
 *             upsert page row
 *
 * The raw PDF never reaches the server; only compressed page JPEGs go to
 * the `ocr-pages` Storage bucket. The DB stores just the public URL.
 *
 * Returns: { slug, pageCount }
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const image = form.get("image") as File | null;
    const title = (form.get("title") as string | null)?.trim() || "";
    const pageNumber = parseInt(
      (form.get("pageNumber") as string | null) ?? "",
      10
    );
    const givenSlug = (form.get("slug") as string | null)?.trim() || "";

    if (!image) {
      return NextResponse.json({ error: "image is required" }, { status: 400 });
    }
    if (!pageNumber || pageNumber < 1) {
      return NextResponse.json(
        { error: "pageNumber (>=1) is required" },
        { status: 400 }
      );
    }
    if (!givenSlug && !title) {
      return NextResponse.json(
        { error: "title is required for the first page" },
        { status: 400 }
      );
    }

    const slug = givenSlug || makeSlug(title);

    // Idempotent upsert — guarantees the document row exists regardless of
    // which page request lands first.
    await createPdfDocument({
      slug,
      title: title || slug,
    });

    const bytes = Buffer.from(await image.arrayBuffer());
    const { pageCount } = await putPdfPage({
      slug,
      pageNumber,
      bytes,
      contentType: image.type || "image/jpeg",
    });

    return NextResponse.json({ slug, pageCount });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "PDF import failed" },
      { status: 500 }
    );
  }
}
