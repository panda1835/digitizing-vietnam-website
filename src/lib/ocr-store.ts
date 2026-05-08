import fs from "fs/promises";
import path from "path";

const OCR_DIR = path.join(process.cwd(), "data", "ocr");
const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");
const INDEX_FILE = path.join(OCR_DIR, "_index.json");
const STATS_FILE = path.join(OCR_DIR, "_stats.json");

/** Absolute path to the uploaded source PDF for a given slug. */
export function uploadSourcePath(slug: string) {
  return path.join(UPLOADS_DIR, slug, "source.pdf");
}

/** Directory where the source PDF for `slug` should be written. */
export function uploadDir(slug: string) {
  return path.join(UPLOADS_DIR, slug);
}

export interface OcrIndexEntry {
  status: "queued" | "pending" | "processing" | "partial" | "complete" | "corrected" | "error";
  pageCount: number;
  collectionSlug: string;
  updatedAt: string;
  source?: "pdf" | "iiif";
  manifestUrl?: string;
  title?: string;
  itemId?: string;
  /** Document-level average OCR confidence (0–1), weighted by character count. Refreshed by rebuildSearchIndex. */
  avgConfidence?: number;
  /** Total characters (with bbox) counted when avgConfidence was computed. */
  confidenceCharCount?: number;
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

// PDF uploads write their per-page JSON under data/uploads/{slug}/ so the
// originals and their derived OCR output stay together (and apart from the
// IIIF-sourced corpus under data/ocr/). Source is read from the index entry,
// with a tiny in-memory cache so a per-page setPage doesn't re-read _index.json
// on every call.
let slugSourceCache: Map<string, OcrIndexEntry["source"]> | null = null;

async function getSlugSource(slug: string): Promise<OcrIndexEntry["source"]> {
  if (!slugSourceCache) {
    const idx = await getIndex();
    slugSourceCache = new Map();
    for (const [s, e] of Object.entries(idx)) slugSourceCache.set(s, e.source);
  }
  return slugSourceCache.get(slug);
}

async function docDir(slug: string): Promise<string> {
  const source = await getSlugSource(slug);
  return source === "pdf"
    ? path.join(UPLOADS_DIR, slug)
    : path.join(OCR_DIR, slug);
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
  if (slugSourceCache) slugSourceCache.set(slug, index[slug].source);
}

// --- Corpus-wide stats ---
// Aggregates per-document confidence across the whole corpus so the Workshop
// Hub can show a single "health of the corpus" figure without iterating the
// index on every request. Lives in a sibling file so _index.json keeps its
// clean Record<slug, entry> shape.

export interface CorpusStats {
  updatedAt: string;
  docCount: number;
  docsWithConfidence: number;
  /** Weighted average (by char count) across all docs with avgConfidence set. */
  overallAvgConfidence: number | null;
  totalCharCount: number;
}

/** Read the current corpus stats file. Returns null if it hasn't been written yet. */
export async function getCorpusStats(): Promise<CorpusStats | null> {
  try {
    const raw = await fs.readFile(STATS_FILE, "utf-8");
    return JSON.parse(raw) as CorpusStats;
  } catch {
    return null;
  }
}

/** Recompute corpus stats from the current index and persist to _stats.json. */
export async function writeCorpusStats(): Promise<CorpusStats> {
  const index = await getIndex();
  let docsWithConfidence = 0;
  let weightedSum = 0;
  let totalCharCount = 0;
  for (const entry of Object.values(index)) {
    if (entry.avgConfidence == null || !entry.confidenceCharCount) continue;
    docsWithConfidence++;
    weightedSum += entry.avgConfidence * entry.confidenceCharCount;
    totalCharCount += entry.confidenceCharCount;
  }
  const stats: CorpusStats = {
    updatedAt: new Date().toISOString(),
    docCount: Object.keys(index).length,
    docsWithConfidence,
    overallAvgConfidence: totalCharCount > 0 ? weightedSum / totalCharCount : null,
    totalCharCount,
  };
  await ensureDir(OCR_DIR);
  await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2), "utf-8");
  return stats;
}

// --- Pages ---

export async function getPage(
  slug: string,
  pageNumber: number
): Promise<OcrPageData | null> {
  const file = path.join(await docDir(slug), pageFilename(pageNumber));
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
  const dir = await docDir(slug);
  await ensureDir(dir);
  const file = path.join(dir, pageFilename(pageNumber));
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

export function computeRawText(spatialData: SpatialCharacter[]): string {
  return spatialData.map((c) => c.text).join("");
}

/**
 * Compute the average OCR confidence for a spatial-character array.
 * Only counts characters with a bbox (OCR detections, not manual inserts
 * which default to 1.0 and would skew the average).
 * Returns { avg, count } — avg is null when count is 0.
 */
export function computePageConfidence(
  spatialData: SpatialCharacter[]
): { avg: number | null; count: number } {
  let sum = 0;
  let count = 0;
  for (const c of spatialData) {
    if (!c.bbox) continue;
    sum += c.confidence;
    count++;
  }
  return { avg: count > 0 ? sum / count : null, count };
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

async function searchIndexFile(slug: string) {
  return path.join(await docDir(slug), "_search.json");
}

/** Synchronous variant for callers that already know the source. Avoids an
 *  index lookup during hot-path search-cache loading. */
function searchIndexFileForSource(
  slug: string,
  source: OcrIndexEntry["source"]
) {
  const dir =
    source === "pdf"
      ? path.join(UPLOADS_DIR, slug)
      : path.join(OCR_DIR, slug);
  return path.join(dir, "_search.json");
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
          const raw = await fs.readFile(
            searchIndexFileForSource(slug, entry.source),
            "utf-8"
          );
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
            const raw = await fs.readFile(
              searchIndexFileForSource(slug, entry.source),
              "utf-8"
            );
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

/** Rebuild the search index for a document from its page files, and update the in-memory cache.
 *  Also recomputes and persists the document-level avgConfidence on the index entry. */
export async function rebuildSearchIndex(slug: string, pageCount: number): Promise<void> {
  const pages: Array<{ page: number; text: string }> = [];
  let confSum = 0;
  let confCount = 0;
  for (let p = 1; p <= pageCount; p++) {
    const pageData = await getPage(slug, p);
    if (!pageData) continue;
    if (pageData.rawText) {
      pages.push({ page: p, text: pageData.rawText });
    }
    if (pageData.spatialData) {
      for (const c of pageData.spatialData) {
        if (!c.bbox) continue;
        confSum += c.confidence;
        confCount++;
      }
    }
  }
  const dir = await docDir(slug);
  const file = path.join(dir, "_search.json");
  await ensureDir(dir);
  await fs.writeFile(file, JSON.stringify({ pages }), "utf-8");

  // Update in-memory cache immediately
  searchCache.data[slug] = {
    pages: pages.map((p) => ({ ...p, textLower: p.text.toLowerCase() })),
  };

  // Persist avgConfidence on the index entry (skip if no confidence data)
  if (confCount > 0) {
    await setIndexEntry(slug, {
      avgConfidence: confSum / confCount,
      confidenceCharCount: confCount,
    });
    // Refresh the corpus-wide stats file so the hub's overall number stays
    // current after every ingest completion. Non-critical; swallow errors.
    try { await writeCorpusStats(); } catch { /* non-critical */ }
  }
}
