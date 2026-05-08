"use client";

import { useEffect, useRef, useState } from "react";
import type {
  SpatialCharacter,
  ConfirmedColumn,
} from "@/lib/ocr-store";
import { buildRawText } from "@/lib/reading-order";
import {
  detectColumns,
  reorderByColumns,
} from "@/components/ocr-editor/useColumnDetection";
import OCRWorkspace, {
  type BboxOverride,
} from "@/components/ocr-editor/OCRWorkspace";
import ColumnStep from "@/components/ocr-editor/ColumnStep";
import { cropBboxToPixelArray } from "@/lib/nomnaviet-ocr";

type Phase = "upload" | "columns" | "editing";

export default function TesterClient() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [running, setRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [spatialData, setSpatialData] = useState<SpatialCharacter[]>([]);
  const [columns, setColumns] = useState<ConfirmedColumn[]>([]);
  const [autoDetected, setAutoDetected] = useState<ConfirmedColumn[] | null>(
    null
  );

  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number | null>(
    null
  );
  const [focusedOffset, setFocusedOffset] = useState<number | null>(null);
  const [bboxOverrides, setBboxOverrides] = useState<
    Record<number, BboxOverride>
  >({});
  const [viewMode, setViewMode] = useState<"charBox" | "column">("charBox");

  // Revoke object URLs on unmount.
  const imageUrlRef = useRef<string | null>(null);
  imageUrlRef.current = imageUrl;
  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    };
  }, []);

  function pickFile(f: File | null) {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setFile(f);
    setImageUrl(f ? URL.createObjectURL(f) : null);
    setSpatialData([]);
    setColumns([]);
    setAutoDetected(null);
    setSelectedColumnIndex(null);
    setFocusedOffset(null);
    setBboxOverrides({});
    setError(null);
    setPhase("upload");
  }

  async function handleRunOcr() {
    if (!file) return;
    setRunning(true);
    setError(null);
    setStatusMsg("Running Kandianguji OCR…");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/admin/ocr/run", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const sd = (data.spatialData ?? []) as SpatialCharacter[];
      const reordered = reorderByColumns(sd);

      // Auto-detect columns from the OCR result.
      const cols = detectColumns(reordered, "auto");
      const auto: ConfirmedColumn[] = cols.map((col) => ({ bbox: col.bbox }));
      setSpatialData(reordered);
      setAutoDetected(auto);
      setColumns(auto);
      setPhase("columns");
    } catch (e: any) {
      setError(e.message || "OCR failed");
    } finally {
      setRunning(false);
      setStatusMsg(null);
    }
  }

  function handleConfirmColumns() {
    setPhase("editing");
    setViewMode("charBox");
  }

  function handleBackToColumns() {
    setPhase("columns");
    setSelectedColumnIndex(null);
    setFocusedOffset(null);
  }

  function handleExportTxt() {
    const text = buildRawText(spatialData);
    const baseName = file?.name?.replace(/\.[^.]+$/, "") || "page";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportTraining() {
    if (!file || !imageUrl) return;
    setRunning(true);
    setError(null);
    setStatusMsg("Generating training data…");
    try {
      const img = await loadImage(imageUrl);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const lines: string[] = [];
      let skippedUncertain = 0;
      let skippedNoBbox = 0;
      let skippedEmpty = 0;
      for (const c of spatialData) {
        if (!c.bbox || c.bbox.length < 4) {
          skippedNoBbox++;
          continue;
        }
        if (c.uncertain) {
          skippedUncertain++;
          continue;
        }
        if (!c.text || c.text.trim().length === 0) {
          skippedEmpty++;
          continue;
        }
        const pixels = await cropBboxToPixelArray(img, c.bbox, 0.1);
        lines.push(
          JSON.stringify({
            pixels,
            label: c.text,
            source: "admin-tester",
            slug: baseName,
            offset: c.offset,
            ...(c.ids ? { ids: c.ids } : {}),
          })
        );
      }
      const blob = new Blob([lines.join("\n") + "\n"], {
        type: "application/x-ndjson",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}-training.jsonl`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg(
        `Exported ${lines.length} chars` +
          (skippedUncertain || skippedNoBbox || skippedEmpty
            ? ` (skipped ${skippedUncertain} uncertain, ${skippedNoBbox} no-bbox, ${skippedEmpty} empty)`
            : "")
      );
    } catch (e: any) {
      setError(`Export failed: ${e.message}`);
    } finally {
      setRunning(false);
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

  // ────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────

  const bannerError = error && (
    <div className="mb-3 px-3 py-2 rounded border border-red-300 bg-red-50 text-sm text-red-800">
      {error}
    </div>
  );

  const bannerStatus = statusMsg && !error && (
    <div className="mb-3 px-3 py-2 rounded border border-blue-200 bg-blue-50 text-sm text-blue-800">
      {statusMsg}
    </div>
  );

  if (phase === "upload") {
    return (
      <div className="max-w-3xl">
        {bannerError}
        {bannerStatus}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Page image
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/tiff"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              JPEG, PNG, WebP, or TIFF. The image stays in browser memory —
              nothing persists to disk from this page.
            </p>
          </div>
          {imageUrl && (
            <div className="space-y-3">
              <div className="border border-gray-200 rounded p-2 bg-gray-50 max-h-[60vh] overflow-auto inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="upload preview"
                  className="max-w-full block"
                />
              </div>
              <button
                onClick={handleRunOcr}
                disabled={running}
                className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {running ? "Running OCR…" : "Run OCR"}
              </button>
              <p className="text-xs text-gray-500">
                Requires <code>KANDIANGUJI_TOKEN</code> and{" "}
                <code>KANDIANGUJI_EMAIL</code> environment variables on the
                server.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "columns" && imageUrl) {
    return (
      <div>
        {bannerError}
        {bannerStatus}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Step 1: Columns</span>
            <span className="ml-3 text-gray-500">
              {columns.length} column{columns.length === 1 ? "" : "s"} detected
              · {spatialData.filter((c) => c.bbox).length} chars
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pickFile(null)}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              ← New page
            </button>
            <button
              onClick={handleConfirmColumns}
              className="px-4 py-1.5 text-sm rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700"
            >
              Confirm columns →
            </button>
          </div>
        </div>
        <div className="border border-gray-200 rounded overflow-hidden">
          <ColumnStep
            imageUrl={imageUrl}
            columns={columns}
            onChange={setColumns}
            autoDetected={autoDetected ?? undefined}
            spatialData={spatialData}
          />
        </div>
      </div>
    );
  }

  if (phase === "editing" && imageUrl) {
    return (
      <div>
        {bannerError}
        {bannerStatus}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Step 2: Characters</span>
            <span className="ml-3 text-gray-500">
              {spatialData.filter((c) => c.bbox).length} chars across{" "}
              {columns.length} column{columns.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded border border-gray-300 overflow-hidden text-xs">
              <button
                onClick={() => setViewMode("charBox")}
                className={`px-3 py-1.5 ${
                  viewMode === "charBox"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Edit chars
              </button>
              <button
                onClick={() => setViewMode("column")}
                className={`px-3 py-1.5 border-l border-gray-300 ${
                  viewMode === "column"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Edit columns
              </button>
            </div>
            <button
              onClick={handleBackToColumns}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              ← Step 1
            </button>
            <button
              onClick={handleExportTxt}
              disabled={running}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Download .txt
            </button>
            <button
              onClick={handleExportTraining}
              disabled={running}
              className="px-3 py-1.5 text-sm rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {running ? "…" : "Export training data"}
            </button>
            <button
              onClick={() => pickFile(null)}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              New page
            </button>
          </div>
        </div>
        <div className="border border-gray-200 rounded overflow-hidden h-[78vh] flex flex-col">
          <OCRWorkspace
            spatialData={spatialData}
            onSpatialDataChange={setSpatialData}
            imageUrl={imageUrl}
            viewMode={viewMode}
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

  return null;
}
