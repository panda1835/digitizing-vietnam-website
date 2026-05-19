import { NextRequest, NextResponse } from "next/server";
import { resolvePageImage } from "@/lib/ocr-store-supabase";

/**
 * GET /api/admin/ocr/page-image/<slug>/<page>
 *
 * Serves a page image as raw bytes. With the Supabase store every page
 * carries an image URL (IIIF resolved, or a Storage URL for PDF/upload),
 * so this proxies the upstream bytes rather than redirecting — the
 * response shape stays uniform and cross-origin canvas reads (training
 * export, crop-OCR) keep working via the `*` CORS header.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string; page: string } }
) {
  const slug = decodeURIComponent(params.slug);
  const page = parseInt(params.page, 10);
  if (!page || page < 1) {
    return NextResponse.json({ error: "invalid page" }, { status: 400 });
  }

  const src = await resolvePageImage(slug, page);
  if (!src || src.kind !== "iiif" || !src.url) {
    return NextResponse.json(
      { error: `No image for ${slug} page ${page}` },
      { status: 404 }
    );
  }

  try {
    const upstream = await fetch(src.url);
    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: `Upstream image fetch failed: HTTP ${upstream.status}`,
          source: src.url,
        },
        { status: 502 }
      );
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    const ct = upstream.headers.get("content-type") ?? "image/jpeg";
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: `Image proxy failed: ${e.message}` },
      { status: 502 }
    );
  }
}
