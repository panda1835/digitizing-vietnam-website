import fs from "fs/promises";
import path from "path";

const OCR_DIR = path.join(process.cwd(), "data", "ocr");
const INDEX_FILE = path.join(OCR_DIR, "_index.json");

export interface OcrIndexEntry {
  status: "queued" | "pending" | "processing" | "partial" | "complete" | "corrected" | "error";
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
  /** Alternative character candidates from OCR (kandianguji choices) */
  choices?: string[];
}

export interface ColumnSection {
  type: "main" | "commentary";
  chars: SpatialCharacter[];
  bbox: { minX: number; maxX: number; minY: number; maxY: number };
  sectionIndex: number;
}

export interface OcrPageData {
  pageNumber: number;
  rawText: string;
  spatialData: SpatialCharacter[];
  /** OCR detections that were filtered out but may still be real characters. */
  candidateData?: SpatialCharacter[];
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

// --- Search index ---
// A single JSON file per document with all page texts for fast full-text search.
// Structure: { pages: Array<{ page: number; text: string }> }
// Also includes a pre-lowercased version for zero-allocation search.

export interface SearchIndexData {
  pages: Array<{ page: number; text: string }>;
}

export interface CachedSearchEntry {
  pages: Array<{ page: number; text: string; textLower: string }>;
}

function searchIndexFile(slug: string) {
  return path.join(docDir(slug), "_search.json");
}

/** Get the number of pages with text for each OCR document (from search index files). */
export async function getPagesWithTextCounts(): Promise<Record<string, number>> {
  const index = await getIndex();
  const counts: Record<string, number> = {};
  const promises: Promise<void>[] = [];
  for (const [slug, entry] of Object.entries(index)) {
    if (entry.pageCount <= 0) continue;
    promises.push(
      (async () => {
        try {
          const raw = await fs.readFile(searchIndexFile(slug), "utf-8");
          const data = JSON.parse(raw) as SearchIndexData;
          counts[slug] = data.pages.length;
        } catch {
          counts[slug] = 0;
        }
      })()
    );
  }
  await Promise.all(promises);
  return counts;
}

// ── In-memory search cache ──
// Loaded once from disk, then kept in memory across requests.
// Invalidated per-document when OCR completes.

const globalAny = globalThis as any;
if (!globalAny.__ocrSearchCache) {
  globalAny.__ocrSearchCache = {
    data: {} as Record<string, CachedSearchEntry>,
    loadPromise: null as Promise<void> | null,
  };
}
const searchCache: {
  data: Record<string, CachedSearchEntry>;
  loadPromise: Promise<void> | null;
} = globalAny.__ocrSearchCache;

/** Load all search indexes into memory (once). Returns a shared promise so concurrent callers don't duplicate work. */
function ensureSearchCacheLoaded(): Promise<void> {
  if (searchCache.loadPromise) return searchCache.loadPromise;
  searchCache.loadPromise = (async () => {
    const index = await getIndex();
    const loadPromises: Promise<void>[] = [];
    for (const [slug, entry] of Object.entries(index)) {
      if (entry.pageCount <= 0) continue;
      if (entry.status !== "partial" && entry.status !== "complete" && entry.status !== "corrected") continue;
      if (searchCache.data[slug]) continue; // already loaded
      loadPromises.push(
        (async () => {
          try {
            const raw = await fs.readFile(searchIndexFile(slug), "utf-8");
            const data = JSON.parse(raw) as SearchIndexData;
            searchCache.data[slug] = {
              pages: data.pages.map((p) => ({ ...p, textLower: p.text.toLowerCase() })),
            };
          } catch { /* no search index for this doc yet */ }
        })()
      );
    }
    await Promise.all(loadPromises);
  })();
  return searchCache.loadPromise;
}

// Eagerly preload the search cache at module load time (fire-and-forget).
// By the time a user actually searches, the data is already in memory.
ensureSearchCacheLoaded();

/** Get the cached search index for a document (from memory). */
export async function getSearchIndex(slug: string): Promise<CachedSearchEntry | null> {
  await ensureSearchCacheLoaded();
  return searchCache.data[slug] ?? null;
}

/** Get all cached search entries (for corpus-wide search). */
export async function getAllSearchIndexes(): Promise<Record<string, CachedSearchEntry>> {
  await ensureSearchCacheLoaded();
  return searchCache.data;
}

/** Rebuild the search index for a document from its page files, and update the in-memory cache. */
export async function rebuildSearchIndex(slug: string, pageCount: number): Promise<void> {
  const pages: Array<{ page: number; text: string }> = [];
  for (let p = 1; p <= pageCount; p++) {
    const pageData = await getPage(slug, p);
    if (pageData?.rawText) {
      pages.push({ page: p, text: pageData.rawText });
    }
  }
  const file = searchIndexFile(slug);
  await ensureDir(docDir(slug));
  await fs.writeFile(file, JSON.stringify({ pages }), "utf-8");

  // Update in-memory cache immediately
  searchCache.data[slug] = {
    pages: pages.map((p) => ({ ...p, textLower: p.text.toLowerCase() })),
  };
}
