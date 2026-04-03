import { NextRequest, NextResponse } from "next/server";
import { getPage, setPage, computeRawText, OcrPageData, getIndex, setIndexEntry } from "@/lib/ocr-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string; page: string } }
) {
  const pageNum = parseInt(params.page, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    return NextResponse.json({ error: "Invalid page number" }, { status: 400 });
  }

  const data = await getPage(params.slug, pageNum);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string; page: string } }
) {
  const pageNum = parseInt(params.page, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    return NextResponse.json({ error: "Invalid page number" }, { status: 400 });
  }

  let body: Partial<OcrPageData>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = (await getPage(params.slug, pageNum)) ?? {
    pageNumber: pageNum,
    rawText: "",
    spatialData: [],
  };

  const updated: OcrPageData = {
    ...existing,
    ...body,
    pageNumber: pageNum,
    rawText: body.spatialData
      ? computeRawText(body.spatialData)
      : (body.rawText ?? existing.rawText),
  };

  await setPage(params.slug, pageNum, updated);

  // Mark document as "corrected" if it was previously "complete"
  const index = await getIndex();
  const entry = index[params.slug];
  if (entry && entry.status === "complete") {
    await setIndexEntry(params.slug, { status: "corrected" });
  }

  return NextResponse.json({ success: true, rawText: updated.rawText });
}
