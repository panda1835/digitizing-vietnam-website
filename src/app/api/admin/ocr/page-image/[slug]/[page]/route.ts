import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { pageImageFile } from "@/lib/ocr-store";

/**
 * GET /api/admin/ocr/page-image/<slug>/<page>
 *
 * Serves the saved page image for an admin-stored doc. Tries common
 * extensions (png, jpg, jpeg, webp, tif, tiff) since the saver writes
 * the upload's original extension, not a normalized one.
 */
const EXTENSIONS = ["png", "jpg", "jpeg", "webp", "tif", "tiff"] as const;
const CONTENT_TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  tif: "image/tiff",
  tiff: "image/tiff",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string; page: string } }
) {
  const slug = decodeURIComponent(params.slug);
  const page = parseInt(params.page, 10);
  if (!page || page < 1) {
    return NextResponse.json({ error: "invalid page" }, { status: 400 });
  }

  for (const ext of EXTENSIONS) {
    const p = pageImageFile(slug, page, ext);
    try {
      const buf = await fs.readFile(p);
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": CONTENT_TYPE[ext] ?? "application/octet-stream",
          "Cache-Control": "no-cache",
        },
      });
    } catch (e: any) {
      if (e?.code === "ENOENT") continue;
      throw e;
    }
  }

  return NextResponse.json(
    { error: `No image file at ${pageImageFile(slug, page, "<ext>")}` },
    { status: 404 }
  );
}
