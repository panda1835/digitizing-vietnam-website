import { NextRequest, NextResponse } from "next/server";
import { getDocTextForExport, getManifest } from "@/lib/ocr-store-supabase";
import { buildColumnLines } from "@/lib/reading-order";

/**
 * GET /api/admin/ocr/export-txt/<slug>
 *
 * Whole-document plain-text export. Used by DocExportButtons on the
 * document dashboard and the Edit Documents list.
 *
 * Shape:
 *   - One line per confirmed column, in Han-Nôm reading order
 *     (top→bottom within a column, R→L across columns).
 *   - Pages separated by a blank line.
 *   - Punctuation cells are stripped (corpus policy).
 *
 * Performance: backed by getDocTextForExport(), which is a constant
 * number of batched round trips against the denormalized
 * `current_text` column — no per-page walks, no text_versions
 * reconstruction. Latency scales with content size, not page count.
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
    const pages = await getDocTextForExport(slug);
    const text =
      pages
        .map((p) => buildColumnLines(p.spatialData, p.columns).join("\n"))
        .filter((s) => s.length > 0)
        .join("\n\n") + "\n";

    return new NextResponse(text, {
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
