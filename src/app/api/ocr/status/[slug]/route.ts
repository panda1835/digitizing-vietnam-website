import { NextRequest, NextResponse } from "next/server";
import { getIndex } from "@/lib/ocr-store";

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
