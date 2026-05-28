// lib/ocr-store-supabase.ts
//
// Supabase-backed implementation of the admin OCR store. Mirrors the
// function surface of the filesystem `ocr-store.ts` so API routes/editor
// can switch backends with minimal churn — same types, same signatures.
//
// Backend: the normalized 8-table schema (+ `columns`) on project
// cpvlderoberfzmafelqm. Append-only `text_versions` preserves the OCR
// original and every human correction (scholarly audit trail).
//
// Status: v1. Read (assemble rows -> OcrPageData) is complete. Write
// (shred OcrPageData -> append-only rows) is correct-but-simple; see the
// TODOs for candidateData-as-second-run, a settings table, and a SQL
// view for listIndex aggregation.

import { ocrSupabase } from "./ocr-supabase";
import { findColumnIndex } from "./corpus-helpers";
import { INITIAL_DEFAULT_KNOBS, type PreprocessKnobs } from "./preprocess";
import type {
  SpatialCharacter,
  ConfirmedColumn,
  ColumnKind,
  OcrPageData,
  DocumentManifest,
  GlobalSettings,
  DocumentStatus,
  IndexEntry,
  PageImageSource,
} from "./ocr-store";

// Re-export the shared types so consumers can import from either module.
export type {
  SpatialCharacter,
  ConfirmedColumn,
  ColumnKind,
  OcrPageData,
  DocumentManifest,
  GlobalSettings,
  DocumentStatus,
  IndexEntry,
  PageImageSource,
} from "./ocr-store";

// ─────────────────────────────────────────────────────────────────────────
// Row shapes (hand-written from the live schema; replace with generated
// `Database` types once `supabase gen types` can reach the project).
// ─────────────────────────────────────────────────────────────────────────

type Uuid = string;

interface DocumentRow {
  id: Uuid;
  title: string;
  slug: string | null;
  source_type: string | null; // 'iiif' | 'pdf' | 'upload'
  manifest_url: string | null;
  source_url: string | null;
  preprocessing: PreprocessKnobs | null;
  reference: unknown | null;
  status: string;
  created_at: string;
  created_by: Uuid | null;
}

interface PageRow {
  id: Uuid;
  document_id: Uuid;
  page_number: number;
  image_url: string | null;
  ocr_status: string;
  image_width: number | null;
  image_height: number | null;
  columns_confirmed_at: string | null;
  chars_confirmed_at: string | null;
  nnv_completed_at: string | null;
  quocngu_confirmed_at: string | null;
  skipped_at: string | null;
  manual_order_locked: boolean;
  aligned_syllable_indices: number[] | null;
}

interface ColumnRow {
  id: Uuid;
  page_id: Uuid;
  order_index: number;
  min_x: number;
  max_x: number;
  min_y: number;
  max_y: number;
  kind: ColumnKind;
}

interface OcrRunRow {
  id: Uuid;
  page_id: Uuid;
  model_name: string | null;
  model_version: string | null;
  status: string;
  notes: string | null;
  raw_output_url: string | null;
  preprocessing: PreprocessKnobs | null;
  started_at: string;
}

interface TextUnitRow {
  id: Uuid;
  page_id: Uuid;
  ocr_run_id: Uuid;
  offset: number;
  layout_class: number | null;
  bbox_x1: number | null; bbox_y1: number | null;
  bbox_x2: number | null; bbox_y2: number | null;
  bbox_x3: number | null; bbox_y3: number | null;
  bbox_x4: number | null; bbox_y4: number | null;
  ids: string | null;
  uncertain: boolean;
  no_reading_form: boolean;
  qn_uncertain: boolean;
  nnv_processed_at: string | null;
  quocngu_flag: string | null;
  corrected_text: string | null;
}

interface TextVersionRow {
  id: Uuid;
  text_unit_id: Uuid;
  ocr_run_id: Uuid;
  text: string;
  confidence: number | null;
  source: string; // 'ocr' | 'human' | 'quoc-ngu'
  correction_note: string | null;
  created_at: string;
}

interface TextCandidateRow {
  id: Uuid;
  text_unit_id: Uuid;
  text: string;
  rank: number;
  source: string; // 'ocr' | 'quoc-ngu'
}

// Version `source` conventions.
const SRC_OCR = "ocr";
const SRC_HUMAN = "human";
// Nôm Na Việt re-OCR pass. Part of the OCR pipeline, NOT a human
// correction — when NNV's top-1 is a Nôm SIP char it replaces the
// machine baseline (see nomnaviet-ocr `rerecognizeWithNomNaViet`).
// Tagged distinctly here so the corrections aggregate never treats
// machine refinements as "what the human typed".
const SRC_NNV = "nnv";
const SRC_QN = "quoc-ngu";

/** Machine sources — the OCR pipeline (Kandi initial, NNV re-OCR). */
function isMachineSource(s: string): boolean {
  return s === SRC_OCR || s === SRC_NNV || s.startsWith("kandi");
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function db() {
  return ocrSupabase();
}

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

/** "upload"|"url" (FS manifest) <-> source_type ('iiif'|'pdf'|'upload'). */
function toSourceType(s: DocumentManifest["sourceType"]): string {
  return s === "url" ? "iiif" : "upload";
}
function fromSourceType(s: string | null): DocumentManifest["sourceType"] {
  return s === "iiif" ? "url" : "upload";
}

function bboxToQuad(
  bbox: SpatialCharacter["bbox"]
): Partial<TextUnitRow> {
  if (!bbox || bbox.length < 4) {
    return {
      bbox_x1: null, bbox_y1: null, bbox_x2: null, bbox_y2: null,
      bbox_x3: null, bbox_y3: null, bbox_x4: null, bbox_y4: null,
    };
  }
  const [a, b, c, d] = bbox;
  return {
    bbox_x1: a.x, bbox_y1: a.y, bbox_x2: b.x, bbox_y2: b.y,
    bbox_x3: c.x, bbox_y3: c.y, bbox_x4: d.x, bbox_y4: d.y,
  };
}

function quadToBbox(u: TextUnitRow): SpatialCharacter["bbox"] {
  if (u.bbox_x1 == null) return null;
  return [
    { x: u.bbox_x1!, y: u.bbox_y1! },
    { x: u.bbox_x2!, y: u.bbox_y2! },
    { x: u.bbox_x3!, y: u.bbox_y3! },
    { x: u.bbox_x4!, y: u.bbox_y4! },
  ];
}

async function findDocument(slug: string): Promise<DocumentRow | null> {
  const { data, error } = await db()
    .from("documents")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`documents lookup failed: ${error.message}`);
  return (data as DocumentRow) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────
// Documents / manifest
// ─────────────────────────────────────────────────────────────────────────

export async function getManifest(
  slug: string
): Promise<DocumentManifest | null> {
  const doc = await findDocument(slug);
  if (!doc) return null;
  const { count } = await db()
    .from("pages")
    .select("id", { count: "exact", head: true })
    .eq("document_id", doc.id);
  return {
    title: doc.title,
    pageCount: count ?? 0,
    createdAt: doc.created_at,
    // TODO(updated_at): no documents.updated_at column yet — fall back to
    // created_at. Add a column or derive from max(page workflow ts).
    lastEditedAt: doc.created_at,
    sourceType: fromSourceType(doc.source_type),
    preprocessing: doc.preprocessing ?? undefined,
  };
}

export async function setManifest(
  slug: string,
  m: DocumentManifest
): Promise<void> {
  const existing = await findDocument(slug);
  const row = {
    title: m.title,
    slug,
    source_type: toSourceType(m.sourceType),
    preprocessing: m.preprocessing ?? null,
    status: "uncorrected",
  };
  if (existing) {
    const { error } = await db()
      .from("documents")
      .update(row)
      .eq("id", existing.id);
    if (error) throw new Error(`documents update failed: ${error.message}`);
  } else {
    const { error } = await db()
      .from("documents")
      .insert({ ...row, created_at: m.createdAt ?? new Date().toISOString() });
    if (error) throw new Error(`documents insert failed: ${error.message}`);
  }
}

/**
 * Create (or refresh) a self-originating document from a IIIF manifest:
 * one `documents` row + N blank `pages` rows carrying the resolved image
 * URL. No OCR data is created — pages are blank until OCR runs in-app.
 * Idempotent on slug: re-import upserts the doc and its pages by
 * (document_id, page_number).
 */
export async function createIiifDocument(opts: {
  slug: string;
  title: string;
  manifestUrl: string;
  pages: { pageNumber: number; imageUrl: string }[];
}): Promise<{ slug: string; pageCount: number }> {
  const { slug, title, manifestUrl, pages } = opts;
  const existing = await findDocument(slug);
  const docFields = {
    title,
    slug,
    source_type: "iiif",
    manifest_url: manifestUrl,
    source_url: manifestUrl,
    status: "uncorrected",
  };
  let docId: Uuid;
  if (existing) {
    const { error } = await db()
      .from("documents")
      .update(docFields)
      .eq("id", existing.id);
    if (error) throw new Error(`documents update: ${error.message}`);
    docId = existing.id;
  } else {
    const { data, error } = await db()
      .from("documents")
      .insert({ ...docFields, created_at: new Date().toISOString() })
      .select("id")
      .single();
    if (error) throw new Error(`documents insert: ${error.message}`);
    docId = (data as { id: Uuid }).id;
  }

  if (pages.length) {
    const { error } = await db()
      .from("pages")
      .upsert(
        pages.map((p) => ({
          document_id: docId,
          page_number: p.pageNumber,
          image_url: p.imageUrl,
          ocr_status: "uncorrected",
          manual_order_locked: false,
        })),
        { onConflict: "document_id,page_number" }
      );
    if (error) throw new Error(`pages upsert: ${error.message}`);
  }
  return { slug, pageCount: pages.length };
}

/**
 * Create (or refresh) a self-originating PDF/upload document — one
 * `documents` row, `source_type='pdf'`, no pages yet. Pages are added
 * incrementally by `putPdfPage` as the client rasterizes them, so a
 * large PDF never has to be sent or held whole. Idempotent on slug.
 */
export async function createPdfDocument(opts: {
  slug: string;
  title: string;
}): Promise<{ slug: string }> {
  const { slug, title } = opts;
  const existing = await findDocument(slug);
  const docFields = {
    title,
    slug,
    source_type: "pdf",
    status: "uncorrected",
  };
  if (existing) {
    const { error } = await db()
      .from("documents")
      .update(docFields)
      .eq("id", existing.id);
    if (error) throw new Error(`documents update: ${error.message}`);
  } else {
    const { error } = await db()
      .from("documents")
      .insert({ ...docFields, created_at: new Date().toISOString() });
    if (error) throw new Error(`documents insert: ${error.message}`);
  }
  return { slug };
}

/**
 * Upload one rasterized page image to the `ocr-pages` Storage bucket and
 * upsert its `pages` row. The relational DB only stores the resulting
 * public URL — the image bytes live in object storage, never in Postgres.
 * `bytes` is the already-compressed JPEG from the client (resolution-
 * clamped browser-side). Returns the URL and the document's live page
 * count so the importer can show progress.
 */
export async function putPdfPage(opts: {
  slug: string;
  pageNumber: number;
  bytes: Uint8Array | ArrayBuffer | Buffer;
  contentType?: string;
}): Promise<{ imageUrl: string; pageCount: number }> {
  const { slug, pageNumber } = opts;
  const doc = await findDocument(slug);
  if (!doc) throw new Error(`putPdfPage: no document for slug "${slug}"`);

  const contentType = opts.contentType ?? "image/jpeg";
  const ext = contentType.includes("png") ? "png" : "jpg";
  const path = `${slug}/${pageNumber}.${ext}`;

  const { error: upErr } = await db()
    .storage.from("ocr-pages")
    // supabase-js Storage body type varies across versions; a byte buffer
    // is accepted at runtime — cast to keep the call version-agnostic.
    .upload(path, opts.bytes as unknown as ArrayBuffer, {
      contentType,
      upsert: true,
    });
  if (upErr) throw new Error(`storage upload: ${upErr.message}`);

  const { data: pub } = db()
    .storage.from("ocr-pages")
    .getPublicUrl(path);

  const { error: pgErr } = await db()
    .from("pages")
    .upsert(
      {
        document_id: doc.id,
        page_number: pageNumber,
        image_url: pub.publicUrl,
        ocr_status: "uncorrected",
        manual_order_locked: false,
      },
      { onConflict: "document_id,page_number" }
    );
  if (pgErr) throw new Error(`pages upsert: ${pgErr.message}`);

  const { count } = await db()
    .from("pages")
    .select("id", { count: "exact", head: true })
    .eq("document_id", doc.id);
  return { imageUrl: pub.publicUrl, pageCount: count ?? 0 };
}

export async function deleteDocument(slug: string): Promise<void> {
  const doc = await findDocument(slug);
  if (!doc) return;
  // pages/columns/ocr_runs/text_* cascade via FKs (on delete cascade).
  const { error } = await db().from("documents").delete().eq("id", doc.id);
  if (error) throw new Error(`documents delete failed: ${error.message}`);
}

// ─────────────────────────────────────────────────────────────────────────
// Page read — assemble rows -> OcrPageData
// ─────────────────────────────────────────────────────────────────────────

export async function getPage(
  slug: string,
  page: number
): Promise<OcrPageData | null> {
  const doc = await findDocument(slug);
  if (!doc) return null;

  const { data: pageRow } = await db()
    .from("pages")
    .select("*")
    .eq("document_id", doc.id)
    .eq("page_number", page)
    .maybeSingle();
  if (!pageRow) return null;
  const p = pageRow as PageRow;

  const [colsRes, unitsRes] = await Promise.all([
    db().from("columns").select("*").eq("page_id", p.id).order("order_index"),
    db().from("text_units").select("*").eq("page_id", p.id).order("offset"),
  ]);
  const colRows = (colsRes.data ?? []) as ColumnRow[];
  const unitRows = (unitsRes.data ?? []) as TextUnitRow[];

  let versions: TextVersionRow[] = [];
  let candidates: TextCandidateRow[] = [];
  if (unitRows.length) {
    const ids = unitRows.map((u) => u.id);
    const [vRes, cRes] = await Promise.all([
      db()
        .from("text_versions")
        .select("*")
        .in("text_unit_id", ids)
        .order("created_at"),
      db()
        .from("text_candidates")
        .select("*")
        .in("text_unit_id", ids)
        .order("rank"),
    ]);
    versions = (vRes.data ?? []) as TextVersionRow[];
    candidates = (cRes.data ?? []) as TextCandidateRow[];
  }

  const vByUnit = new Map<Uuid, TextVersionRow[]>();
  for (const v of versions) {
    (vByUnit.get(v.text_unit_id) ?? vByUnit.set(v.text_unit_id, []).get(v.text_unit_id)!).push(v);
  }
  const cByUnit = new Map<Uuid, TextCandidateRow[]>();
  for (const c of candidates) {
    (cByUnit.get(c.text_unit_id) ?? cByUnit.set(c.text_unit_id, []).get(c.text_unit_id)!).push(c);
  }

  const spatialData: SpatialCharacter[] = unitRows.map((u) => {
    const vs = vByUnit.get(u.id) ?? [];
    // Earliest OCR-origin version — used for confidence display only.
    const ocrV = vs.find(
      (v) => v.source === SRC_OCR || v.source.startsWith("kandi")
    );
    // Latest MACHINE version (ocr / kandi* / nnv). This is the value
    // that was there immediately before the first human correction —
    // i.e. the "original" for the (original → my correction) pair, per
    // the user's spec. For an NNV-replaced glyph this is the NNV
    // reading, not the Kandi one.
    const machineV = [...vs].reverse().find((v) => isMachineSource(v.source));
    const manuscript = vs.filter((v) => v.source !== SRC_QN);
    const latest = manuscript[manuscript.length - 1];
    const qnV = [...vs].reverse().find((v) => v.source === SRC_QN);
    const cs = cByUnit.get(u.id) ?? [];
    const ocrChoices = cs.filter((c) => c.source === SRC_OCR).map((c) => c.text);
    const qnChoices = cs.filter((c) => c.source === SRC_QN).map((c) => c.text);

    const ch: SpatialCharacter = {
      text: latest?.text ?? machineV?.text ?? "",
      bbox: quadToBbox(u),
      confidence: ocrV?.confidence ?? 0,
      offset: u.offset,
    };
    if (machineV && machineV.text !== ch.text) ch.originalText = machineV.text;
    if (ocrChoices.length) ch.choices = ocrChoices;
    if (u.layout_class != null) ch.layoutClass = u.layout_class;
    if (u.uncertain) ch.uncertain = true;
    if (u.ids) ch.ids = u.ids;
    if (u.no_reading_form) ch.noReadingForm = true;
    const note = latest?.correction_note ?? undefined;
    if (note) ch.note = note;
    if (qnV?.text) ch.quocNgu = qnV.text;
    if (qnChoices.length) ch.quocNguChoices = qnChoices;
    return ch;
  });

  const columns: ConfirmedColumn[] = colRows.map((c) => ({
    bbox: { minX: c.min_x, maxX: c.max_x, minY: c.min_y, maxY: c.max_y },
    kind: c.kind,
  }));

  const data: OcrPageData = {
    pageNumber: p.page_number,
    rawText: spatialData.map((c) => c.text).join(""), // derived
    spatialData,
  };
  if (columns.length) data.columns = columns;
  if (p.image_width != null) data.imageWidth = p.image_width;
  if (p.image_height != null) data.imageHeight = p.image_height;
  if (p.columns_confirmed_at) data.columnsConfirmedAt = p.columns_confirmed_at;
  if (p.chars_confirmed_at) data.charsConfirmedAt = p.chars_confirmed_at;
  if (p.quocngu_confirmed_at)
    data.quocNguConfirmedAt = p.quocngu_confirmed_at;
  if (p.nnv_completed_at) data.nnvCompletedAt = p.nnv_completed_at;
  if (p.skipped_at) data.skippedAt = p.skipped_at;
  // TODO(candidateData): assemble from a second ocr_run (status='candidate').
  return data;
}

// ─────────────────────────────────────────────────────────────────────────
// Page write — shred OcrPageData -> append-only rows
// ─────────────────────────────────────────────────────────────────────────

async function ensurePage(docId: Uuid, page: number): Promise<PageRow> {
  const { data } = await db()
    .from("pages")
    .select("*")
    .eq("document_id", docId)
    .eq("page_number", page)
    .maybeSingle();
  if (data) return data as PageRow;
  const { data: ins, error } = await db()
    .from("pages")
    .insert({
      document_id: docId,
      page_number: page,
      ocr_status: "uncorrected",
      manual_order_locked: false,
    })
    .select("*")
    .single();
  if (error) throw new Error(`pages insert failed: ${error.message}`);
  return ins as PageRow;
}

async function ensureRun(pageId: Uuid): Promise<OcrRunRow> {
  const { data } = await db()
    .from("ocr_runs")
    .select("*")
    .eq("page_id", pageId)
    .neq("status", "candidate")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) return data as OcrRunRow;
  const { data: ins, error } = await db()
    .from("ocr_runs")
    .insert({
      page_id: pageId,
      model_name: "kandianguji",
      status: "complete",
    })
    .select("*")
    .single();
  if (error) throw new Error(`ocr_runs insert failed: ${error.message}`);
  return ins as OcrRunRow;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
// `.in()` filters go in the URL — keep lists short. Insert bodies are POSTed.
const IN_CHUNK = 100;
const INS_CHUNK = 500;

/**
 * Persist a page. Append-only: a glyph's OCR origin and each human/Quốc
 * Ngữ change become new `text_versions` rows; prior rows are never
 * mutated. Columns are layout (not history) and are replaced wholesale.
 *
 * Bulk/batched: a constant number of round-trips regardless of character
 * count (a full page ≈ a dozen calls, not thousands). The per-character
 * sequential version was O(n×5) round-trips and hung on real pages.
 */
export async function setPage(
  slug: string,
  page: number,
  data: OcrPageData,
  opts?: {
    /**
     * Source for new text-change versions in THIS save. Default 'human'.
     * The edit PUT route sets this to 'nnv' when the request is the Nôm
     * Na Việt pass (signal: body.nnvCompletedAt is present) so machine
     * refinements aren't recorded as if they were typed corrections.
     */
    machineSource?: "human" | "nnv";
  }
): Promise<void> {
  const doc = await findDocument(slug);
  if (!doc) throw new Error(`setPage: no document for slug "${slug}"`);

  const p = await ensurePage(doc.id, page);
  const run = await ensureRun(p.id);

  // pages: image dims + workflow state.
  {
    const { error } = await db()
      .from("pages")
      .update({
        image_width: data.imageWidth ?? null,
        image_height: data.imageHeight ?? null,
        columns_confirmed_at: data.columnsConfirmedAt ?? null,
        chars_confirmed_at: data.charsConfirmedAt ?? null,
        quocngu_confirmed_at: data.quocNguConfirmedAt ?? null,
        nnv_completed_at: data.nnvCompletedAt ?? null,
        skipped_at: data.skippedAt ?? null,
        ocr_status: data.skippedAt
          ? "skipped"
          : data.columnsConfirmedAt && data.charsConfirmedAt
          ? "corrected"
          : data.spatialData.length
          ? "in-progress"
          : "uncorrected",
      })
      .eq("id", p.id);
    if (error) throw new Error(`pages update: ${error.message}`);
  }

  // columns: replace (layout, not historical).
  await db().from("columns").delete().eq("page_id", p.id);
  if (data.columns?.length) {
    const colRows = data.columns.map((c, i) => ({
      page_id: p.id,
      order_index: i,
      min_x: c.bbox.minX,
      max_x: c.bbox.maxX,
      min_y: c.bbox.minY,
      max_y: c.bbox.maxY,
      kind: c.kind ?? "text",
    }));
    for (const part of chunk(colRows, INS_CHUNK)) {
      const { error } = await db().from("columns").insert(part);
      if (error) throw new Error(`columns insert: ${error.message}`);
    }
  }

  // Existing units (one query).
  const { data: exU } = await db()
    .from("text_units")
    .select("*")
    .eq("page_id", p.id);
  const existingUnits = (exU ?? []) as TextUnitRow[];
  const existByOffset = new Map<number, TextUnitRow>();
  for (const u of existingUnits) existByOffset.set(u.offset, u);
  const incomingOffsets = new Set(data.spatialData.map((c) => c.offset));

  // Delete stale units (cascades versions/candidates), chunked.
  const staleIds = existingUnits
    .filter((u) => !incomingOffsets.has(u.offset))
    .map((u) => u.id);
  for (const part of chunk(staleIds, IN_CHUNK)) {
    const { error } = await db().from("text_units").delete().in("id", part);
    if (error) throw new Error(`text_units delete: ${error.message}`);
  }

  const unitFieldsFor = (ch: SpatialCharacter) => ({
    page_id: p.id,
    ocr_run_id: run.id,
    offset: ch.offset,
    layout_class: ch.layoutClass ?? null,
    ...bboxToQuad(ch.bbox),
    ids: ch.ids ?? null,
    uncertain: !!ch.uncertain,
    no_reading_form: !!ch.noReadingForm,
    qn_uncertain: false,
  });

  // Bulk-insert new units; collect offset → id (incl. surviving existing).
  const offsetToId = new Map<number, Uuid>();
  for (const u of existingUnits) {
    if (incomingOffsets.has(u.offset)) offsetToId.set(u.offset, u.id);
  }
  const newChars = data.spatialData.filter((c) => !existByOffset.has(c.offset));
  for (const part of chunk(newChars, INS_CHUNK)) {
    const { data: ins, error } = await db()
      .from("text_units")
      .insert(part.map(unitFieldsFor))
      .select("id, offset");
    if (error) throw new Error(`text_units insert: ${error.message}`);
    for (const r of (ins ?? []) as { id: Uuid; offset: number }[]) {
      offsetToId.set(r.offset, r.id);
    }
  }

  // Update only existing units whose mutable fields actually changed
  // (typically none after an NNV pass — that changes text, not bbox).
  const unitUpdates: PromiseLike<{ error: unknown }>[] = [];
  for (const ch of data.spatialData) {
    const ex = existByOffset.get(ch.offset);
    if (!ex) continue;
    const f = unitFieldsFor(ch);
    const changed =
      ex.layout_class !== f.layout_class ||
      ex.ids !== f.ids ||
      ex.uncertain !== f.uncertain ||
      ex.no_reading_form !== f.no_reading_form ||
      ex.bbox_x1 !== f.bbox_x1 || ex.bbox_y1 !== f.bbox_y1 ||
      ex.bbox_x2 !== f.bbox_x2 || ex.bbox_y2 !== f.bbox_y2 ||
      ex.bbox_x3 !== f.bbox_x3 || ex.bbox_y3 !== f.bbox_y3 ||
      ex.bbox_x4 !== f.bbox_x4 || ex.bbox_y4 !== f.bbox_y4;
    if (changed) {
      unitUpdates.push(
        db().from("text_units").update(f).eq("id", ex.id) as PromiseLike<{
          error: unknown;
        }>
      );
    }
  }
  for (const part of chunk(unitUpdates, 25)) {
    const rs = await Promise.all(part);
    for (const r of rs) if (r.error) throw new Error(`text_units update`);
  }

  // Existing versions for surviving units (one chunked query), grouped.
  const survivingExistingIds = existingUnits
    .filter((u) => incomingOffsets.has(u.offset))
    .map((u) => u.id);
  const versionsByUnit = new Map<Uuid, TextVersionRow[]>();
  for (const part of chunk(survivingExistingIds, IN_CHUNK)) {
    const { data: vrows } = await db()
      .from("text_versions")
      .select("*")
      .in("text_unit_id", part)
      .order("created_at");
    for (const v of (vrows ?? []) as TextVersionRow[]) {
      const arr = versionsByUnit.get(v.text_unit_id) ?? [];
      arr.push(v);
      versionsByUnit.set(v.text_unit_id, arr);
    }
  }

  // Append-only version inserts (bulk).
  const newVersions: Partial<TextVersionRow>[] = [];
  for (const ch of data.spatialData) {
    const uid = offsetToId.get(ch.offset);
    if (!uid) continue;
    const vs = versionsByUnit.get(uid) ?? [];
    const hasOcr = vs.some(
      (v) => v.source === SRC_OCR || v.source.startsWith("kandi")
    );
    const manuscript = vs.filter((v) => v.source !== SRC_QN);
    const latestText = manuscript[manuscript.length - 1]?.text;
    const latestQn = [...vs].reverse().find((v) => v.source === SRC_QN)?.text;
    if (!hasOcr) {
      newVersions.push({
        text_unit_id: uid,
        ocr_run_id: run.id,
        text: ch.originalText ?? ch.text,
        confidence: ch.confidence ?? null,
        source: SRC_OCR,
      });
    }
    const effectivePrev = latestText ?? ch.originalText ?? ch.text;
    if (ch.text !== effectivePrev || (ch.note && !hasOcr)) {
      newVersions.push({
        text_unit_id: uid,
        ocr_run_id: run.id,
        text: ch.text,
        source: opts?.machineSource === "nnv" ? SRC_NNV : SRC_HUMAN,
        correction_note: ch.note ?? null,
      });
    }
    if (ch.quocNgu && ch.quocNgu !== latestQn) {
      newVersions.push({
        text_unit_id: uid,
        ocr_run_id: run.id,
        text: ch.quocNgu,
        source: SRC_QN,
      });
    }
  }
  for (const part of chunk(newVersions, INS_CHUNK)) {
    const { error } = await db().from("text_versions").insert(part);
    if (error) throw new Error(`text_versions insert: ${error.message}`);
  }

  // Candidates: regenerated by OCR (not history) — replace for all
  // incoming units, chunked.
  const allUnitIds = data.spatialData
    .map((c) => offsetToId.get(c.offset))
    .filter((x): x is Uuid => !!x);
  for (const part of chunk(allUnitIds, IN_CHUNK)) {
    const { error } = await db()
      .from("text_candidates")
      .delete()
      .in("text_unit_id", part);
    if (error) throw new Error(`text_candidates delete: ${error.message}`);
  }
  const candRows: Partial<TextCandidateRow>[] = [];
  for (const ch of data.spatialData) {
    const uid = offsetToId.get(ch.offset);
    if (!uid) continue;
    (ch.choices ?? []).forEach((t, i) =>
      candRows.push({ text_unit_id: uid, text: t, rank: i, source: SRC_OCR })
    );
    (ch.quocNguChoices ?? []).forEach((t, i) =>
      candRows.push({ text_unit_id: uid, text: t, rank: i, source: SRC_QN })
    );
  }
  for (const part of chunk(candRows, INS_CHUNK)) {
    const { error } = await db().from("text_candidates").insert(part);
    if (error) throw new Error(`text_candidates insert: ${error.message}`);
  }

  // Refresh the denormalized read columns (current_text/ocr_text/…) from
  // the versions just written, so the labels/unencoded pages stay
  // O(result) instead of re-deriving the whole corpus. One set-based call.
  //
  // Best-effort: if the `20260519_text_units_denorm` migration hasn't been
  // applied yet the function is absent — saving must still work, the
  // labels pages just won't reflect this edit until the migration + its
  // backfill run. Surfaced as a warning, never fatal.
  {
    const { error } = await db().rpc("refresh_page_denorm", {
      p_page_id: p.id,
    });
    if (error) {
      console.warn(
        `[ocr-store] refresh_page_denorm skipped (${error.message}). ` +
          `Apply supabase/migrations/20260519_text_units_denorm.sql.`
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Index / listing
// ─────────────────────────────────────────────────────────────────────────

export async function listIndex(): Promise<Record<string, IndexEntry>> {
  const { data: docs, error } = await db()
    .from("documents")
    .select("*");
  if (error) throw new Error(`documents list failed: ${error.message}`);
  const docRows = ((docs ?? []) as DocumentRow[]).filter((d) => !!d.slug);
  const out: Record<string, IndexEntry> = {};
  if (docRows.length === 0) return out;

  // Was N+1: one `pages` query PER document. Now one bulk paged read of
  // every page for all docs (tiny rows — workflow flags only, no
  // spatialData), grouped in memory. `pages` is one row per page, so
  // even the whole corpus is a few 1000-row pages, not the glyph table.
  const docIds = docRows.map((d) => d.id);
  const allPages = await selectAllRanged<
    Pick<
      PageRow,
      | "document_id"
      | "columns_confirmed_at"
      | "chars_confirmed_at"
      | "skipped_at"
      | "ocr_status"
    >
  >(() =>
    db()
      .from("pages")
      .select(
        "document_id,columns_confirmed_at,chars_confirmed_at,skipped_at,ocr_status"
      )
      .in("document_id", docIds)
      .order("id")
  );
  const byDoc = new Map<Uuid, typeof allPages>();
  for (const pg of allPages) {
    const arr = byDoc.get(pg.document_id) ?? [];
    arr.push(pg);
    byDoc.set(pg.document_id, arr);
  }

  for (const d of docRows) {
    const pr = byDoc.get(d.id) ?? [];
    let pagesWithData = 0;
    let pagesFullyConfirmed = 0;
    let pagesSkipped = 0;
    for (const pg of pr) {
      if (pg.skipped_at) pagesSkipped++;
      else {
        if (pg.ocr_status && pg.ocr_status !== "uncorrected") pagesWithData++;
        if (pg.columns_confirmed_at && pg.chars_confirmed_at)
          pagesFullyConfirmed++;
      }
    }
    const pageCount = pr.length;
    const done = pagesFullyConfirmed + pagesSkipped;
    const touched = pagesWithData + pagesSkipped;
    const status: DocumentStatus =
      touched === 0
        ? "uncorrected"
        : done < pageCount
        ? "in-progress"
        : "corrected";
    out[d.slug as string] = {
      status,
      pageCount,
      pagesWithData,
      pagesFullyConfirmed,
      pagesSkipped,
      lastEditedAt: d.created_at,
      title: d.title,
    };
  }
  return out;
}

export async function listPages(slug: string): Promise<OcrPageData[]> {
  const m = await getManifest(slug);
  if (!m) return [];
  const out: OcrPageData[] = [];
  for (let p = 1; p <= m.pageCount; p++) {
    const d = await getPage(slug, p);
    if (d) out.push(d);
  }
  return out;
}

/**
 * Whole-document read tuned for the TXT export.
 *
 * Plain listPages() does pageCount sequential getPage() calls, and each
 * getPage() walks text_versions + text_candidates to reconstruct the
 * current text. For an N-page export that's O(N) round trips + an
 * O(corpus) version walk — easily many seconds on a long document.
 *
 * Instead this is three batched, paged queries:
 *   - pages (id, page_number) for the document          — 1 query
 *   - text_units selecting only what export needs       — chunked .in()
 *   - confirmed columns                                 — chunked .in()
 * Uses the denormalized `current_text` column (see
 * 20260519_text_units_denorm.sql) so no version reconstruction is
 * needed. Row count is bounded by the corpus, not the page count, so
 * latency scales with content size, not page count.
 *
 * Returned cells carry just the fields the export consumer needs —
 * `text` (current_text) and `bbox`. Pages are emitted in page order;
 * pages with no text_units are still included with an empty
 * spatialData so caller can preserve page boundaries.
 */
export async function getDocTextForExport(slug: string): Promise<
  Array<{
    pageNumber: number;
    spatialData: Array<{ text: string; bbox: SpatialCharacter["bbox"] }>;
    columns: ConfirmedColumn[];
  }>
> {
  const doc = await findDocument(slug);
  if (!doc) return [];

  const { data: pageRows, error: pErr } = await db()
    .from("pages")
    .select("id,page_number")
    .eq("document_id", doc.id)
    .order("page_number");
  if (pErr) throw new Error(`pages list: ${pErr.message}`);
  const pages = ((pageRows ?? []) as Array<{ id: Uuid; page_number: number }>);
  if (!pages.length) return [];
  const pageIds = pages.map((p) => p.id);

  type UnitLite = Pick<
    TextUnitRow,
    | "page_id"
    | "offset"
    | "bbox_x1" | "bbox_y1"
    | "bbox_x2" | "bbox_y2"
    | "bbox_x3" | "bbox_y3"
    | "bbox_x4" | "bbox_y4"
  > & { current_text: string | null };

  const [unitsByPage, colsByPage] = await Promise.all([
    (async () => {
      const m = new Map<
        Uuid,
        Array<{ text: string; bbox: SpatialCharacter["bbox"] }>
      >();
      for (const part of chunk(pageIds, IN_CHUNK)) {
        const rows = await selectAllRanged<UnitLite>(() =>
          db()
            .from("text_units")
            .select(
              "page_id,offset,current_text," +
                "bbox_x1,bbox_y1,bbox_x2,bbox_y2,bbox_x3,bbox_y3,bbox_x4,bbox_y4"
            )
            .in("page_id", part)
            .order("offset")
        );
        for (const r of rows) {
          const arr = m.get(r.page_id) ?? [];
          arr.push({
            text: r.current_text ?? "",
            // quadToBbox only reads bbox_x*/bbox_y* — narrowing via unknown
            // because UnitLite intentionally drops the columns we don't need.
            bbox: quadToBbox(r as unknown as TextUnitRow),
          });
          m.set(r.page_id, arr);
        }
      }
      return m;
    })(),
    loadColumnsForPages(pageIds),
  ]);

  return pages.map((p) => ({
    pageNumber: p.page_number,
    spatialData: unitsByPage.get(p.id) ?? [],
    columns: colsByPage.get(p.id) ?? [],
  }));
}

// ─────────────────────────────────────────────────────────────────────────
// Corpus-walk internals (denormalized-read model)
//
// The labels / unencoded pages summarize the whole corpus. Deriving each
// glyph's current/OCR-origin text from the append-only text_versions
// history at read time is O(corpus size) — the load-time wall as the
// corpus grows. Instead `setPage` maintains cached `current_text` /
// `ocr_text` / `ocr_confidence` / `current_note` columns on text_units
// (see 20260519_text_units_denorm.sql), so these reads are single-table,
// indexed, and O(result size): the GROUP BY aggregate is a Postgres
// function (PostgREST can't GROUP BY ad hoc) and search/registry are
// plain indexed selects with server-side paging.
// ─────────────────────────────────────────────────────────────────────────

const PG_PAGE = 1000;

/**
 * Run `build()` repeatedly with advancing `.range()` windows until a short
 * page signals the end. `build()` must return a *fresh* query each call
 * (a PostgREST builder is single-use) with its ordering already applied so
 * pagination is stable.
 */
async function selectAllRanged<T>(
  build: () => { range: (a: number, b: number) => PromiseLike<{ data: unknown; error: { message: string } | null }> }
): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await build().range(from, from + PG_PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PG_PAGE) break;
    from += PG_PAGE;
  }
  return out;
}

interface ScopeDoc {
  id: Uuid;
  slug: string;
  title: string;
}
async function loadScopeDocs(slug?: string): Promise<ScopeDoc[]> {
  let q = db().from("documents").select("id,slug,title");
  if (slug) q = q.eq("slug", slug);
  const { data, error } = await q;
  if (error) throw new Error(`documents list: ${error.message}`);
  return ((data ?? []) as DocumentRow[])
    .filter((d) => !!d.slug)
    .map((d) => ({ id: d.id, slug: d.slug as string, title: d.title }));
}

/**
 * Confirmed columns for a *small, explicit* set of pages — only ever the
 * distinct pages of the current (already capped) result slice, so this is
 * a tiny scoped fetch, not a corpus walk. Used to label each occurrence
 * with its 1-based column number.
 */
async function loadColumnsForPages(
  pageIds: Uuid[]
): Promise<Map<Uuid, ConfirmedColumn[]>> {
  const out = new Map<Uuid, ConfirmedColumn[]>();
  if (!pageIds.length) return out;
  const raw = new Map<Uuid, ColumnRow[]>();
  for (const part of chunk(pageIds, IN_CHUNK)) {
    const rows = await selectAllRanged<ColumnRow>(() =>
      db()
        .from("columns")
        .select("*")
        .in("page_id", part)
        .order("order_index")
    );
    for (const c of rows) {
      const arr = raw.get(c.page_id) ?? [];
      arr.push(c);
      raw.set(c.page_id, arr);
    }
  }
  // Paged fetches can interleave pages — re-sort each page by order_index.
  for (const [pid, cols] of raw) {
    out.set(
      pid,
      cols
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((c) => ({
          bbox: { minX: c.min_x, maxX: c.max_x, minY: c.min_y, maxY: c.max_y },
          kind: c.kind,
        }))
    );
  }
  return out;
}

/** Slug + title for every document, sorted by title. One query — cheap
 *  enough to feed the labels/unencoded document pickers without the N+1
 *  `listIndex` page-status aggregation those pages don't need. */
export async function listDocumentsBrief(): Promise<
  Array<{ slug: string; title: string }>
> {
  const docs = await loadScopeDocs();
  return docs
    .map((d) => ({ slug: d.slug, title: d.title }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

// ─────────────────────────────────────────────────────────────────────────
// Aggregated relabels (derived corrections view)
//
// Ported from nom-ocr-training's `getAggregatedRelabels`. The labels page
// uses this to surface the most common human corrections. Computed in
// Postgres by the `ocr.aggregated_relabels` function over the cached
// `ocr_text`/`current_text` columns — one round trip, result-sized.
// ─────────────────────────────────────────────────────────────────────────

export interface AggregatedRelabel {
  from: string;
  to: string;
  /** Cells across the scope where text differs from originalText for this pair. */
  totalChars: number;
  /**
   * Cells across the scope where current text === `from`. Counts how many
   * un-relabeled instances of the original character are still sitting in
   * the corpus — i.e. how many you'd see if you searched for `from` on the
   * labels page. Gauges how much follow-up bulk work remains for a
   * recurring confusion.
   */
  remainingFrom: number;
}

/**
 * Frequent OCR→human corrections. One Postgres call: `ocr.aggregated_
 * relabels` does the GROUP BY over the indexed `ocr_text`/`current_text`
 * columns and the same non-empty / NFC-trim filters the app used to apply
 * row-by-row. Returns only the (few hundred) result rows. `slug` scopes
 * to one document; omit for corpus-wide.
 */
export async function getAggregatedRelabels(opts?: {
  slug?: string;
}): Promise<AggregatedRelabel[]> {
  const { data, error } = await db().rpc("aggregated_relabels", {
    p_slug: opts?.slug ?? null,
  });
  if (error) {
    throw new Error(
      `aggregated_relabels: ${error.message}. Apply ` +
        `supabase/migrations/20260519_text_units_denorm.sql.`
    );
  }
  const rows = (data ?? []) as Array<{
    from_text: string;
    to_text: string;
    total_chars: number | string;
    remaining_from: number | string;
  }>;
  // Already ordered by total desc in SQL.
  return rows.map((r) => ({
    from: r.from_text,
    to: r.to_text,
    totalChars: Number(r.total_chars),
    remainingFrom: Number(r.remaining_from),
  }));
}

// ─────────────────────────────────────────────────────────────────────────
// Character occurrences (labels-page search)
//
// Every glyph whose `current_text` === query, across the scope. An indexed
// equality select with embedded page/document, server-side paged via
// `.range()` + an exact count — so the labels grid fetches one capped page
// of results, never the whole match set (a hot glyph in a big corpus can
// have thousands).
// ─────────────────────────────────────────────────────────────────────────

export interface CharOccurrence {
  slug: string;
  title: string;
  page: number;
  offset: number;
  bbox: Array<{ x: number; y: number }> | null;
  text: string;
  confidence: number;
  uncertain: boolean;
  noReadingForm: boolean;
  ids: string;
  note: string;
  column: number | null;
}

/** Default page size for the labels occurrence grid. */
export const OCCURRENCES_PAGE_SIZE = 200;

export interface CharOccurrencePage {
  occurrences: CharOccurrence[];
  /** Total matches across the scope (not just this page). */
  total: number;
}

interface UnitRow {
  offset: number;
  bbox_x1: number | null;
  bbox_y1: number | null;
  bbox_x2: number | null;
  bbox_y2: number | null;
  bbox_x3: number | null;
  bbox_y3: number | null;
  bbox_x4: number | null;
  bbox_y4: number | null;
  uncertain: boolean;
  no_reading_form: boolean;
  ids: string | null;
  current_text: string | null;
  current_note: string | null;
  ocr_confidence: number | null;
  page_id: Uuid;
  pages: {
    page_number: number;
    documents: { slug: string; title: string } | null;
  } | null;
}

const OCC_SELECT =
  "offset,bbox_x1,bbox_y1,bbox_x2,bbox_y2,bbox_x3,bbox_y3,bbox_x4,bbox_y4," +
  "uncertain,no_reading_form,ids,current_note,ocr_confidence,page_id," +
  "pages!inner(page_number,documents!inner(slug,title))";

export async function findCharOccurrences(
  query: string,
  opts?: { slug?: string; limit?: number; offset?: number }
): Promise<CharOccurrencePage> {
  if (!query) return { occurrences: [], total: 0 };
  const limit = opts?.limit ?? OCCURRENCES_PAGE_SIZE;
  const offset = opts?.offset ?? 0;

  let q = db()
    .from("text_units")
    .select(OCC_SELECT, { count: "exact" })
    .eq("current_text", query);
  if (opts?.slug) q = q.eq("pages.documents.slug", opts.slug);
  // Deterministic order so paging is stable.
  q = q
    .order("page_id", { ascending: true })
    .order("offset", { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await q;
  if (error) {
    throw new Error(
      `findCharOccurrences: ${error.message}. Apply ` +
        `supabase/migrations/20260519_text_units_denorm.sql.`
    );
  }
  const rows = (data ?? []) as unknown as UnitRow[];

  // Column number needs the confirmed columns of just these (≤limit)
  // pages — a small scoped fetch, not a corpus walk.
  const pageIds = [...new Set(rows.map((r) => r.page_id))];
  const colsByPage = await loadColumnsForPages(pageIds);

  const occurrences: CharOccurrence[] = rows.map((u) => {
    const bbox = quadToBbox(u as unknown as TextUnitRow);
    const doc = u.pages?.documents;
    return {
      slug: doc?.slug ?? "",
      title: doc?.title ?? doc?.slug ?? "",
      page: u.pages?.page_number ?? 0,
      offset: u.offset,
      bbox,
      text: query,
      confidence: u.ocr_confidence ?? 0,
      uncertain: !!u.uncertain,
      noReadingForm: !!u.no_reading_form,
      ids: u.ids ?? "",
      note: u.current_note ?? "",
      column: findColumnIndex(bbox, colsByPage.get(u.page_id)),
    };
  });
  return { occurrences, total: count ?? occurrences.length };
}

// ─────────────────────────────────────────────────────────────────────────
// Unencoded-character registry
//
// Ported from nom-ocr-training's `/unencoded`. Groups every glyph the
// labeler has tagged with an Ideographic Description Sequence (IDS) by
// that IDS string, so unencoded characters can be reviewed corpus-wide.
// No on-disk snapshot (the FS sibling wrote `_unencoded.json`); the
// Supabase store is the source of truth and the route streams JSON.
// ─────────────────────────────────────────────────────────────────────────

export interface UnencodedSource {
  slug: string;
  title: string;
  page: number;
  offset: number;
  /** Normalized 0..1 glyph quad; client-side crop input. */
  bbox: Array<{ x: number; y: number }> | null;
  confidence: number;
  uncertain: boolean;
  /** 1-based column number from the page's confirmed columns; null when
   *  columns aren't confirmed or the char doesn't fall inside any. */
  column: number | null;
}

export interface UnencodedEntry {
  ids: string;
  count: number;
  /** Distinct placeholder glyphs the labeler typed for this IDS. */
  placeholders: string[];
  notes: string[];
  sources: UnencodedSource[];
}

/**
 * Group every IDS-tagged glyph by its trimmed `ids` string, one entry per
 * distinct IDS, sorted by occurrence count desc. Cheap: a single select
 * hits the `ids IS NOT NULL` partial index, so only the (usually few)
 * tagged units are fetched — placeholder/note/confidence come straight
 * off the cached denorm columns, no version walk.
 */
export async function buildUnencodedRegistry(): Promise<UnencodedEntry[]> {
  const sel =
    "offset,bbox_x1,bbox_y1,bbox_x2,bbox_y2,bbox_x3,bbox_y3,bbox_x4,bbox_y4," +
    "uncertain,ids,current_text,current_note,ocr_confidence,page_id," +
    "pages!inner(page_number,documents!inner(slug,title))";
  let rows: UnitRow[];
  try {
    rows = await selectAllRanged<UnitRow>(() =>
      db()
        .from("text_units")
        .select(sel)
        .not("ids", "is", null)
        .order("page_id")
        .order("offset")
    );
  } catch (e: any) {
    throw new Error(
      `buildUnencodedRegistry: ${e?.message}. Apply ` +
        `supabase/migrations/20260519_text_units_denorm.sql.`
    );
  }
  if (!rows.length) return [];

  const pageIds = [...new Set(rows.map((r) => r.page_id))];
  const colsByPage = await loadColumnsForPages(pageIds);

  const groups = new Map<string, UnencodedEntry>();
  for (const u of rows) {
    const ids = (u.ids ?? "").trim();
    if (!ids) continue;
    const doc = u.pages?.documents;
    const text = u.current_text;
    let entry = groups.get(ids);
    if (!entry) {
      entry = { ids, count: 0, placeholders: [], notes: [], sources: [] };
      groups.set(ids, entry);
    }
    entry.count++;
    if (text && !entry.placeholders.includes(text)) {
      entry.placeholders.push(text);
    }
    const n = (u.current_note ?? "").trim();
    if (n && !entry.notes.includes(n)) entry.notes.push(n);
    const bbox = quadToBbox(u as unknown as TextUnitRow);
    entry.sources.push({
      slug: doc?.slug ?? "",
      title: doc?.title ?? doc?.slug ?? "",
      page: u.pages?.page_number ?? 0,
      offset: u.offset,
      bbox,
      confidence: u.ocr_confidence ?? 0,
      uncertain: !!u.uncertain,
      column: findColumnIndex(bbox, colsByPage.get(u.page_id)),
    });
  }
  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

/** One row of the per-document OCR dashboard (cheap — no spatialData). */
export interface PageSummary {
  pageNumber: number;
  ocrStatus: string;
  columns: number;
  chars: number;
  columnsConfirmedAt: string | null;
  charsConfirmedAt: string | null;
  quocNguConfirmedAt: string | null;
  nnvCompletedAt: string | null;
  skippedAt: string | null;
}

/**
 * Per-page summaries for the document OCR dashboard.
 *
 * Fast path: ONE aggregate query against the `ocr.page_summary` view
 * (supabase/migrations/20260519_page_summary_view.sql) — one row per
 * page with column/char counts computed in-DB. Replaces the old
 * 2-head-counts-PER-PAGE fan-out (44 round-trips for a 22-page doc).
 *
 * Fallback: if that migration hasn't been applied the view is absent,
 * so we drop to the legacy per-page count path (correct, just slow) and
 * warn. Applying the migration is therefore safe in any order vs deploy.
 */
export async function listPageSummaries(
  slug: string
): Promise<PageSummary[]> {
  const doc = await findDocument(slug);
  if (!doc) return [];

  const { data, error } = await db()
    .from("page_summary")
    .select(
      "page_number,ocr_status,columns_confirmed_at,chars_confirmed_at,quocngu_confirmed_at,nnv_completed_at,skipped_at,column_count,char_count"
    )
    .eq("document_id", doc.id)
    .order("page_number");

  if (!error && data) {
    return (
      data as Array<{
        page_number: number;
        ocr_status: string;
        columns_confirmed_at: string | null;
        chars_confirmed_at: string | null;
        quocngu_confirmed_at: string | null;
        nnv_completed_at: string | null;
        skipped_at: string | null;
        column_count: number | null;
        char_count: number | null;
      }>
    ).map((r) => ({
      pageNumber: r.page_number,
      ocrStatus: r.ocr_status,
      columns: r.column_count ?? 0,
      chars: r.char_count ?? 0,
      columnsConfirmedAt: r.columns_confirmed_at,
      charsConfirmedAt: r.chars_confirmed_at,
      quocNguConfirmedAt: r.quocngu_confirmed_at,
      nnvCompletedAt: r.nnv_completed_at,
      skippedAt: r.skipped_at,
    }));
  }

  console.warn(
    `[ocr-store] ocr.page_summary unavailable (${error?.message}); ` +
      `falling back to per-page counts. Apply ` +
      `supabase/migrations/20260519_page_summary_view.sql to speed up ` +
      `the OCR dashboard.`
  );
  return legacyListPageSummaries(doc.id);
}

/** Pre-view path: 1 `pages` query + 2 head-counts per page (N+1). */
async function legacyListPageSummaries(
  docId: Uuid
): Promise<PageSummary[]> {
  const { data, error } = await db()
    .from("pages")
    .select(
      "id,page_number,ocr_status,columns_confirmed_at,chars_confirmed_at,quocngu_confirmed_at,nnv_completed_at,skipped_at"
    )
    .eq("document_id", docId)
    .order("page_number");
  if (error) throw new Error(`pages list: ${error.message}`);
  const rows = (data ?? []) as Array<{
    id: Uuid;
    page_number: number;
    ocr_status: string;
    columns_confirmed_at: string | null;
    chars_confirmed_at: string | null;
    quocngu_confirmed_at: string | null;
    nnv_completed_at: string | null;
    skipped_at: string | null;
  }>;
  if (rows.length === 0) return [];

  const colCount = new Map<Uuid, number>();
  const charCount = new Map<Uuid, number>();
  for (const part of chunk(rows, 12)) {
    const res = await Promise.all(
      part.flatMap((r) => [
        db()
          .from("columns")
          .select("id", { count: "exact", head: true })
          .eq("page_id", r.id),
        db()
          .from("text_units")
          .select("id", { count: "exact", head: true })
          .eq("page_id", r.id)
          .not("bbox_x1", "is", null),
      ])
    );
    part.forEach((r, i) => {
      colCount.set(r.id, res[i * 2].count ?? 0);
      charCount.set(r.id, res[i * 2 + 1].count ?? 0);
    });
  }

  return rows.map((r) => ({
    pageNumber: r.page_number,
    ocrStatus: r.ocr_status,
    columns: colCount.get(r.id) ?? 0,
    chars: charCount.get(r.id) ?? 0,
    columnsConfirmedAt: r.columns_confirmed_at,
    charsConfirmedAt: r.chars_confirmed_at,
    quocNguConfirmedAt: r.quocngu_confirmed_at,
    nnvCompletedAt: r.nnv_completed_at,
    skippedAt: r.skipped_at,
  }));
}

// ─────────────────────────────────────────────────────────────────────────
// Page image resolution
// ─────────────────────────────────────────────────────────────────────────

/**
 * Resolve a page image to a URL. IIIF docs store a resolved image URL in
 * `pages.image_url`; PDF/upload docs store a Supabase Storage URL there.
 * Either way the consumer just needs the URL.
 */
export async function resolvePageImage(
  slug: string,
  page: number
): Promise<PageImageSource | null> {
  const doc = await findDocument(slug);
  if (!doc) return null;
  const { data } = await db()
    .from("pages")
    .select("image_url")
    .eq("document_id", doc.id)
    .eq("page_number", page)
    .maybeSingle();
  const url = (data as { image_url: string | null } | null)?.image_url;
  if (!url) return null;
  return { kind: "iiif", url };
}

// ─────────────────────────────────────────────────────────────────────────
// Global settings
// TODO(settings-table): no settings table in the schema yet. Reads return
// the built-in default; writes are a no-op. Add an `app_settings`
// single-row table (or documents-independent KV) when needed.
// ─────────────────────────────────────────────────────────────────────────

export async function getGlobalSettings(): Promise<GlobalSettings> {
  return { defaultPreprocessing: INITIAL_DEFAULT_KNOBS };
}

export async function setGlobalSettings(_s: GlobalSettings): Promise<void> {
  /* no-op until an app_settings table exists */
}
