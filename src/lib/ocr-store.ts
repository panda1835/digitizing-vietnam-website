import fs from "fs/promises";
import path from "path";
import {
  INITIAL_DEFAULT_KNOBS,
  type PreprocessKnobs,
} from "./preprocess";

// Server-side filesystem store for the admin OCR toolbox. Override via
// OCR_DATA_ROOT to point at an external folder (e.g. a synced corpus
// directory); falls back to ./data/ocr for local-only use.
const DATA_ROOT =
  process.env.OCR_DATA_ROOT ?? path.join(process.cwd(), "data", "ocr");
const INDEX_PATH = path.join(DATA_ROOT, "_index.json");
const SETTINGS_PATH = path.join(DATA_ROOT, "_settings.json");

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export interface SpatialCharacter {
  text: string;
  /**
   * The character text the OCR engine originally produced for this cell,
   * frozen at ingest time. Lets the corrections panel diff
   * original-vs-current end-state without mid-keystroke noise.
   */
  originalText?: string;
  bbox: Array<{ x: number; y: number }> | null;
  confidence: number;
  offset: number;
  choices?: string[];
  layoutClass?: number;
  /**
   * Labeler-flagged "I'm not sure." Distinct from `confidence` (which is
   * the model's confidence). Toggled by the ` (backtick) hotkey on the
   * focused cell.
   */
  uncertain?: boolean;
  /**
   * Optional Ideographic Description Sequence for unencoded chars
   * (e.g., "⿰口巴" = 口 left, 巴 right).
   */
  ids?: string;
  /**
   * Labeler-flagged "this glyph form doesn't yet have a specific
   * Vietnamese reading." Distinct from `uncertain` and `ids`.
   */
  noReadingForm?: boolean;
  /** Free-form labeler note ("ink bleed, could be 巴 or 邑"). */
  note?: string;
  /**
   * Step 3 (Quốc Ngữ) primary reading for this glyph. Independent from
   * OCR training data — never read by the crops/nnv/lines/segmentation
   * exporters.
   */
  quocNgu?: string;
  /** Ranked alternate Quốc Ngữ readings. Primary `quocNgu` is excluded. */
  quocNguChoices?: string[];
}

export interface ColumnSection {
  type: "main" | "commentary";
  chars: SpatialCharacter[];
  bbox: { minX: number; maxX: number; minY: number; maxY: number };
  sectionIndex: number;
}

/**
 * Layout category for a confirmed column.
 *   - "text"        — running body text (the main OCR target).
 *   - "binding"     — banxin / 版心: central binding strip.
 *   - "marginalia"  — handwritten annotations, seals, illustrations.
 *   - "commentary"  — small-char interlinear annotation patches.
 */
export type ColumnKind = "text" | "binding" | "marginalia" | "commentary";

export interface ConfirmedColumn {
  bbox: { minX: number; maxX: number; minY: number; maxY: number };
  /** Defaults to "text" when missing on disk (pre-tag-feature data). */
  kind?: ColumnKind;
}

export interface OcrPageData {
  pageNumber: number;
  rawText: string;
  spatialData: SpatialCharacter[];
  candidateData?: SpatialCharacter[];
  /** Original-image dimensions in pixels — used for export crops. */
  imageWidth?: number;
  imageHeight?: number;
  /**
   * User-confirmed column rectangles for this page. Reading order =
   * array index. Present once Step 1 (column editing) is confirmed.
   */
  columns?: ConfirmedColumn[];
  /** ISO timestamp marking "Step 1 (columns) confirmed." */
  columnsConfirmedAt?: string;
  /** ISO timestamp marking "Step 2 (characters) confirmed." */
  charsConfirmedAt?: string;
  /**
   * ISO timestamp marking the most recent successful Nôm Na Việt re-OCR
   * pass on this page.
   */
  nnvCompletedAt?: string;
  /**
   * ISO timestamp marking "user has decided this page does not need OCR
   * work" (blank, repeated, irrelevant).
   */
  skippedAt?: string;
}

export interface DocumentManifest {
  title: string;
  pageCount: number;
  createdAt: string;
  lastEditedAt: string;
  /** "upload" = user uploaded image files. "url" = images live behind a URL ref. */
  sourceType: "upload" | "url";
  /** Per-document preprocessing knobs applied before kandi sees the image. */
  preprocessing?: PreprocessKnobs;
}

export interface GlobalSettings {
  defaultPreprocessing: PreprocessKnobs;
}

export type DocumentStatus = "uncorrected" | "in-progress" | "corrected";

export interface IndexEntry {
  status: DocumentStatus;
  pageCount: number;
  /** How many pages have been touched (have a saved spatialData JSON). */
  pagesWithData: number;
  /**
   * Pages where both Step 1 (columns) and Step 2 (characters) have been
   * confirmed.
   */
  pagesFullyConfirmed?: number;
  /** Pages the user explicitly marked as "skipped." */
  pagesSkipped?: number;
  /** Average confidence across the corrected pages. */
  avgConfidence?: number;
  lastEditedAt: string;
  title: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Filesystem helpers
// ─────────────────────────────────────────────────────────────────────────

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

function pageFile(slug: string, page: number) {
  const padded = String(page).padStart(3, "0");
  return path.join(DATA_ROOT, slug, "pages", `${padded}.json`);
}

export function pageImageFile(slug: string, page: number, ext = "png") {
  const padded = String(page).padStart(3, "0");
  return path.join(DATA_ROOT, slug, "pages", `${padded}.${ext}`);
}

function manifestFile(slug: string) {
  return path.join(DATA_ROOT, slug, "manifest.json");
}

async function readJSON<T>(p: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(p, "utf8");
    return JSON.parse(raw) as T;
  } catch (e: any) {
    if (e?.code === "ENOENT") return null;
    throw e;
  }
}

async function writeJSON(p: string, value: unknown) {
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, JSON.stringify(value, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────
// Index registry
// ─────────────────────────────────────────────────────────────────────────

async function loadIndex(): Promise<Record<string, IndexEntry>> {
  return (await readJSON<Record<string, IndexEntry>>(INDEX_PATH)) ?? {};
}

async function saveIndex(idx: Record<string, IndexEntry>) {
  await writeJSON(INDEX_PATH, idx);
}

export async function listIndex(): Promise<Record<string, IndexEntry>> {
  return await loadIndex();
}

export async function upsertIndexEntry(
  slug: string,
  patch: Partial<IndexEntry>
) {
  const idx = await loadIndex();
  const base: IndexEntry =
    idx[slug] ?? {
      status: "uncorrected",
      pageCount: 0,
      pagesWithData: 0,
      lastEditedAt: new Date().toISOString(),
      title: slug,
    };
  idx[slug] = { ...base, ...patch };
  await saveIndex(idx);
}

/**
 * Permanently remove a document: nukes the per-slug directory (manifest
 * + page JSONs + page images) and the index entry. Idempotent.
 */
export async function deleteDocument(slug: string): Promise<void> {
  const docDir = path.join(DATA_ROOT, slug);
  await fs.rm(docDir, { recursive: true, force: true });
  const idx = await loadIndex();
  if (slug in idx) {
    delete idx[slug];
    await saveIndex(idx);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Global settings (default preprocessing)
// ─────────────────────────────────────────────────────────────────────────

export async function getGlobalSettings(): Promise<GlobalSettings> {
  const stored = await readJSON<GlobalSettings>(SETTINGS_PATH);
  if (stored?.defaultPreprocessing) return stored;
  return { defaultPreprocessing: INITIAL_DEFAULT_KNOBS };
}

export async function setGlobalSettings(s: GlobalSettings) {
  await writeJSON(SETTINGS_PATH, s);
}

// ─────────────────────────────────────────────────────────────────────────
// Documents and pages
// ─────────────────────────────────────────────────────────────────────────

export async function getManifest(slug: string): Promise<DocumentManifest | null> {
  return await readJSON<DocumentManifest>(manifestFile(slug));
}

export async function setManifest(slug: string, m: DocumentManifest) {
  await writeJSON(manifestFile(slug), m);
}

export async function getPage(slug: string, page: number): Promise<OcrPageData | null> {
  return await readJSON<OcrPageData>(pageFile(slug, page));
}

export async function setPage(slug: string, page: number, data: OcrPageData) {
  await writeJSON(pageFile(slug, page), data);
  await touchIndexAfterSave(slug);
}

/** Walk every page JSON for a document and return them in order. */
export async function listPages(slug: string): Promise<OcrPageData[]> {
  const manifest = await getManifest(slug);
  if (!manifest) return [];
  const out: OcrPageData[] = [];
  for (let p = 1; p <= manifest.pageCount; p++) {
    const data = await getPage(slug, p);
    if (data) out.push(data);
  }
  return out;
}

async function touchIndexAfterSave(slug: string) {
  const manifest = await getManifest(slug);
  if (!manifest) return;
  const pagesDir = path.join(DATA_ROOT, slug, "pages");
  let pagesWithData = 0;
  let pagesFullyConfirmed = 0;
  let pagesSkipped = 0;
  let confSum = 0;
  let confCount = 0;
  try {
    const entries = await fs.readdir(pagesDir);
    for (const e of entries) {
      if (!e.endsWith(".json")) continue;
      const data = await readJSON<OcrPageData>(path.join(pagesDir, e));
      if (!data) continue;
      const skipped = !!data.skippedAt;
      if (skipped) {
        pagesSkipped++;
      } else {
        pagesWithData++;
        if (data.columnsConfirmedAt && data.charsConfirmedAt) {
          pagesFullyConfirmed++;
        }
      }
      for (const c of data.spatialData) {
        if (c.bbox) {
          confSum += c.confidence;
          confCount++;
        }
      }
    }
  } catch {}

  const pagesDone = pagesFullyConfirmed + pagesSkipped;
  const pagesTouched = pagesWithData + pagesSkipped;
  const status: DocumentStatus =
    pagesTouched === 0
      ? "uncorrected"
      : pagesDone < manifest.pageCount
      ? "in-progress"
      : "corrected";

  await upsertIndexEntry(slug, {
    title: manifest.title,
    pageCount: manifest.pageCount,
    pagesWithData,
    pagesFullyConfirmed,
    pagesSkipped,
    status,
    avgConfidence: confCount > 0 ? confSum / confCount : undefined,
    lastEditedAt: new Date().toISOString(),
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Slug generation
// ─────────────────────────────────────────────────────────────────────────

export function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  const stamp = Date.now().toString(36);
  return base ? `${base}-${stamp}` : `doc-${stamp}`;
}

export const PATHS = {
  DATA_ROOT,
  INDEX_PATH,
  SETTINGS_PATH,
};
