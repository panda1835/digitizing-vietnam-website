import { NextRequest, NextResponse } from "next/server";
import { setIndexEntry } from "@/lib/ocr-store";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("pdf") as File | null;
  const slug = (formData.get("slug") as string | null)?.trim();
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const collectionSlug = (formData.get("collectionSlug") as string | null)?.trim() ?? "uploads";

  if (!file || !slug) {
    return NextResponse.json(
      { error: "Missing pdf or slug" },
      { status: 400 }
    );
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Only PDF files are accepted" },
      { status: 400 }
    );
  }

  const docDir = path.join(process.cwd(), "data", "ocr", slug);
  await fs.mkdir(docDir, { recursive: true });

  const destPath = path.join(docDir, "source.pdf");
  const buffer = await file.arrayBuffer();
  await fs.writeFile(destPath, Buffer.from(buffer));

  await setIndexEntry(slug, {
    status: "pending",
    pageCount: 0,
    collectionSlug,
    source: "pdf",
    title: title || slug,
  });

  return NextResponse.json({ success: true, slug, path: destPath });
}
