import { NextRequest, NextResponse } from "next/server";
import {
  getPage,
  setPage,
  type SpatialCharacter,
  type ConfirmedColumn,
  type OcrPageData,
} from "@/lib/ocr-store-supabase";
import { buildRawText } from "@/lib/reading-order";

// Live admin DB I/O — never statically cache or prerender this handler.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/ocr/edit/<slug>/<page>
 *
 * Read one page's OcrPageData (spatialData, columns, workflow flags).
 * Used by the dashboard batch runner to load existing glyphs for the
 * "Nôm Na Việt only" pass and to preserve columns across a Kandi re-run.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string; page: string } }
) {
  try {
    const slug = decodeURIComponent(params.slug);
    const page = parseInt(params.page, 10);
    if (!page || page < 1) {
      return NextResponse.json({ error: "invalid page" }, { status: 400 });
    }
    const data = await getPage(slug, page);
    if (!data) {
      return NextResponse.json(
        { error: `Page ${page} of "${slug}" not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

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
      quocNguConfirmedAt?: string | null;
      nnvCompletedAt?: string | null;
      imageWidth?: number;
      imageHeight?: number;
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
    if (body.quocNguConfirmedAt !== undefined) {
      if (body.quocNguConfirmedAt === null) delete next.quocNguConfirmedAt;
      else next.quocNguConfirmedAt = body.quocNguConfirmedAt;
    }
    if (body.nnvCompletedAt !== undefined) {
      if (body.nnvCompletedAt === null) delete next.nnvCompletedAt;
      else next.nnvCompletedAt = body.nnvCompletedAt;
    }
    if (typeof body.imageWidth === "number") next.imageWidth = body.imageWidth;
    if (typeof body.imageHeight === "number") {
      next.imageHeight = body.imageHeight;
    }

    // The NNV pass is the only save that carries a fresh non-null
    // nnvCompletedAt (DocOcrRunner's consumer + EditorClient.handleRunNnv
    // are the only callers that set it). Tag this save's text-change
    // versions as 'nnv' so they aren't recorded as if the human typed
    // them. Regular editor saves don't include nnvCompletedAt → 'human'.
    const isNnvPass =
      body.nnvCompletedAt !== undefined && body.nnvCompletedAt !== null;

    await setPage(slug, page, next, isNnvPass ? { machineSource: "nnv" } : undefined);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
