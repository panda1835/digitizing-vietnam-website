import { NextRequest, NextResponse } from "next/server";
import { getPage } from "@/lib/ocr-store";

// ── Slug → searchable-text API mapping ──

const TRUYEN_KIEU_VERSIONS: Record<string, string> = {
  "truyen-kieu-1866": "1866",
  "truyen-kieu-1870": "1870",
  "truyen-kieu-1871": "1871",
  "truyen-kieu-1872": "1872",
  "truyen-kieu-1902": "1902",
};

const DVSKTT_BOOKS: Record<string, string> = {
  "quyen-thu": "0",
  "ngoai-ky": "1",
  "ban-ky-toan-thu": "2",
  "ban-ky-thuc-luc": "3",
  "ban-ky-tuc-bien": "4",
};

// ── TEI XML text extraction helpers ──

/** Extract interleaved Han-Nom + Vietnamese lines from TEI div structure. */
function extractTeiLines(divs: any[]): string {
  if (!divs || divs.length < 2) return "";
  const lines: string[] = [];
  const hanNomLines: any[] = divs[0]?.lg?.[0]?.l ?? [];
  const vietLines: any[] = divs[1]?.lg?.[0]?.l ?? [];
  const len = Math.max(hanNomLines.length, vietLines.length);
  for (let i = 0; i < len; i++) {
    const han = (hanNomLines[i] as any)?._?.trim() ?? "";
    const viet = (vietLines[i] as any)?._?.trim() ?? "";
    if (han) lines.push(han);
    if (viet) lines.push(viet);
    if (han || viet) lines.push("");
  }
  return lines.join("\n").trim();
}

// ── Per-document text fetchers ──

async function fetchTruyenKieu(version: string, page: number): Promise<string | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  const res = await fetch(
    `${apiBase}/searchable-text/truyen-kieu?version=${version}&page=${page}`,
    { next: { revalidate: 60 * 60 } }
  );
  if (!res.ok) return null;
  const { text } = await res.json();
  return extractTeiLines(text?.div) || null;
}

async function fetchLucVanTien(page: number): Promise<string | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  const res = await fetch(
    `${apiBase}/searchable-text/luc-van-tien?page=${page}`,
    { next: { revalidate: 60 * 60 } }
  );
  if (!res.ok) return null;
  const { text } = await res.json();
  // LVT wraps divs in text.page
  return extractTeiLines(text?.page?.div) || null;
}

async function fetchChinhPhuNgam(page: number): Promise<string | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  const res = await fetch(
    `${apiBase}/searchable-text/chinh-phu-ngam-khuc?page=${page}`,
    { next: { revalidate: 60 * 60 } }
  );
  if (!res.ok) return null;
  const { text } = await res.json();
  // CPN wraps divs in text.page — has 4 divs (Han, Nom romanized, Chinese, Vietnamese)
  const divs = text?.page?.div;
  if (!divs) return null;
  // Use first two divs (Han-Nom + Vietnamese romanized) same pattern as Truyen Kieu
  return extractTeiLines(divs) || null;
}

async function fetchDVSKTT(book: string, page: number): Promise<string | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  // DVSKTT requires a topic param — default to topic 1 for simple page-based access
  const res = await fetch(
    `${apiBase}/searchable-text/dai-viet-su-ky-toan-thu?book=${book}&page=${page}&topic=1`,
    { next: { revalidate: 60 * 60 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  // DVSKTT returns flat string fields
  const parts: string[] = [];
  if (data.nom) parts.push(data.nom);
  if (data.phienAm) parts.push("", data.phienAm.replace(/@/g, "\n"));
  if (data.quocNgu) parts.push("", data.quocNgu.replace(/<[^>]*>/g, "").trim());
  return parts.join("\n").trim() || null;
}

// ── Main handler ──

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string; page: string } }
) {
  const { slug, page: pageStr } = params;
  const page = parseInt(pageStr, 10);
  if (isNaN(page) || page < 1) {
    return NextResponse.json({ text: null }, { status: 400 });
  }

  let text: string | null = null;

  try {
    // Truyện Kiều (all editions)
    const kieuVersion = TRUYEN_KIEU_VERSIONS[slug];
    if (kieuVersion) {
      text = await fetchTruyenKieu(kieuVersion, page);
    }

    // Lục Vân Tiên
    if (!text && slug === "van-tien-co-tich-tan-truyen") {
      text = await fetchLucVanTien(page);
    }

    // Chinh Phụ Ngâm Khúc
    if (!text && slug === "chinh-phu-ngam-khuc") {
      text = await fetchChinhPhuNgam(page);
    }

    // Đại Việt Sử Ký Toàn Thư (5 books)
    const dvskttBook = DVSKTT_BOOKS[slug];
    if (!text && dvskttBook !== undefined) {
      text = await fetchDVSKTT(dvskttBook, page);
    }
  } catch {
    // fall through to OCR
  }

  // Fall back to OCR data (try both the slug and han-nom-prefixed slug)
  if (text === null) {
    let ocrPage = await getPage(slug, page);
    if (!ocrPage) ocrPage = await getPage(`han-nom-${slug}`, page);
    if (ocrPage) {
      text = ocrPage.rawText ?? "";

      // Also return structured column data with commentary sections
      try {
        const { detectColumns } = await import("@/components/ocr-editor/useColumnDetection");
        const columns = detectColumns(ocrPage.spatialData, "commentary");
        const structuredColumns = columns.map((col) => ({
          index: col.index,
          isRow: col.isRow,
          sections: col.sections.map((sec) => ({
            type: sec.type,
            text: sec.chars.map((c) => c.text).join(""),
          })),
        }));
        // Use column-detected order for text (rawText may have wrong order from OCR API)
        const columnText = structuredColumns
          .map((col) => col.sections.map((s) => s.text).join(""))
          .join("\n");
        return NextResponse.json({ text: columnText || text, columns: structuredColumns });
      } catch {
        return NextResponse.json({ text });
      }
    }
  }

  if (text !== null) {
    return NextResponse.json({ text });
  }

  return NextResponse.json({ text: null });
}
