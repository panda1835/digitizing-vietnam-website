import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import {
  resolvePageImage,
  imageContentType,
} from "@/lib/ocr-store";

/**
 * GET /api/admin/ocr/page-image/<slug>/<page>
 *
 * Serves the page image as raw bytes regardless of where it physically
 * lives. Resolution is handled by ocr-store.resolvePageImage which
 * picks among:
 *
 *   - Local new layout (pages/NNN.<ext>)
 *   - Local legacy layout (page_NNN.<ext>)
 *   - IIIF (canvas image URL via the index entry's manifestUrl)
 *
 * Future storage backends (DB, S3) plug into resolvePageImage by
 * adding a PageImageSource variant; this route doesn't change.
 *
 * For IIIF the bytes are proxied (not 302-redirected) so the response
 * shape is the same as the local case. That keeps cross-origin canvas
 * operations like training-data export working without a CORS dance.
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
  if (!src) {
    return NextResponse.json(
      { error: `No image for ${slug} page ${page}` },
      { status: 404 }
    );
  }

  if (src.kind === "file") {
    try {
      const buf = await fs.readFile(src.path);
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": imageContentType(src.ext),
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (e: any) {
      return NextResponse.json(
        { error: `Failed to read ${src.path}: ${e.message}` },
        { status: 500 }
      );
    }
  }

  // IIIF: proxy the upstream image so the response is byte-for-byte
  // identical in shape to the local case. Includes CORS so canvas-
  // based exports (cropBboxToPixelArray) can read pixels back.
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
        // Cache IIIF more aggressively — these don't change often.
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: `IIIF proxy failed: ${e.message}` },
      { status: 502 }
    );
  }
}
