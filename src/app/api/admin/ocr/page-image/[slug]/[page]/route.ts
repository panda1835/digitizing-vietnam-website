import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import {
  pageImageFile,
  legacyPageImageFile,
  listIndex,
} from "@/lib/ocr-store";
import { getCanvasesFromManifest, resolveOcrImageUrl } from "@/lib/iiif-utils";

/**
 * GET /api/admin/ocr/page-image/<slug>/<page>
 *
 * Serves the page image for an admin-stored doc. Resolution order:
 *
 *   1. data/ocr/<slug>/pages/<NNN>.<ext>          (new layout)
 *   2. data/ocr/<slug>/page_<NNN>.<ext>           (legacy pipeline layout,
 *                                                  used by PDF-uploaded
 *                                                  docs in the older
 *                                                  branch)
 *   3. IIIF manifest from the index entry's manifestUrl, redirect to
 *      the canvas image URL for page N. Used for legacy IIIF-sourced
 *      docs that never had local images on disk.
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

async function trySend(filePath: string, ext: string) {
  try {
    const buf = await fs.readFile(filePath);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPE[ext] ?? "application/octet-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e: any) {
    if (e?.code === "ENOENT") return null;
    throw e;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string; page: string } }
) {
  const slug = decodeURIComponent(params.slug);
  const page = parseInt(params.page, 10);
  if (!page || page < 1) {
    return NextResponse.json({ error: "invalid page" }, { status: 400 });
  }

  // 1) New layout
  for (const ext of EXTENSIONS) {
    const res = await trySend(pageImageFile(slug, page, ext), ext);
    if (res) return res;
  }

  // 2) Legacy local layout (page_NNN.<ext> directly under <slug>/)
  for (const ext of EXTENSIONS) {
    const res = await trySend(legacyPageImageFile(slug, page, ext), ext);
    if (res) return res;
  }

  // 3) Legacy IIIF: redirect to the canvas image URL via the index's
  //    manifestUrl. The index entry shape from the older pipeline
  //    carries `manifestUrl` and `source: "iiif"`.
  const idx = await listIndex();
  const entry = idx[slug] as
    | { manifestUrl?: string; source?: string }
    | undefined;
  if (entry?.manifestUrl) {
    try {
      const mres = await fetch(entry.manifestUrl);
      if (mres.ok) {
        const manifest = await mres.json();
        const canvases = getCanvasesFromManifest(manifest);
        const canvas = canvases[page - 1];
        if (canvas?.imageUrl) {
          const url = await resolveOcrImageUrl(canvas.imageUrl);
          return NextResponse.redirect(url, 302);
        }
      }
    } catch {
      /* fall through to 404 */
    }
  }

  return NextResponse.json(
    { error: `No image for ${slug} page ${page}` },
    { status: 404 }
  );
}
