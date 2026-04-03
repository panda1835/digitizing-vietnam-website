import fs from "fs/promises";
import path from "path";

const OCR_DIR = path.join(process.cwd(), "data", "ocr");
const INDEX_FILE = path.join(OCR_DIR, "_index.json");

export interface OcrIndexEntry {
  status: "queued" | "pending" | "processing" | "complete" | "corrected" | "error";
  pageCount: number;
  collectionSlug: string;
  updatedAt: string;
  source?: "pdf" | "iiif";
  manifestUrl?: string;
  title?: string;
  itemId?: string;
}

export interface SpatialCharacter {
  text: string;
  bbox: Array<{ x: number; y: number }> | null; // 4 vertices
  confidence: number;
  offset: number;
}

export interface OcrPageData {
  pageNumber: number;
  rawText: string;
  spatialData: SpatialCharacter[];
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function pageFilename(pageNumber: number) {
  return `page_${String(pageNumber).padStart(3, "0")}.json`;
}

function docDir(slug: string) {
  return path.join(OCR_DIR, slug);
}

// --- Index ---

export async function getIndex(): Promise<Record<string, OcrIndexEntry>> {
  try {
    const raw = await fs.readFile(INDEX_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function setIndexEntry(
  slug: string,
  entry: Partial<OcrIndexEntry>
) {
  await ensureDir(OCR_DIR);
  const index = await getIndex();
  index[slug] = {
    ...(index[slug] ?? { status: "queued", pageCount: 0, collectionSlug: "" }),
    ...entry,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2), "utf-8");
}

// --- Pages ---

export async function getPage(
  slug: string,
  pageNumber: number
): Promise<OcrPageData | null> {
  const file = path.join(docDir(slug), pageFilename(pageNumber));
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as OcrPageData;
  } catch {
    return null;
  }
}

export async function setPage(
  slug: string,
  pageNumber: number,
  data: OcrPageData
) {
  const dir = docDir(slug);
  await ensureDir(dir);
  const file = path.join(dir, pageFilename(pageNumber));
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

export function computeRawText(spatialData: SpatialCharacter[]): string {
  return spatialData.map((c) => c.text).join("");
}
