import { NextRequest, NextResponse } from "next/server";
import { getManifest, listPages } from "@/lib/ocr-store-supabase";
import { buildRawText } from "@/lib/reading-order";

/**
 * GET /api/admin/ocr/export-txt/<slug>
 *
 * Whole-document plain-text export. The per-page editor used to expose a
 * "Download .txt" for the open page only; export is now document-level
 * (Edit Documents list + per-document OCR browser), so this assembles
 * every page's reading-order text in page order.
 *
 * Reading order per page = buildRawText(spatialData) (same function the
 * editor used), so column order / newlines match what you saw in Step 2.
 * Pages are separated by a blank line.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = decodeURIComponent(params.slug);
    const manifest = await getManifest(slug);
    if (!manifest) {
      return NextResponse.json(
        { error: `Document "${slug}" not found` },
        { status: 404 }
      );
    }
    const pages = await listPages(slug);
    const text = pages
      .map((p) => buildRawText(p.spatialData).trimEnd())
      .join("\n\n");

    return new NextResponse(text + "\n", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}.txt"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "export failed" },
      { status: 500 }
    );
  }
}
