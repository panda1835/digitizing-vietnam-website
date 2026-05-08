import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import JSZip from "jszip";
import {
  setManifest,
  setPage,
  makeSlug,
  pageImageFile,
  type DocumentManifest,
  type OcrPageData,
} from "@/lib/ocr-store";
import { getCanvasesFromManifest, resolveOcrImageUrl } from "@/lib/iiif-utils";

/**
 * POST /api/admin/ocr/import
 *
 * Import an OCR doc into admin storage from one of two sources:
 *
 *   mode = "zip"  — body has a zip with images + JSONs in the
 *                   nom-ocr-training shape (manifest.json + pages/NNN.
 *                   {json,png,jpg}). All needed files inside the zip.
 *
 *   mode = "iiif" — body has a zip of just the JSONs (and optionally
 *                   manifest.json) plus a manifestUrl pointing at a
 *                   IIIF Presentation manifest. Page images are
 *                   downloaded from the manifest's canvases.
 *
 * Body (multipart/form-data):
 *   mode         — "zip" | "iiif"
 *   zip          — File (the upload)
 *   manifestUrl  — string (required for mode=iiif)
 *   slug?        — override the auto-generated slug
 *   title?       — override the manifest title
 *
 * Returns: { slug, pageCount, imagesFromZip, imagesFromIiif, skipped }
 */
const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "tif", "tiff"] as const;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const mode = formData.get("mode");
    if (mode !== "zip" && mode !== "iiif") {
      return NextResponse.json(
        { error: 'mode must be "zip" or "iiif"' },
        { status: 400 }
      );
    }
    const zipFile = formData.get("zip") as File | null;
    if (!zipFile) {
      return NextResponse.json(
        { error: "zip file is required" },
        { status: 400 }
      );
    }
    const manifestUrl = formData.get("manifestUrl");
    if (mode === "iiif" && (typeof manifestUrl !== "string" || !manifestUrl)) {
      return NextResponse.json(
        { error: "manifestUrl is required for mode=iiif" },
        { status: 400 }
      );
    }
    const slugOverride = (formData.get("slug") as string | null) || null;
    const titleOverride = (formData.get("title") as string | null) || null;

    const zipBuffer = Buffer.from(await zipFile.arrayBuffer());
    const zip = await JSZip.loadAsync(zipBuffer);

    // Detect if everything is wrapped in a single top-level directory
    // (the natural shape of a folder-zipped data/documents/<slug>/).
    const topLevelDirs = new Set<string>();
    let hasRootManifest = false;
    zip.forEach((relPath) => {
      if (relPath === "manifest.json") hasRootManifest = true;
      const slash = relPath.indexOf("/");
      if (slash > 0) topLevelDirs.add(relPath.substring(0, slash));
    });
    let prefix = "";
    if (!hasRootManifest && topLevelDirs.size === 1) {
      prefix = `${[...topLevelDirs][0]}/`;
    }

    const manifestRaw = await zip
      .file(`${prefix}manifest.json`)
      ?.async("string");
    let zipManifest: any = null;
    if (manifestRaw) {
      try {
        zipManifest = JSON.parse(manifestRaw);
      } catch {
        return NextResponse.json(
          { error: "manifest.json in zip is not valid JSON" },
          { status: 400 }
        );
      }
    }

    // Discover page numbers from any pages/NNN.json files in the zip.
    const pagesPrefix = `${prefix}pages/`;
    const pageNums = new Set<number>();
    zip.forEach((relPath) => {
      if (!relPath.startsWith(pagesPrefix)) return;
      const m = relPath
        .slice(pagesPrefix.length)
        .match(/^(\d+)\.json$/);
      if (m) pageNums.add(parseInt(m[1], 10));
    });
    const pageNumsArr = [...pageNums].sort((a, b) => a - b);
    if (pageNumsArr.length === 0) {
      return NextResponse.json(
        { error: "No pages/NNN.json files found in zip" },
        { status: 400 }
      );
    }

    // Pull JSONs + (optional) image bytes out of the zip.
    type StagedPage = {
      num: number;
      json: OcrPageData;
      imageBytes?: Buffer;
      imageExt?: string;
    };
    const staged: StagedPage[] = [];
    for (const num of pageNumsArr) {
      const padded = String(num).padStart(3, "0");
      const jsonRaw = await zip
        .file(`${pagesPrefix}${padded}.json`)
        ?.async("string");
      if (!jsonRaw) continue;
      let pageJson: OcrPageData;
      try {
        pageJson = JSON.parse(jsonRaw) as OcrPageData;
      } catch {
        continue;
      }
      pageJson.pageNumber = num;

      let imageBytes: Buffer | undefined;
      let imageExt: string | undefined;
      for (const ext of IMAGE_EXTS) {
        const f = zip.file(`${pagesPrefix}${padded}.${ext}`);
        if (f) {
          imageBytes = Buffer.from(await f.async("uint8array"));
          imageExt = ext;
          break;
        }
      }
      staged.push({ num, json: pageJson, imageBytes, imageExt });
    }

    // For IIIF mode, fetch missing images from the manifest's canvases.
    let imagesFromIiif = 0;
    if (mode === "iiif" && typeof manifestUrl === "string") {
      const iiifRes = await fetch(manifestUrl);
      if (!iiifRes.ok) {
        return NextResponse.json(
          {
            error: `Failed to fetch IIIF manifest: HTTP ${iiifRes.status}`,
          },
          { status: 502 }
        );
      }
      const iiifManifest = await iiifRes.json();
      const canvases = getCanvasesFromManifest(iiifManifest);
      for (const page of staged) {
        if (page.imageBytes) continue;
        const canvas = canvases[page.num - 1];
        if (!canvas?.imageUrl) continue;
        const url = await resolveOcrImageUrl(canvas.imageUrl);
        try {
          const ir = await fetch(url);
          if (!ir.ok) continue;
          const buf = Buffer.from(await ir.arrayBuffer());
          page.imageBytes = buf;
          const ct = ir.headers.get("content-type") ?? "";
          page.imageExt = ct.includes("png") ? "png" : "jpg";
          imagesFromIiif++;
        } catch {
          /* skip — page just won't have an image until re-saved */
        }
      }
    }

    // Build the slug + manifest + write everything.
    const inferredTitle =
      titleOverride ||
      zipManifest?.title ||
      (prefix ? prefix.replace(/\/$/, "") : null) ||
      zipFile.name.replace(/\.zip$/i, "") ||
      "imported";
    const slug = slugOverride || makeSlug(inferredTitle);

    let imagesFromZip = 0;
    let skipped = 0;
    for (const page of staged) {
      if (page.imageBytes && page.imageExt) {
        const imagePath = pageImageFile(slug, page.num, page.imageExt);
        await fs.mkdir(path.dirname(imagePath), { recursive: true });
        await fs.writeFile(imagePath, page.imageBytes);
        if (mode === "zip") imagesFromZip++;
      } else if (mode === "zip") {
        skipped++;
      }
      await setPage(slug, page.num, page.json);
    }

    const now = new Date().toISOString();
    const dvnManifest: DocumentManifest = {
      title: inferredTitle,
      pageCount: zipManifest?.pageCount ?? pageNumsArr[pageNumsArr.length - 1],
      createdAt: zipManifest?.createdAt ?? now,
      lastEditedAt: now,
      sourceType: zipManifest?.sourceType ?? "upload",
    };
    await setManifest(slug, dvnManifest);

    return NextResponse.json({
      slug,
      pageCount: dvnManifest.pageCount,
      imagesFromZip: mode === "zip" ? imagesFromZip : 0,
      imagesFromIiif,
      skipped,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
