// src/app/api/corpus/page-image/[slug]/[page]/route.ts
import { NextRequest, NextResponse } from "next/server";

import { imageKey, readImage } from "@/lib/corpus/storage";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; page: string } }
) {
  const pageNumber = Number(params.page);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const thumb = request.nextUrl.searchParams.get("thumb") === "1";
  const bytes = await readImage(imageKey(params.slug, pageNumber, thumb));

  if (!bytes) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(bytes as any, {
    headers: {
      "Content-Type": "image/webp",
      // Page images are immutable for a given ingest, so cache hard.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
