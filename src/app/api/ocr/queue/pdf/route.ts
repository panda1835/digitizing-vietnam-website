import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getIndex, setIndexEntry, uploadSourcePath } from "@/lib/ocr-store";

/**
 * POST /api/ocr/queue/pdf
 * Body: { slug: string }
 *
 * Flips an existing PDF-upload entry's status to "queued" so the unified
 * batch pipeline (src/lib/ocr-pipeline.ts) picks it up on its next run.
 * Validates the entry exists, is sourced from a PDF upload, and that the
 * source.pdf file is actually on disk before queueing.
 */
export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const index = await getIndex();
    const entry = index[slug];
    if (!entry) {
      return NextResponse.json({ error: `No entry for "${slug}"` }, { status: 404 });
    }
    if (entry.source !== "pdf") {
      return NextResponse.json(
        { error: `Entry "${slug}" is not a PDF upload` },
        { status: 400 }
      );
    }

    // Verify the source file exists at either the new or legacy location so
    // a queued entry can't end up un-runnable.
    const newPath = uploadSourcePath(slug);
    const legacyPath = path.join(process.cwd(), "data", "ocr", slug, "source.pdf");
    let sourceExists = false;
    try {
      await fs.access(newPath);
      sourceExists = true;
    } catch {
      try {
        await fs.access(legacyPath);
        sourceExists = true;
      } catch {
        sourceExists = false;
      }
    }
    if (!sourceExists) {
      return NextResponse.json(
        { error: `source.pdf not found on disk for "${slug}"` },
        { status: 404 }
      );
    }

    await setIndexEntry(slug, { status: "queued" });
    return NextResponse.json({ slug, status: "queued" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
