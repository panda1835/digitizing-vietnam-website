import { NextRequest, NextResponse } from "next/server";
import { createIiifDocument, makeSlug } from "@/lib/ocr-store-supabase";
import { getCanvasesFromManifest, resolveOcrImageUrl } from "@/lib/iiif-utils";

/**
 * POST /api/admin/ocr/import-iiif
 *
 * Self-originating import: given a IIIF Presentation manifest URL, create
 * a document + blank pages in the Supabase `ocr` schema. Pages carry the
 * resolved image URL only — no OCR data; OCR is run in-app afterward.
 *
 * Body (JSON): { manifestUrl: string, title?: string, slug?: string }
 * Returns: { slug, pageCount }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const manifestUrl: unknown = body.manifestUrl;
    if (typeof manifestUrl !== "string" || !/^https?:\/\//.test(manifestUrl)) {
      return NextResponse.json(
        { error: "manifestUrl (http[s] URL) is required" },
        { status: 400 }
      );
    }

    const res = await fetch(manifestUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch IIIF manifest: HTTP ${res.status}` },
        { status: 502 }
      );
    }
    const manifest = await res.json();

    // Manifest label → default title (API 2 string or API 3 lang map).
    const rawLabel = manifest.label;
    const manifestTitle =
      typeof rawLabel === "string"
        ? rawLabel
        : rawLabel?.en?.[0] ?? rawLabel?.["@value"] ?? null;

    const canvases = getCanvasesFromManifest(manifest);
    const withImages = canvases.filter((c) => c.imageUrl);
    if (withImages.length === 0) {
      return NextResponse.json(
        { error: "No canvases with resolvable images in manifest" },
        { status: 422 }
      );
    }

    // Resolve each canvas to the best image URL (Level-0 info.json aware).
    const pages = await Promise.all(
      withImages.map(async (c, i) => ({
        pageNumber: i + 1,
        imageUrl: await resolveOcrImageUrl(c.imageUrl as string),
      }))
    );

    const title =
      (typeof body.title === "string" && body.title.trim()) ||
      manifestTitle ||
      "Untitled IIIF document";
    const slug =
      (typeof body.slug === "string" && body.slug.trim()) || makeSlug(title);

    const result = await createIiifDocument({
      slug,
      title,
      manifestUrl,
      pages,
    });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "import failed" },
      { status: 500 }
    );
  }
}
