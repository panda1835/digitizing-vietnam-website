import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy for IIIF manifests that sorts canvases numerically by label.
 * The backend sorts canvases lexicographically, which puts "page011a"
 * before "page01a". This route fixes the order.
 *
 * Usage: /api/manifest?url=<encoded-manifest-url>
 */

function parseLabel(label: string): { num: number; side: string } {
  const m = label.match(/^page0*(\d+)([ab]?)$/i);
  if (m) return { num: parseInt(m[1], 10), side: m[2].toLowerCase() };
  const m2 = label.match(/^image\s*0*(\d+)$/i);
  if (m2) return { num: parseInt(m2[1], 10), side: "" };
  const m3 = label.match(/(\d+)/);
  if (m3) return { num: parseInt(m3[1], 10), side: "" };
  return { num: -1, side: "" };
}

function getLabel(canvas: any): string {
  const label = canvas.label;
  if (typeof label === "string") return label;
  return label?.["@value"] ?? label?.en?.[0] ?? "";
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch manifest" }, { status: res.status });
    }

    const manifest = await res.json();

    // Sort canvases in-place — supports IIIF Presentation API 2 and 3
    const canvases: any[] | undefined =
      manifest.items ?? manifest.sequences?.[0]?.canvases;

    if (canvases && canvases.length > 0) {
      canvases.sort((a: any, b: any) => {
        const pa = parseLabel(getLabel(a));
        const pb = parseLabel(getLabel(b));
        if (pa.num !== pb.num) return pa.num - pb.num;
        return pa.side < pb.side ? -1 : pa.side > pb.side ? 1 : 0;
      });
    }

    return NextResponse.json(manifest, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
