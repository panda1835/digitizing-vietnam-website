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
import {
  cropBboxToPixelArray,
  rerecognizeWithNomNaViet,
  NomNaVietUnavailableError,
} from "@/lib/nomnaviet-ocr";
import StepBar, { type StepBarItem } from "@/components/ocr-editor/StepBar";
import {
  BTN_PRIMARY,
  BTN_NEUTRAL,
  BTN_BACK,
} from "@/components/ocr-editor/editorChrome";

type Phase = "upload" | "columns" | "editing" | "quocngu";
type OcrMode = "kandi" | "kandi+nnv";

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
  const [ocrMode, setOcrMode] = useState<OcrMode>("kandi");

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
    if (!file || !imageUrl) return;
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
      let sd = (data.spatialData ?? []) as SpatialCharacter[];
      sd = reorderByColumns(sd);

      // Optional second pass: per-char re-OCR with Nôm Na Việt. Replaces
      // the kandi reading when NNV's top guess is a SIP-range Nôm char
      // (one kandi can't produce); otherwise stacks NNV candidates into
      // choices[] for review.
      if (ocrMode === "kandi+nnv" && sd.some((c) => c.bbox)) {
        try {
          const img = await loadImage(imageUrl);
          setStatusMsg("Re-OCR with Nôm Na Việt…");
          // Sequential (concurrency=1) with ~1s between calls — keeps us
          // a polite client of the public NNV endpoint. slotJitterMs of
          // 1000 adds 500–1500ms of randomized delay before each call.
          const result = await rerecognizeWithNomNaViet(img, sd, {
            concurrency: 1,
            slotJitterMs: 1000,
            onProgress: (done, total) => {
              setStatusMsg(`Re-OCR with Nôm Na Việt… ${done}/${total}`);
            },
          });
          sd = result.spatialData;
        } catch (e: any) {
          // If NNV bails (rate limit / outage), keep the kandi result and
          // surface the failure rather than throwing the whole run away.
          if (e instanceof NomNaVietUnavailableError) {
            setError(`Nôm Na Việt unavailable: ${e.message} — kandi result kept.`);
          } else {
            setError(`NNV pass failed: ${e?.message ?? "unknown"} — kandi result kept.`);
          }
        }
      }

      // Auto-detect columns from the (post-NNV) OCR result.
      // surfaceCommentary: true matches nom-ocr-training's editor —
      // small interlinear annotation patches get their own columns
      // instead of being folded into the parent.
      const cols = detectColumns(sd, "auto", undefined, {
        surfaceCommentary: true,
      });
      const auto: ConfirmedColumn[] = cols.map((col) => ({ bbox: col.bbox }));
      setSpatialData(sd);
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
  }

  function handleBackToColumns() {
    setPhase("columns");
    setSelectedColumnIndex(null);
    setFocusedOffset(null);
  }

  function handleProceedToQuocNgu() {
    setPhase("quocngu");
    setFocusedOffset(null);
  }

  function handleBackToCharacters() {
    setPhase("editing");
    setFocusedOffset(null);
  }

  // Columns-phase test of the Nôm Na Việt pass on the current glyphs —
  // mirrors the editor's "Re-OCR Nôm Na Việt" so the pipeline's NNV stage
  // can be exercised independently of the initial Kandi run. Ephemeral
  // (no persistence — this is the throwaway tester).
  async function handleRunNnv() {
    if (!imageUrl || spatialData.length === 0) return;
    setRunning(true);
    setError(null);
    setStatusMsg("Re-OCR with Nôm Na Việt…");
    try {
      const img = await loadImage(imageUrl);
      const result = await rerecognizeWithNomNaViet(img, spatialData, {
        concurrency: 1,
        slotJitterMs: 1000,
        topK: 9,
        onProgress: (done, total) =>
          setStatusMsg(`Re-OCR with Nôm Na Việt… ${done}/${total}`),
      });
      setSpatialData(result.spatialData);
      setStatusMsg(
        `Nôm Na Việt refined ${result.spatialData.length} character${
          result.spatialData.length === 1 ? "" : "s"
        }.`
      );
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (e: any) {
      if (e instanceof NomNaVietUnavailableError) setError(e.message);
      else setError(`Nôm Na Việt failed: ${e?.message ?? "unknown"}`);
    } finally {
      setRunning(false);
    }
  }

  async function handleSaveToAdmin() {
    if (!file || !imageUrl) return;
    const defaultTitle = file.name.replace(/\.[^.]+$/, "");
    const title = window.prompt(
      "Title for this page (used to generate the slug)",
      defaultTitle
    );
    if (!title) return;
    setRunning(true);
    setError(null);
    setStatusMsg("Saving to admin storage…");
    try {
      const img = await loadImage(imageUrl);
      const fd = new FormData();
      fd.append("image", file);
      fd.append(
        "payload",
        JSON.stringify({
          title,
          spatialData,
          columns,
          imageWidth: img.naturalWidth,
          imageHeight: img.naturalHeight,
        })
      );
      const res = await fetch("/api/admin/ocr/save", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setStatusMsg(
        `Saved as “${data.slug}”. Find it under /admin/ocr/edit once that page lands.`
      );
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setRunning(false);
    }
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

  // Same 4-step pipeline indicator as the per-page editor:
  // OCR · Columns · Characters · Quốc Ngữ. The tester has no persistence
  // gate, so "done" is purely positional (you've moved past the step).
  const hasChars = spatialData.some((c) => c.bbox);
  const pastColumns = phase === "editing" || phase === "quocngu";
  const steps: StepBarItem[] = [
    { label: "OCR", state: hasChars ? "done" : "active" },
    {
      label: "Columns",
      state:
        phase === "columns"
          ? "active"
          : pastColumns
          ? "done"
          : "pending",
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
      state: phase === "quocngu" ? "active" : "pending",
    },
  ];

  if (phase === "upload") {
    return (
      <div className="max-w-3xl">
        <StepBar steps={steps} />
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
              <div className="border border-gray-200 rounded p-2 bg-gray-50 max-h-[50vh] overflow-auto inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="upload preview"
                  className="max-w-full block"
                />
              </div>
              <fieldset className="border border-gray-200 rounded px-3 py-2">
                <legend className="text-xs font-medium text-gray-700 px-1">
                  OCR engine
                </legend>
                <div className="space-y-1.5 text-sm">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ocrMode"
                      value="kandi"
                      checked={ocrMode === "kandi"}
                      onChange={() => setOcrMode("kandi")}
                      className="mt-1"
                      disabled={running}
                    />
                    <span>
                      <span className="font-medium">Kandianguji only</span>
                      <span className="block text-xs text-gray-500">
                        Single-pass classical OCR. Faster and cheaper.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ocrMode"
                      value="kandi+nnv"
                      checked={ocrMode === "kandi+nnv"}
                      onChange={() => setOcrMode("kandi+nnv")}
                      className="mt-1"
                      disabled={running}
                    />
                    <span>
                      <span className="font-medium">
                        Kandianguji + Nôm Na Việt
                      </span>
                      <span className="block text-xs text-gray-500">
                        Hybrid: Kandi finds bboxes and a first-pass reading,
                        then each char is re-OCR&apos;d with Nôm Na Việt.
                        SIP-range Nôm chars from NNV win over Kandi; BMP/Han
                        kandi readings stay primary with NNV alternatives in
                        the candidates list. Slow — one upstream call per
                        character.
                      </span>
                    </span>
                  </label>
                </div>
              </fieldset>
              <button
                onClick={handleRunOcr}
                disabled={running}
                className={BTN_PRIMARY}
              >
                {running ? statusMsg ?? "Running OCR…" : "Run OCR ▶"}
              </button>
              <p className="text-xs text-gray-500">
                Requires <code>KANDIANGUJI_TOKEN</code> and{" "}
                <code>KANDIANGUJI_EMAIL</code> on the server. Hybrid mode also
                hits the public Nôm Na Việt endpoint (override with{" "}
                <code>NOMNAVIET_OCR_URL</code>).
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "columns" && imageUrl) {
    return (
      // Editor needs the whole viewport. Escape the parent layout's
      // max-w-7xl wrap horizontally and use h-[calc(100vh-NNN)] to
      // bound the vertical space so the inner flex-1 min-h-0 chain
      // can size ColumnStep correctly.
      <div className="relative left-1/2 -ml-[45vw] w-[90vw] px-4 h-[calc(100vh-200px)] flex flex-col">
        <StepBar steps={steps} />
        {bannerError}
        {bannerStatus}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="text-sm text-gray-500 font-halyard">
            {columns.length} column{columns.length === 1 ? "" : "s"} detected ·{" "}
            {spatialData.filter((c) => c.bbox).length} chars
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => pickFile(null)} className={BTN_BACK}>
              ◀ New page
            </button>
            <button
              onClick={handleRunNnv}
              disabled={running || spatialData.length === 0}
              className={BTN_NEUTRAL}
              title="Re-OCR every detected character with Nôm Na Việt (test the NNV pass independently)"
            >
              {running ? "…" : "Re-OCR Nôm Na Việt"}
            </button>
            <button
              onClick={handleConfirmColumns}
              disabled={running}
              className={BTN_PRIMARY}
            >
              Done — proceed to Characters ▶
            </button>
          </div>
        </div>
        <div className="border border-gray-200 rounded overflow-hidden flex-1 min-h-0">
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

  if ((phase === "editing" || phase === "quocngu") && imageUrl) {
    const qn = phase === "quocngu";
    return (
      <div className="relative left-1/2 -ml-[45vw] w-[90vw] px-4 h-[calc(100vh-200px)] flex flex-col">
        <StepBar steps={steps} />
        {bannerError}
        {bannerStatus}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2 flex-shrink-0">
          <div className="text-sm text-gray-500 font-halyard">
            {spatialData.filter((c) => c.bbox).length} chars across{" "}
            {columns.length} column{columns.length === 1 ? "" : "s"}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {qn ? (
              <button
                onClick={handleBackToCharacters}
                className={BTN_BACK}
              >
                ◀ Back to Characters
              </button>
            ) : (
              <button onClick={handleBackToColumns} className={BTN_BACK}>
                ◀ Back to Columns
              </button>
            )}
            <button
              onClick={handleSaveToAdmin}
              disabled={running}
              className={BTN_NEUTRAL}
            >
              Save to admin
            </button>
            <button
              onClick={handleExportTxt}
              disabled={running}
              className={BTN_NEUTRAL}
            >
              Download .txt
            </button>
            <button
              onClick={handleExportTraining}
              disabled={running}
              className={BTN_NEUTRAL}
            >
              {running ? "…" : "Export training data"}
            </button>
            <button onClick={() => pickFile(null)} className={BTN_BACK}>
              New page
            </button>
            {!qn && (
              <button
                onClick={handleProceedToQuocNgu}
                disabled={running}
                className={BTN_PRIMARY}
              >
                Done — proceed to Quốc Ngữ ▶
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
            qnMode={qn}
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
