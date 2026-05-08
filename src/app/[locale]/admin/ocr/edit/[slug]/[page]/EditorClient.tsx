"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  SpatialCharacter,
  ConfirmedColumn,
  OcrPageData,
} from "@/lib/ocr-store";
import { buildRawText } from "@/lib/reading-order";
import OCRWorkspace, {
  type BboxOverride,
} from "@/components/ocr-editor/OCRWorkspace";
import ColumnStep from "@/components/ocr-editor/ColumnStep";
import { cropBboxToPixelArray } from "@/lib/nomnaviet-ocr";

type Phase = "columns" | "editing";

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
  // Start in "editing" if columns were already confirmed; otherwise step 1.
  const [phase, setPhase] = useState<Phase>(
    initialPageData.columnsConfirmedAt ? "editing" : "columns"
  );

  const [spatialData, setSpatialData] = useState<SpatialCharacter[]>(
    initialPageData.spatialData
  );
  const [columns, setColumns] = useState<ConfirmedColumn[]>(
    initialPageData.columns ?? []
  );
  const [columnsConfirmedAt, setColumnsConfirmedAt] = useState<string | null>(
    initialPageData.columnsConfirmedAt ?? null
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

  // Mark dirty whenever spatialData or columns change (after first mount).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setDirty(true);
  }, [spatialData, columns]);

  async function handleSave(extra: {
    columnsConfirmedAt?: string | null;
  } = {}) {
    setSaving(true);
    setError(null);
    setStatusMsg("Saving…");
    try {
      const res = await fetch(
        `/api/admin/ocr/edit/${encodeURIComponent(slug)}/${page}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spatialData,
            columns,
            ...extra,
          }),
        }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
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

  function handleBackToColumns() {
    setPhase("columns");
    setSelectedColumnIndex(null);
    setFocusedOffset(null);
  }

  function handleExportTxt() {
    const text = buildRawText(spatialData);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-page${page}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportTraining() {
    setSaving(true);
    setError(null);
    setStatusMsg("Generating training data…");
    try {
      const img = await loadImage(imageUrl);
      const lines: string[] = [];
      for (const c of spatialData) {
        if (!c.bbox || c.bbox.length < 4) continue;
        if (c.uncertain) continue;
        if (!c.text || c.text.trim().length === 0) continue;
        const pixels = await cropBboxToPixelArray(img, c.bbox, 0.1);
        lines.push(
          JSON.stringify({
            pixels,
            label: c.text,
            source: "admin-edit",
            slug,
            page,
            offset: c.offset,
            ...(c.ids ? { ids: c.ids } : {}),
            ...(c.noReadingForm ? { noReadingForm: true } : {}),
          })
        );
      }
      const blob = new Blob([lines.join("\n") + "\n"], {
        type: "application/x-ndjson",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-page${page}-training.jsonl`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg(`Exported ${lines.length} chars`);
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (e: any) {
      setError(`Export failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

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
    if (statusMsg) {
      return (
        <div className="mb-3 px-3 py-2 rounded border border-blue-200 bg-blue-50 text-sm text-blue-800 flex-shrink-0">
          {statusMsg}
        </div>
      );
    }
    return null;
  })();

  if (phase === "columns") {
    return (
      <div className="relative left-1/2 -ml-[45vw] w-[90vw] px-4 flex-1 min-h-0 flex flex-col">
        {banner}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Step 1: Columns</span>
            <span className="ml-3 text-gray-500">
              {columns.length} column{columns.length === 1 ? "" : "s"} ·{" "}
              {spatialData.filter((c) => c.bbox).length} chars
            </span>
            {dirty && (
              <span className="ml-3 text-amber-700 text-xs">Unsaved</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/admin/ocr/edit`}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              ← All docs
            </Link>
            <button
              onClick={() => handleSave()}
              disabled={saving || !dirty}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {saving ? "…" : "Save"}
            </button>
            <button
              onClick={handleConfirmColumns}
              disabled={saving}
              className="px-4 py-1.5 text-sm rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              Confirm columns →
            </button>
          </div>
        </div>
        <div className="border border-gray-200 rounded overflow-hidden flex-1 min-h-0">
          <ColumnStep
            imageUrl={imageUrl}
            columns={columns}
            onChange={setColumns}
            spatialData={spatialData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative left-1/2 -ml-[45vw] w-[90vw] px-4 flex-1 min-h-0 flex flex-col">
      {banner}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2 flex-shrink-0">
        <div className="text-sm text-gray-700">
          <span className="font-medium">Step 2: Characters</span>
          <span className="ml-3 text-gray-500">
            {spatialData.filter((c) => c.bbox).length} chars across{" "}
            {columns.length} column{columns.length === 1 ? "" : "s"}
          </span>
          {dirty && (
            <span className="ml-3 text-amber-700 text-xs">Unsaved</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/${locale}/admin/ocr/edit`}
            className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ← All docs
          </Link>
          <button
            onClick={handleBackToColumns}
            className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ← Step 1: Columns
          </button>
          {pageCount > 1 && (
            <div className="flex items-center gap-1 text-xs">
              {page > 1 && (
                <Link
                  href={`/${locale}/admin/ocr/edit/${encodeURIComponent(
                    slug
                  )}/${page - 1}`}
                  className="px-2 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  ← Prev page
                </Link>
              )}
              <span className="px-2 text-gray-500 tabular-nums">
                {page} / {pageCount}
              </span>
              {page < pageCount && (
                <Link
                  href={`/${locale}/admin/ocr/edit/${encodeURIComponent(
                    slug
                  )}/${page + 1}`}
                  className="px-2 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Next page →
                </Link>
              )}
            </div>
          )}
          <button
            onClick={() => handleSave()}
            disabled={saving || !dirty}
            className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "…" : dirty ? "Save" : "Saved"}
          </button>
          <button
            onClick={handleExportTxt}
            disabled={saving}
            className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Download .txt
          </button>
          <button
            onClick={handleExportTraining}
            disabled={saving}
            className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Export training data
          </button>
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
          bboxOverrides={bboxOverrides}
          onBboxOverridesChange={setBboxOverrides}
          confirmedColumns={columns}
          onConfirmedColumnsChange={setColumns}
        />
      </div>
    </div>
  );
}
