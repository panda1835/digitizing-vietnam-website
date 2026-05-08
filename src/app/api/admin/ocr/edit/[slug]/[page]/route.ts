import { NextRequest, NextResponse } from "next/server";
import {
  getPage,
  setPage,
  type SpatialCharacter,
  type ConfirmedColumn,
  type OcrPageData,
} from "@/lib/ocr-store";
import { buildRawText } from "@/lib/reading-order";

/**
 * PUT /api/admin/ocr/edit/<slug>/<page>
 *
 * Save updated page data for an admin-stored doc. Body (JSON):
 *   { spatialData, columns?, columnsConfirmedAt?, charsConfirmedAt? }
 *
 * Merges with the existing page record so untouched fields (image
 * dimensions, candidateData, etc.) survive.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string; page: string } }
) {
  try {
    const slug = decodeURIComponent(params.slug);
    const page = parseInt(params.page, 10);
    if (!page || page < 1) {
      return NextResponse.json({ error: "invalid page" }, { status: 400 });
    }

    const body = (await req.json()) as {
      spatialData?: SpatialCharacter[];
      columns?: ConfirmedColumn[];
      columnsConfirmedAt?: string | null;
      charsConfirmedAt?: string | null;
    };

    const existing = await getPage(slug, page);
    if (!existing) {
      return NextResponse.json(
        { error: `Page ${page} of "${slug}" not found` },
        { status: 404 }
      );
    }

    const next: OcrPageData = {
      ...existing,
      spatialData: body.spatialData ?? existing.spatialData,
      rawText: buildRawText(body.spatialData ?? existing.spatialData),
    };
    if (body.columns !== undefined) next.columns = body.columns;
    if (body.columnsConfirmedAt !== undefined) {
      if (body.columnsConfirmedAt === null) delete next.columnsConfirmedAt;
      else next.columnsConfirmedAt = body.columnsConfirmedAt;
    }
    if (body.charsConfirmedAt !== undefined) {
      if (body.charsConfirmedAt === null) delete next.charsConfirmedAt;
      else next.charsConfirmedAt = body.charsConfirmedAt;
    }

    await setPage(slug, page, next);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
