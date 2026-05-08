import fs from "fs/promises";
import path from "path";
import {
  getIndex,
  setIndexEntry,
  setPage,
  getPage,
  computeRawText,
  rebuildSearchIndex,
  uploadDir,
  uploadSourcePath,
  type OcrIndexEntry,
} from "./ocr-store";
import { callKandianguji } from "./kandianguji-ocr";
import { getCanvasesFromManifest, resolveOcrImageUrl } from "./iiif-utils";
import { recordCall, canMakeCall } from "./ocr-usage";
import { pdf } from "pdf-to-img";

// ── File-backed pipeline state ──
// State is persisted to disk so it survives page refreshes and server restarts.
// globalThis is used to keep the running promise alive across hot reloads in dev.

const PIPELINE_FILE = path.join(process.cwd(), "data", "ocr", "_pipeline.json");

export type PipelineState = "idle" | "running" | "stopping" | "stopping-after-doc";

export interface DocumentProgress {
  slug: string;
  title: string;
  totalPages: number;
  completedPages: number;
  status: "waiting" | "processing" | "complete" | "error";
  source?: OcrIndexEntry["source"];
  error?: string;
}

interface PipelineStatus {
  state: PipelineState;
  documents: DocumentProgress[];
  currentSlug: string | null;
  currentPage: number | null;
  startedAt: string | null;
  pagesProcessed: number;
  errors: number;
}

const DEFAULT_STATUS: PipelineStatus = {
  state: "idle",
  documents: [],
  currentSlug: null,
  currentPage: null,
  startedAt: null,
  pagesProcessed: 0,
  errors: 0,
};

// ── Persistence ──

async function readStatus(): Promise<PipelineStatus> {
  try {
    const raw = await fs.readFile(PIPELINE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT_STATUS };
  }
}

async function writeStatus(status: PipelineStatus) {
  await fs.mkdir(path.dirname(PIPELINE_FILE), { recursive: true });
  await fs.writeFile(PIPELINE_FILE, JSON.stringify(status, null, 2), "utf-8");
}

// ── Global handle to prevent duplicate loops across hot reloads ──

const globalAny = globalThis as any;

function isRunningInProcess(): boolean {
  return globalAny.__ocrPipelineRunning === true;
}

function markRunningInProcess(running: boolean) {
  globalAny.__ocrPipelineRunning = running;
}

/** An entry is processable by the unified pipeline if we know how to fetch
 *  its source — IIIF docs need a manifest URL, PDF docs need source: "pdf"
 *  (the source.pdf file is read from data/uploads/{slug}/source.pdf, with a
 *  legacy fallback inside processPdfDocument). */
function isProcessable(entry: OcrIndexEntry): boolean {
  return Boolean(entry.manifestUrl) || entry.source === "pdf";
}

// ── Public API ──

export async function getPipelineStatus(): Promise<PipelineStatus> {
  return readStatus();
}

export async function stopPipeline() {
  const status = await readStatus();
  if (status.state === "running" || status.state === "stopping-after-doc") {
    status.state = "stopping";
    await writeStatus(status);
  }
}

export async function stopAfterDocument() {
  const status = await readStatus();
  if (status.state === "running") {
    status.state = "stopping-after-doc";
    await writeStatus(status);
  }
}

export async function startPipeline(): Promise<{ started: boolean; reason?: string }> {
  const status = await readStatus();
  if (status.state === "running" && isRunningInProcess()) {
    return { started: false, reason: "Pipeline is already running" };
  }

  const index = await getIndex();
  const toProcess: Array<{ slug: string; entry: OcrIndexEntry }> = [];
  for (const [slug, entry] of Object.entries(index)) {
    if (
      (entry.status === "queued" || entry.status === "pending" || entry.status === "processing") &&
      isProcessable(entry)
    ) {
      toProcess.push({ slug, entry });
    }
  }

  if (toProcess.length === 0) {
    return { started: false, reason: "No documents in queue" };
  }

  // Count already-completed pages for each document (for resumability display)
  const docs: DocumentProgress[] = [];
  for (const { slug, entry } of toProcess) {
    let completedPages = 0;
    if (entry.pageCount > 0) {
      for (let i = 1; i <= entry.pageCount; i++) {
        const existing = await getPage(slug, i);
        if (existing && existing.spatialData.length > 0) completedPages = i;
        else break;
      }
    }
    docs.push({
      slug,
      title: entry.title ?? slug,
      totalPages: entry.pageCount || 0,
      completedPages,
      status: "waiting",
      source: entry.source,
    });
  }

  const newStatus: PipelineStatus = {
    state: "running",
    documents: docs,
    currentSlug: null,
    currentPage: null,
    startedAt: new Date().toISOString(),
    pagesProcessed: 0,
    errors: 0,
  };
  await writeStatus(newStatus);

  // Fire and forget — runs in the Node.js process background
  markRunningInProcess(true);
  processQueue().catch(async () => {
    const s = await readStatus();
    s.state = "idle";
    await writeStatus(s);
  }).finally(() => {
    markRunningInProcess(false);
  });

  return { started: true };
}

/**
 * Check if the pipeline was left in "running" state from a previous server session
 * and resume it. Also detects documents stuck in "processing" in the index
 * (e.g. from the old in-memory pipeline) and creates a pipeline file for them.
 * Called automatically when status is read.
 */
export async function resumeIfNeeded() {
  if (isRunningInProcess()) return; // already running in this process

  const status = await readStatus();

  if (status.state === "running") {
    // Pipeline file says running but no process — resume
    markRunningInProcess(true);
    processQueue().catch(async () => {
      const s = await readStatus();
      s.state = "idle";
      await writeStatus(s);
    }).finally(() => {
      markRunningInProcess(false);
    });
    return;
  }

  // No pipeline file or it says idle — check if the index has orphaned "processing" docs
  const index = await getIndex();
  const processingDocs = Object.entries(index).filter(
    ([, e]) => e.status === "processing" && isProcessable(e)
  );
  if (processingDocs.length === 0) return;

  // Also pick up any queued/pending docs while we're at it
  const toProcess = Object.entries(index).filter(
    ([, e]) =>
      (e.status === "processing" || e.status === "queued" || e.status === "pending") &&
      isProcessable(e)
  );

  // Build pipeline state from index and start
  const docs: DocumentProgress[] = [];
  for (const [slug, entry] of toProcess) {
    let completedPages = 0;
    if (entry.pageCount > 0) {
      for (let i = 1; i <= entry.pageCount; i++) {
        const existing = await getPage(slug, i);
        if (existing && existing.spatialData.length > 0) completedPages = i;
        else break;
      }
    }
    docs.push({
      slug,
      title: entry.title ?? slug,
      totalPages: entry.pageCount || 0,
      completedPages,
      status: entry.status === "processing" ? "processing" : "waiting",
      source: entry.source,
    });
  }

  const newStatus: PipelineStatus = {
    state: "running",
    documents: docs,
    currentSlug: null,
    currentPage: null,
    startedAt: new Date().toISOString(),
    pagesProcessed: 0,
    errors: 0,
  };
  await writeStatus(newStatus);

  markRunningInProcess(true);
  processQueue().catch(async () => {
    const s = await readStatus();
    s.state = "idle";
    await writeStatus(s);
  }).finally(() => {
    markRunningInProcess(false);
  });
}

// ── Processing loop ──

async function processQueue() {
  let status = await readStatus();

  for (const doc of status.documents) {
    // Re-read state each iteration to pick up stop requests
    status = await readStatus();
    if (status.state === "stopping" || status.state === "stopping-after-doc" || status.state === "idle") break;

    const docInFile = status.documents.find((d) => d.slug === doc.slug);
    if (!docInFile || docInFile.status === "complete") continue;

    docInFile.status = "processing";
    status.currentSlug = doc.slug;
    await writeStatus(status);

    try {
      await processDocument(doc.slug);
      status = await readStatus();
      const d = status.documents.find((d) => d.slug === doc.slug);
      if (d) d.status = "complete";
      await writeStatus(status);
    } catch (e: any) {
      status = await readStatus();
      const d = status.documents.find((d) => d.slug === doc.slug);
      if (d) { d.status = "error"; d.error = e.message; }
      status.errors++;
      await writeStatus(status);
    }
  }

  status = await readStatus();
  status.state = "idle";
  status.currentSlug = null;
  status.currentPage = null;
  await writeStatus(status);
}

async function processDocument(slug: string) {
  const index = await getIndex();
  const entry = index[slug];
  if (!entry) throw new Error(`No index entry for ${slug}`);
  if (entry.source === "pdf") return processPdfDocument(slug, entry);
  if (entry.manifestUrl) return processIiifDocument(slug, entry);
  throw new Error(`Entry "${slug}" has neither source:"pdf" nor manifestUrl`);
}

async function processIiifDocument(slug: string, entry: OcrIndexEntry) {
  if (!entry.manifestUrl) throw new Error("No manifest URL");

  const manifestRes = await fetch(entry.manifestUrl);
  if (!manifestRes.ok) throw new Error(`Failed to fetch manifest: ${manifestRes.status}`);
  const manifest = await manifestRes.json();
  const canvases = getCanvasesFromManifest(manifest);

  await setIndexEntry(slug, { status: "processing", pageCount: canvases.length });

  // Update pipeline file with total pages
  let status = await readStatus();
  const doc = status.documents.find((d) => d.slug === slug);
  if (doc) doc.totalPages = canvases.length;
  await writeStatus(status);

  // Find where to resume from
  let startFrom = 0;
  for (let i = 0; i < canvases.length; i++) {
    const existing = await getPage(slug, i + 1);
    if (existing && existing.spatialData.length > 0) {
      startFrom = i + 1;
    } else {
      break;
    }
  }

  // Update completed pages count for resumed docs
  if (startFrom > 0) {
    status = await readStatus();
    const d = status.documents.find((d) => d.slug === slug);
    if (d) d.completedPages = startFrom;
    await writeStatus(status);
  }

  for (let i = startFrom; i < canvases.length; i++) {
    // Check for stop request — save progress before returning
    status = await readStatus();
    if (status.state === "stopping" || status.state === "idle") {
      await setIndexEntry(slug, { status: "partial", pageCount: canvases.length });
      try { await rebuildSearchIndex(slug, canvases.length); } catch { /* non-critical */ }
      return;
    }

    // Check usage limits
    const allowed = await canMakeCall();
    if (!allowed) {
      status = await readStatus();
      status.state = "stopping";
      const d = status.documents.find((d) => d.slug === slug);
      if (d) d.error = "API usage limit reached";
      await writeStatus(status);
      throw new Error("API usage limit reached — stopping pipeline");
    }

    const pageNum = i + 1;

    // Update current page in file
    status = await readStatus();
    status.currentPage = pageNum;
    await writeStatus(status);

    const canvas = canvases[i];
    if (!canvas.imageUrl) {
      status = await readStatus();
      const d = status.documents.find((d) => d.slug === slug);
      if (d) d.completedPages = pageNum;
      await writeStatus(status);
      continue;
    }

    try {
      const resolvedUrl = await resolveOcrImageUrl(canvas.imageUrl);
      const imageRes = await fetch(resolvedUrl);
      if (!imageRes.ok) throw new Error(`Image fetch failed: ${imageRes.status}`);
      const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
      const imageBase64 = imageBuffer.toString("base64");

      const result = await callKandianguji(imageBase64, { skipUsageTracking: true });
      const rawText = computeRawText(result.spatialData);

      await setPage(slug, pageNum, {
        pageNumber: pageNum,
        rawText,
        spatialData: result.spatialData,
        candidateData: result.candidateData,
      });

      await recordCall({ slug, page: pageNum, success: true });

      // Update progress in file
      status = await readStatus();
      status.pagesProcessed++;
      const d = status.documents.find((d) => d.slug === slug);
      if (d) d.completedPages = pageNum;
      await writeStatus(status);
    } catch (e: any) {
      await recordCall({ slug, page: pageNum, success: false });

      await setPage(slug, pageNum, {
        pageNumber: pageNum,
        rawText: "",
        spatialData: [],
      });

      status = await readStatus();
      status.errors++;
      const d = status.documents.find((d) => d.slug === slug);
      if (d) d.completedPages = pageNum;
      await writeStatus(status);
    }
  }

  // Count pages that actually have text to determine final status
  let pagesWithText = 0;
  for (let i = 0; i < canvases.length; i++) {
    const pg = await getPage(slug, i + 1);
    if (pg && pg.rawText && pg.rawText.length > 0) pagesWithText++;
  }
  const ratio = canvases.length > 0 ? pagesWithText / canvases.length : 0;
  const finalStatus = pagesWithText === 0 ? "error" : ratio >= 0.9 ? "complete" : "partial";
  await setIndexEntry(slug, { status: finalStatus, pageCount: canvases.length });

  // Rebuild search index for fast full-text search
  try { await rebuildSearchIndex(slug, canvases.length); } catch { /* non-critical */ }
}

async function processPdfDocument(slug: string, _entry: OcrIndexEntry) {
  // Read source PDF — new layout in data/uploads/{slug}/, with the legacy
  // data/ocr/{slug}/source.pdf path as a fallback so any pre-move uploads
  // still process without manual migration.
  const newPath = uploadSourcePath(slug);
  const legacyPath = path.join(process.cwd(), "data", "ocr", slug, "source.pdf");
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await fs.readFile(newPath);
  } catch {
    try {
      pdfBuffer = await fs.readFile(legacyPath);
    } catch {
      throw new Error(`source.pdf not found for "${slug}" (looked in uploads/ and ocr/)`);
    }
  }

  const doc = await pdf(pdfBuffer, { scale: 2 });
  const totalPages = doc.length;

  await setIndexEntry(slug, { status: "processing", pageCount: totalPages });

  // Update pipeline file with total pages
  let status = await readStatus();
  const docRow = status.documents.find((d) => d.slug === slug);
  if (docRow) docRow.totalPages = totalPages;
  await writeStatus(status);

  // Resume from the first missing/empty page (same strategy as IIIF path)
  let startFrom = 0;
  for (let i = 0; i < totalPages; i++) {
    const existing = await getPage(slug, i + 1);
    if (existing && existing.spatialData.length > 0) startFrom = i + 1;
    else break;
  }

  if (startFrom > 0) {
    status = await readStatus();
    const d = status.documents.find((d) => d.slug === slug);
    if (d) d.completedPages = startFrom;
    await writeStatus(status);
  }

  for (let i = startFrom; i < totalPages; i++) {
    status = await readStatus();
    if (status.state === "stopping" || status.state === "idle") {
      await setIndexEntry(slug, { status: "partial", pageCount: totalPages });
      try { await rebuildSearchIndex(slug, totalPages); } catch { /* non-critical */ }
      return;
    }

    const allowed = await canMakeCall();
    if (!allowed) {
      status = await readStatus();
      status.state = "stopping";
      const d = status.documents.find((d) => d.slug === slug);
      if (d) d.error = "API usage limit reached";
      await writeStatus(status);
      throw new Error("API usage limit reached — stopping pipeline");
    }

    const pageNum = i + 1;

    status = await readStatus();
    status.currentPage = pageNum;
    await writeStatus(status);

    try {
      const pageImage = await doc.getPage(pageNum);
      const imageBase64 = pageImage.toString("base64");

      // Cache the rendered PNG so /api/ocr/page-image can serve it without
      // re-rendering. Same cheap one-extra-write trick as the streaming
      // /api/ocr/process route.
      try {
        const cacheDir = uploadDir(slug);
        await fs.mkdir(cacheDir, { recursive: true });
        await fs.writeFile(
          path.join(cacheDir, `page_${String(pageNum).padStart(3, "0")}.png`),
          pageImage
        );
      } catch { /* non-critical */ }

      const result = await callKandianguji(imageBase64, { skipUsageTracking: true });
      const rawText = computeRawText(result.spatialData);

      await setPage(slug, pageNum, {
        pageNumber: pageNum,
        rawText,
        spatialData: result.spatialData,
        candidateData: result.candidateData,
      });

      await recordCall({ slug, page: pageNum, success: true });

      status = await readStatus();
      status.pagesProcessed++;
      const d = status.documents.find((d) => d.slug === slug);
      if (d) d.completedPages = pageNum;
      await writeStatus(status);
    } catch (e: any) {
      await recordCall({ slug, page: pageNum, success: false });

      // Mirror IIIF behavior: write an empty page so the pipeline doesn't
      // re-process this slot on resume, and increment the error counter.
      await setPage(slug, pageNum, {
        pageNumber: pageNum,
        rawText: "",
        spatialData: [],
      });

      status = await readStatus();
      status.errors++;
      const d = status.documents.find((d) => d.slug === slug);
      if (d) d.completedPages = pageNum;
      await writeStatus(status);
    }
  }

  // Final status by ratio of pages-with-text — same rule as IIIF path
  let pagesWithText = 0;
  for (let i = 0; i < totalPages; i++) {
    const pg = await getPage(slug, i + 1);
    if (pg && pg.rawText && pg.rawText.length > 0) pagesWithText++;
  }
  const ratio = totalPages > 0 ? pagesWithText / totalPages : 0;
  const finalStatus = pagesWithText === 0 ? "error" : ratio >= 0.9 ? "complete" : "partial";
  await setIndexEntry(slug, { status: finalStatus, pageCount: totalPages });

  try { await rebuildSearchIndex(slug, totalPages); } catch { /* non-critical */ }
}
