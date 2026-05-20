import { NextResponse } from "next/server";
import { buildUnencodedRegistry } from "@/lib/ocr-store-supabase";

/**
 * GET /api/admin/ocr/unencoded
 *
 * Walks every saved page and returns the unencoded-character registry —
 * one entry per distinct IDS string, with every source occurrence. Served
 * as a downloadable JSON attachment (the "Download JSON" button on the
 * unencoded page). Unlike nom-ocr-training there is no on-disk snapshot:
 * the Supabase store is the source of truth.
 *
 * Shape:
 *   {
 *     generatedAt: ISO,
 *     entries: [
 *       { ids, count, placeholders, notes,
 *         sources: [{ slug, page, offset, bbox, confidence, uncertain,
 *                     column }] },
 *       ...
 *     ]
 *   }
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entries = await buildUnencodedRegistry();
    const body = JSON.stringify(
      { generatedAt: new Date().toISOString(), entries },
      null,
      2
    );
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="unencoded.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "unencoded registry failed" },
      { status: 500 }
    );
  }
}
