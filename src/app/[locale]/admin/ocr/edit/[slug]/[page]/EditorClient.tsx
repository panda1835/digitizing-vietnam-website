"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  SpatialCharacter,
  ConfirmedColumn,
  OcrPageData,
} from "@/lib/ocr-store";
import OCRWorkspace, {
  type BboxOverride,
} from "@/components/ocr-editor/OCRWorkspace";
import ColumnStep from "@/components/ocr-editor/ColumnStep";
import StepBar, { type StepBarItem } from "@/components/ocr-editor/StepBar";
import {
  BTN_PRIMARY,
  BTN_NEUTRAL,
  BTN_BACK,
  BTN_NAV,
} from "@/components/ocr-editor/editorChrome";
import { detectColumns } from "@/components/ocr-editor/useColumnDetection";
import {
  rerecognizeWithNomNaViet,
  NomNaVietUnavailableError,
} from "@/lib/nomnaviet-ocr";

type Phase = "columns" | "editing" | "quocngu";

interface Props {
  slug: string;
  page: number;
  pageCount: number;
  initialPageData: OcrPageData;
  imageUrl: string;
  locale: string;
}

export default function EditorClient({
  slug,
  page,
  pageCount,
  initialPageData,
  imageUrl,
  locale,
}: Props) {
  const router = useRouter();

  // Open at the furthest-confirmed stage so revisiting a page reflects its
  // saved progress instead of always dropping back into Characters:
  //   chars confirmed (or Quốc Ngữ confirmed) → Quốc Ngữ step
  //   columns confirmed only                  → Characters step
  //   nothing confirmed                       → Columns (step 1)
  // The user can still step back via the "◀ Back to …" buttons.
  const [phase, setPhase] = useState<Phase>(() => {
    if (
      initialPageData.charsConfirmedAt ||
      initialPageData.quocNguConfirmedAt
    )
      return "quocngu";
    if (initialPageData.columnsConfirmedAt) return "editing";
    return "columns";
  });

  const [spatialData, setSpatialData] = useState<SpatialCharacter[]>(
    initialPageData.spatialData
  );

  // If the saved page has no confirmed columns (true for every legacy
  // pipeline-branch doc — they never persisted Step 1), auto-detect once
  // on mount so the user lands in Step 1 with columns to confirm rather
  // than an empty image. The detection result also feeds ColumnStep's
  // `autoDetected` prop so the "Use auto-detected" affordance is wired up.
  const autoDetected = useMemo<ConfirmedColumn[]>(() => {
    // Match nom-ocr-training's editor: surfaceCommentary surfaces small
    // interlinear annotation patches as their own columns instead of
    // folding them into the parent.
    const cols = detectColumns(initialPageData.spatialData, "auto", undefined, {
      surfaceCommentary: true,
    });
    return cols.map((c) => ({ bbox: c.bbox }));
  }, [initialPageData.spatialData]);

  const [columns, setColumns] = useState<ConfirmedColumn[]>(() => {
    const saved = initialPageData.columns;
    if (saved && saved.length > 0) return saved;
    return autoDetected;
  });
  const [columnsConfirmedAt, setColumnsConfirmedAt] = useState<string | null>(
    initialPageData.columnsConfirmedAt ?? null
  );
  const [quocNguConfirmedAt, setQuocNguConfirmedAt] = useState<string | null>(
    initialPageData.quocNguConfirmedAt ?? null
  );

  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number | null>(
    null
  );
  const [focusedOffset, setFocusedOffset] = useState<number | null>(null);
  const [bboxOverrides, setBboxOverrides] = useState<
    Record<number, BboxOverride>
  >({});

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Page-image dimensions (persisted for export crops). Seeded from the
  // saved page; (re)stamped by the Kandianguji run.
  const [imageWidth, setImageWidth] = useState<number | undefined>(
    initialPageData.imageWidth
  );
  const [imageHeight, setImageHeight] = useState<number | undefined>(
    initialPageData.imageHeight
  );
  // Kandianguji / Nôm Na Việt pipeline status.
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);

  // Mark dirty whenever spatialData or columns change (after first mount).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setDirty(true);
  }, [spatialData, columns]);

  async function persist(payload: {
    spatialData: SpatialCharacter[];
    columns: ConfirmedColumn[];
    imageWidth?: number;
    imageHeight?: number;
    columnsConfirmedAt?: string | null;
    charsConfirmedAt?: string | null;
    quocNguConfirmedAt?: string | null;
    nnvCompletedAt?: string | null;
  }) {
    const res = await fetch(
      `/api/admin/ocr/edit/${encodeURIComponent(slug)}/${page}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || `HTTP ${res.status}`);
    }
    // Invalidate the App Router's client cache for this route so a later
    // soft-navigation back into the editor re-fetches the just-saved
    // server payload instead of replaying the stale pre-save one.
    router.refresh();
  }

  async function handleSave(extra: {
    columnsConfirmedAt?: string | null;
    charsConfirmedAt?: string | null;
    quocNguConfirmedAt?: string | null;
    nnvCompletedAt?: string | null;
  } = {}) {
    setSaving(true);
    setError(null);
    setStatusMsg("Saving…");
    try {
      await persist({
        spatialData,
        columns,
        imageWidth,
        imageHeight,
        // Persist the QN gate from state on every save so a confirm — or
        // an invalidation when a glyph is edited — round-trips. (Columns
        // gate stays confirm-only by design; QN must track edits.)
        quocNguConfirmedAt,
        ...extra,
      });
      setDirty(false);
      setStatusMsg("Saved.");
      setTimeout(() => setStatusMsg(null), 2000);
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleConfirmColumns() {
    const stamp = new Date().toISOString();
    setColumnsConfirmedAt(stamp);
    setPhase("editing");
    void handleSave({ columnsConfirmedAt: stamp });
  }

  function handleConfirmQuocNgu() {
    const stamp = new Date().toISOString();
    setQuocNguConfirmedAt(stamp);
    void handleSave({ quocNguConfirmedAt: stamp });
  }

  // A glyph's Hán-Nôm text changed → any prior Quốc Ngữ confirm is stale
  // (same invalidation the canonical tools do). Clear the gate in state;
  // it persists with the next Save, which the edit already requires.
  function handleCharTextChanged() {
    if (quocNguConfirmedAt === null) return;
    setQuocNguConfirmedAt(null);
  }

  // ── Kandianguji → Nôm Na Việt page pipeline (nom-ocr-training flow) ──

  async function handleRunKandianguji() {
    setOcrBusy(true);
    setError(null);
    setOcrStatus("Running Kandianguji on the full page…");
    try {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok)
        throw new Error(`Page image fetch failed: HTTP ${imgRes.status}`);
      const blob = await imgRes.blob();
      const fd = new FormData();
      fd.append("image", blob, "page.jpg");
      const res = await fetch("/api/admin/ocr/run", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const sd: SpatialCharacter[] = data.spatialData ?? [];
      const cols: ConfirmedColumn[] = detectColumns(sd, "auto", undefined, {
        surfaceCommentary: true,
      }).map((c) => ({ bbox: c.bbox }));
      const w = typeof data.pageWidth === "number" ? data.pageWidth : undefined;
      const h =
        typeof data.pageHeight === "number" ? data.pageHeight : undefined;
      setSpatialData(sd);
      setColumns(cols);
      setImageWidth(w);
      setImageHeight(h);
      await persist({
        spatialData: sd,
        columns: cols,
        imageWidth: w,
        imageHeight: h,
      });
      setDirty(false);
      const glyphs = sd.filter((c) => c.bbox).length;
      setOcrStatus(
        `Kandianguji detected ${glyphs} character${
          glyphs === 1 ? "" : "s"
        } (+${sd.length - glyphs} layout/newline markers). Now re-OCR with Nôm Na Việt.`
      );
    } catch (e: any) {
      setError(`Kandianguji failed: ${e.message}`);
      setOcrStatus(null);
    } finally {
      setOcrBusy(false);
    }
  }

  async function handleRunNnv() {
    if (spatialData.length === 0) {
      setError("Run Kandianguji first — no characters to refine yet.");
      return;
    }
    setOcrBusy(true);
    setError(null);
    setOcrStatus("Re-OCR with Nôm Na Việt…");
    try {
      const img = await loadImage(imageUrl);
      const { spatialData: merged } = await rerecognizeWithNomNaViet(
        img,
        spatialData,
        {
          concurrency: 1,
          slotJitterMs: 1000,
          topK: 9,
          onProgress: (done, total) =>
            setOcrStatus(`Nôm Na Việt: ${done}/${total}…`),
        }
      );
      const stamp = new Date().toISOString();
      setSpatialData(merged);
      await persist({
        spatialData: merged,
        columns,
        imageWidth,
        imageHeight,
        nnvCompletedAt: stamp,
      });
      setDirty(false);
      setOcrStatus(
        `Nôm Na Việt refined ${merged.length} character${
          merged.length === 1 ? "" : "s"
        }.`
      );
    } catch (e: any) {
      if (e instanceof NomNaVietUnavailableError) setError(e.message);
      else setError(`Nôm Na Việt failed: ${e.message}`);
      setOcrStatus(null);
    } finally {
      setOcrBusy(false);
    }
  }

  function handleBackToColumns() {
    setPhase("columns");
    setSelectedColumnIndex(null);
    setFocusedOffset(null);
  }

  // Mirror handleConfirmColumns: leaving the Characters step persists the
  // Nôm edits (otherwise they live only in React state and are lost on
  // navigate-away) and stamps charsConfirmedAt — the symmetric gate to
  // columnsConfirmedAt that the dashboard needs to count the page as
  // confirmed/corrected.
  function handleProceedToQuocNgu() {
    const stamp = new Date().toISOString();
    setPhase("quocngu");
    setFocusedOffset(null);
    void handleSave({ charsConfirmedAt: stamp });
  }

  function handleBackToCharacters() {
    setPhase("editing");
    setFocusedOffset(null);
  }

  // .txt / training-data export moved to the document-level screens
  // (Edit Documents list + the per-document OCR browser) so they cover
  // the whole document, not just the open page. See DocExportButtons.

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = src;
    });
  }

  // ──────────────────────────────────────────────────────────────────────

  const banner = (() => {
    if (error) {
      return (
        <div className="mb-3 px-3 py-2 rounded border border-red-300 bg-red-50 text-sm text-red-800 flex-shrink-0">
          {error}
        </div>
      );
    }
    if (statusMsg || ocrStatus) {
      return (
        <div className="mb-3 px-3 py-2 rounded border border-blue-200 bg-blue-50 text-sm text-blue-800 flex-shrink-0">
          {statusMsg ?? ocrStatus}
        </div>
      );
    }
    return null;
  })();

  // text-search-style stage bar. DVN's H/N-excluded flow is 4 steps —
  // OCR · Columns · Characters · Quốc Ngữ. The Quốc Ngữ step reuses the
  // Characters editing surface (the per-char QN panel lives in the
  // toolbox); it's a distinct workflow stage, not a separate screen. OCR
  // is "done" once Kandianguji has produced glyphs.
  const hasChars = spatialData.some((c) => c.bbox);
  const pastColumns = phase === "editing" || phase === "quocngu";
  const steps: StepBarItem[] = [
    { label: "OCR", state: hasChars ? "done" : "active" },
    {
      label: "Columns",
      state: pastColumns ? "done" : hasChars ? "active" : "pending",
    },
    {
      label: "Characters",
      state:
        phase === "editing"
          ? "active"
          : phase === "quocngu"
          ? "done"
          : "pending",
    },
    {
      label: "Quốc Ngữ",
      state:
        phase === "quocngu"
          ? "active"
          : quocNguConfirmedAt
          ? "done"
          : "pending",
    },
  ];

  if (phase === "columns") {
    return (
      <div className="relative left-1/2 -ml-[45vw] w-[90vw] px-4 flex-1 min-h-0 flex flex-col">
        <StepBar steps={steps} />
        {banner}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="text-sm text-gray-500 font-halyard">
            {columns.length} column{columns.length === 1 ? "" : "s"} ·{" "}
            {spatialData.filter((c) => c.bbox).length} chars
            {dirty && (
              <span className="ml-3 text-amber-700 text-xs">Unsaved</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/admin/ocr/edit`} className={BTN_BACK}>
              ◀ All docs
            </Link>
            <button
              onClick={handleRunKandianguji}
              disabled={ocrBusy || saving}
              className={BTN_NEUTRAL}
              title="Detect characters + bboxes on the whole page with Kandianguji"
            >
              {ocrBusy ? "…" : "Run Kandianguji"}
            </button>
            <button
              onClick={handleRunNnv}
              disabled={ocrBusy || saving || spatialData.length === 0}
              className={BTN_NEUTRAL}
              title="Re-OCR every detected character with Nôm Na Việt (SIP-priority merge: Nôm SIP wins, kandi stays primary for Han with NNV alts in choices)"
            >
              Re-OCR Nôm Na Việt
            </button>
            <button
              onClick={() => handleSave()}
              disabled={saving || !dirty}
              className={BTN_NEUTRAL}
            >
              {saving ? "…" : "Save"}
            </button>
            <button
              onClick={handleConfirmColumns}
              disabled={saving || ocrBusy}
              className={BTN_PRIMARY}
            >
              Done — proceed to Characters ▶
            </button>
          </div>
        </div>
        <div className="border border-gray-200 rounded overflow-hidden flex-1 min-h-0 flex flex-col">
          <ColumnStep
            imageUrl={imageUrl}
            columns={columns}
            onChange={setColumns}
            autoDetected={autoDetected}
            spatialData={spatialData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative left-1/2 -ml-[45vw] w-[90vw] px-4 flex-1 min-h-0 flex flex-col">
      <StepBar steps={steps} />
      {banner}
      <div className="flex flex-col items-center mb-3 gap-2 flex-shrink-0">
        <div className="text-sm text-gray-500 font-halyard">
          {spatialData.filter((c) => c.bbox).length} chars across{" "}
          {columns.length} column{columns.length === 1 ? "" : "s"}
          {dirty && (
            <span className="ml-3 text-amber-700 text-xs">Unsaved</span>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Link href={`/${locale}/admin/ocr/edit`} className={BTN_BACK}>
            ◀ All docs
          </Link>
          {phase === "quocngu" ? (
            <button onClick={handleBackToCharacters} className={BTN_BACK}>
              ◀ Back to Characters
            </button>
          ) : (
            <button onClick={handleBackToColumns} className={BTN_BACK}>
              ◀ Back to Columns
            </button>
          )}
          {pageCount > 1 && (
            <div className="flex items-center gap-1">
              {page > 1 && (
                <Link
                  href={`/${locale}/admin/ocr/edit/${encodeURIComponent(
                    slug
                  )}/${page - 1}`}
                  className={BTN_NAV}
                >
                  ◀ Prev page
                </Link>
              )}
              <span className="px-2 text-xs text-gray-500 tabular-nums font-halyard">
                {page} / {pageCount}
              </span>
              {page < pageCount && (
                <Link
                  href={`/${locale}/admin/ocr/edit/${encodeURIComponent(
                    slug
                  )}/${page + 1}`}
                  className={BTN_NAV}
                >
                  Next page ▶
                </Link>
              )}
            </div>
          )}
          <button
            onClick={() => handleSave()}
            disabled={saving || !dirty}
            className={BTN_NEUTRAL}
          >
            {saving ? "…" : dirty ? "Save" : "Saved"}
          </button>
          {phase === "editing" && (
            <button
              onClick={handleProceedToQuocNgu}
              disabled={saving || ocrBusy}
              className={BTN_PRIMARY}
            >
              Done — proceed to Quốc Ngữ ▶
            </button>
          )}
          {phase === "quocngu" && (
            <button
              onClick={handleConfirmQuocNgu}
              disabled={saving || ocrBusy}
              className={BTN_PRIMARY}
              title={
                quocNguConfirmedAt
                  ? `Confirmed ${new Date(
                      quocNguConfirmedAt
                    ).toLocaleString()} — re-confirm to restamp`
                  : "Mark this page's Quốc Ngữ readings reviewed"
              }
            >
              {quocNguConfirmedAt
                ? "Quốc Ngữ confirmed ✓ — re-confirm"
                : "Confirm Quốc Ngữ ✓"}
            </button>
          )}
        </div>
      </div>
      <div className="border border-gray-200 rounded overflow-hidden flex-1 min-h-0 flex flex-col">
        <OCRWorkspace
          spatialData={spatialData}
          onSpatialDataChange={setSpatialData}
          imageUrl={imageUrl}
          viewMode="charBox"
          selectedColumnIndex={selectedColumnIndex}
          onSelectColumnIndexChange={setSelectedColumnIndex}
          focusedOffset={focusedOffset}
          onFocusedOffsetChange={setFocusedOffset}
          slug={slug}
          qnMode={phase === "quocngu"}
          onCharTextChanged={handleCharTextChanged}
          bboxOverrides={bboxOverrides}
          onBboxOverridesChange={setBboxOverrides}
          confirmedColumns={columns}
          onConfirmedColumnsChange={setColumns}
        />
      </div>
    </div>
  );
}
