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
const SRC_QN = "quoc-ngu";

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
    const ocrV = vs.find((v) => v.source === SRC_OCR || v.source.startsWith("kandi"));
    const manuscript = vs.filter((v) => v.source !== SRC_QN);
    const latest = manuscript[manuscript.length - 1];
    const qnV = [...vs].reverse().find((v) => v.source === SRC_QN);
    const cs = cByUnit.get(u.id) ?? [];
    const ocrChoices = cs.filter((c) => c.source === SRC_OCR).map((c) => c.text);
    const qnChoices = cs.filter((c) => c.source === SRC_QN).map((c) => c.text);

    const ch: SpatialCharacter = {
      text: latest?.text ?? ocrV?.text ?? "",
      bbox: quadToBbox(u),
      confidence: ocrV?.confidence ?? 0,
      offset: u.offset,
    };
    if (ocrV && ocrV.text !== ch.text) ch.originalText = ocrV.text;
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
  data: OcrPageData
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
        source: SRC_HUMAN,
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
}

// ─────────────────────────────────────────────────────────────────────────
// Index / listing
// ─────────────────────────────────────────────────────────────────────────

export async function listIndex(): Promise<Record<string, IndexEntry>> {
  const { data: docs, error } = await db()
    .from("documents")
    .select("*");
  if (error) throw new Error(`documents list failed: ${error.message}`);
  const out: Record<string, IndexEntry> = {};
  for (const d of (docs ?? []) as DocumentRow[]) {
    if (!d.slug) continue;
    // TODO(view): N+1 per doc — replace with a SQL view/RPC that
    // aggregates page workflow state once listIndex is hot.
    const { data: pages } = await db()
      .from("pages")
      .select(
        "columns_confirmed_at,chars_confirmed_at,skipped_at,ocr_status"
      )
      .eq("document_id", d.id);
    const pr = (pages ?? []) as Pick<
      PageRow,
      "columns_confirmed_at" | "chars_confirmed_at" | "skipped_at" | "ocr_status"
    >[];
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
    out[d.slug] = {
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
 * Per-page summaries for the document OCR dashboard. One `pages` query
 * for status/workflow flags (no spatialData), then exact column / glyph
 * counts via head-count queries (accurate past PostgREST's 1000-row cap,
 * unlike a bulk select+tally). N+1 like `listIndex` — fine at admin
 * scale; TODO(view): fold into a SQL view/RPC if it gets hot.
 */
export async function listPageSummaries(
  slug: string
): Promise<PageSummary[]> {
  const doc = await findDocument(slug);
  if (!doc) return [];
  const { data, error } = await db()
    .from("pages")
    .select(
      "id,page_number,ocr_status,columns_confirmed_at,chars_confirmed_at,quocngu_confirmed_at,nnv_completed_at,skipped_at"
    )
    .eq("document_id", doc.id)
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
