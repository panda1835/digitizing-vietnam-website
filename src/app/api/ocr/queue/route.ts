import { NextRequest, NextResponse } from "next/server";
import { getIndex, setIndexEntry } from "@/lib/ocr-store";
import { getHanNomManifestEntryByItemId } from "@/lib/han-nom-collection";

export async function POST(req: NextRequest) {
  try {
    const { itemId } = await req.json();
    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    const entry = getHanNomManifestEntryByItemId(itemId);
    if (!entry) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const slug = `han-nom-${itemId}`;

    // Check if already queued
    const index = await getIndex();
    if (index[slug]) {
      return NextResponse.json({ slug, status: index[slug].status, alreadyExists: true });
    }

    await setIndexEntry(slug, {
      status: "queued",
      pageCount: 0,
      collectionSlug: "han-nom-collection",
      source: "iiif",
      manifestUrl: entry.manifestUrl,
      title: entry.title,
      itemId: entry.itemId,
    });

    return NextResponse.json({ slug, status: "queued" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const index = await getIndex();
    const entry = index[slug];
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    delete index[slug];

    const fs = await import("fs/promises");
    const path = await import("path");
    const indexFile = path.join(process.cwd(), "data", "ocr", "_index.json");
    await fs.writeFile(indexFile, JSON.stringify(index, null, 2), "utf-8");

    // Clean up per-doc data dirs. PDF uploads keep their source.pdf and page
    // JSON under data/uploads/{slug}/, so wipe both locations — the second
    // call is a safe no-op if the directory doesn't exist.
    const ocrDocDir = path.join(process.cwd(), "data", "ocr", slug);
    await fs.rm(ocrDocDir, { recursive: true, force: true }).catch(() => {});
    if (entry.source === "pdf") {
      const uploadsDocDir = path.join(process.cwd(), "data", "uploads", slug);
      await fs.rm(uploadsDocDir, { recursive: true, force: true }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
