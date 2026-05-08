import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  setManifest,
  setPage,
  makeSlug,
  pageImageFile,
  type SpatialCharacter,
  type ConfirmedColumn,
  type DocumentManifest,
  type OcrPageData,
} from "@/lib/ocr-store";
import { buildRawText } from "@/lib/reading-order";

/**
 * POST /api/admin/ocr/save
 *
 * Persist a single-page OCR result from the test page into the admin
 * data store at data/ocr/<slug>/. Writes the page image, a manifest,
 * and a per-page JSON containing the spatialData (with uncertain / IDS
 * / noReadingForm metadata), confirmed columns, and image dimensions.
 *
 * Body (multipart/form-data):
 *   image    — File: the original page image
 *   payload  — JSON string: { title, slug?, spatialData, columns,
 *              imageWidth?, imageHeight? }
 *
 * Returns: { slug, ok }
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const payloadRaw = formData.get("payload");
    if (!file) {
      return NextResponse.json(
        { error: "Missing image file" },
        { status: 400 }
      );
    }
    if (typeof payloadRaw !== "string") {
      return NextResponse.json(
        { error: "Missing payload JSON" },
        { status: 400 }
      );
    }

    const payload = JSON.parse(payloadRaw) as {
      title: string;
      slug?: string;
      spatialData: SpatialCharacter[];
      columns: ConfirmedColumn[];
      imageWidth?: number;
      imageHeight?: number;
    };

    if (!payload.title || typeof payload.title !== "string") {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }
    if (!Array.isArray(payload.spatialData)) {
      return NextResponse.json(
        { error: "spatialData must be an array" },
        { status: 400 }
      );
    }

    const slug = payload.slug || makeSlug(payload.title);
    const extRaw = (file.name.split(".").pop() ?? "png").toLowerCase();
    const ext = extRaw.replace(/[^a-z0-9]/g, "") || "png";
    const buffer = Buffer.from(await file.arrayBuffer());
    const imagePath = pageImageFile(slug, 1, ext);

    await fs.mkdir(path.dirname(imagePath), { recursive: true });
    await fs.writeFile(imagePath, buffer);

    const now = new Date().toISOString();
    const manifest: DocumentManifest = {
      title: payload.title,
      pageCount: 1,
      createdAt: now,
      lastEditedAt: now,
      sourceType: "upload",
    };
    await setManifest(slug, manifest);

    const pageData: OcrPageData = {
      pageNumber: 1,
      rawText: buildRawText(payload.spatialData),
      spatialData: payload.spatialData,
      ...(payload.imageWidth ? { imageWidth: payload.imageWidth } : {}),
      ...(payload.imageHeight ? { imageHeight: payload.imageHeight } : {}),
      ...(payload.columns && payload.columns.length > 0
        ? { columns: payload.columns, columnsConfirmedAt: now }
        : {}),
    };
    // setPage refreshes the index entry as a side effect.
    await setPage(slug, 1, pageData);

    return NextResponse.json({ slug, ok: true, imageExt: ext });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
