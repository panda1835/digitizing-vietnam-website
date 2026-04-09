import { NextRequest, NextResponse } from "next/server";
import { getIndex, setIndexEntry } from "@/lib/ocr-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const index = await getIndex();
  const entry = index[params.slug] ?? null;
  if (!entry) {
    return NextResponse.json({ status: "none", pageCount: 0 });
  }
  return NextResponse.json(entry);
}

/**
 * PATCH /api/ocr/status/[slug]
 * Body: { status?: string }
 * Update the status of a document.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const index = await getIndex();
  if (!index[params.slug]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const validStatuses = ["queued", "pending", "processing", "partial", "complete", "corrected", "error"];
  if (body.status && validStatuses.includes(body.status)) {
    await setIndexEntry(params.slug, { status: body.status });
  }

  const updated = await getIndex();
  return NextResponse.json(updated[params.slug]);
}
