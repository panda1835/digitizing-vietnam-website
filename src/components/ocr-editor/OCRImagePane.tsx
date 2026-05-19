"use client";

import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import type { SpatialCharacter } from "@/lib/ocr-store";
import type { Column } from "./useColumnDetection";
import { splitCommentarySides } from "./useColumnDetection";
import {
  cropBboxToPixelArray,
  recognizeSingleChar,
  type NomNaVietCandidate,
  type PerCharCropOptions,
} from "@/lib/nomnaviet-ocr";

interface OCRImagePaneProps {
  imageUrl: string;
  columns: Column[];
  selectedColumnIndex: number | null;
  spatialData: SpatialCharacter[];
  onSelectColumn: (index: number) => void;
  onDeselectColumn: () => void;
  onCharChange: (offset: number, newText: string) => void;
  onDeleteChar?: (offset: number) => void;
  onFocusChar: (offset: number) => void;
  onAddChar: (
    bbox: Array<{ x: number; y: number }>,
    text: string,
    extras?: { choices?: string[]; confidence?: number; originalText?: string }
  ) => void;
  onOcrRegion: (
    rect: { x: number; y: number; w: number; h: number },
    engine: "kandi" | "kandi+nnv"
  ) => void;
  focusedOffset: number | null;
  viewMode?: "charBox" | "column";
  /**
   * Quốc Ngữ step. When true the selected column renders inline
   * `[glyph][QN input]` cells (text-search-style) — the glyph stays
   * visible and read-only while the user types its romanization beside
   * it — instead of the glyph-editing cells.
   */
  qnMode?: boolean;
  /** Commit a Quốc Ngữ reading for one char (QN cells only). */
  onQnChange?: (offset: number, qn: string) => void;
  onMoveColumn?: (colIndex: number, deltaX: number, deltaY: number) => void;
  onResizeColumn?: (
    colIndex: number,
    newBbox: { minX: number; maxX: number; minY: number; maxY: number }
  ) => void;
  onDeleteColumn?: (colIndex: number) => void;
  onCreateColumn?: (bbox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  }) => void;
  /**
   * Map keyed by `from`-text → ranked list of `to`-candidates the user has
   * already applied multiple times. Cells whose text matches a key get
   * flagged with a click-to-apply badge for the top suggestion.
   */
  recurringCorrections?: Record<
    string,
    Array<{ to: string; totalChars: number }>
  >;
  /**
   * Per-character preprocessing for the in-popup "Predict" button. Same
   * options the bulk re-OCR uses, derived from the document's preprocess
   * knobs by the parent.
   */
  perCharCropOptions?: PerCharCropOptions;
}

export default function OCRImagePane({
  imageUrl,
  columns,
  selectedColumnIndex,
  spatialData,
  onSelectColumn,
  onDeselectColumn,
  onCharChange,
  onDeleteChar,
  onFocusChar,
  onAddChar,
  onOcrRegion,
  focusedOffset,
  recurringCorrections,
  perCharCropOptions,
  qnMode,
  onQnChange,
}: OCRImagePaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Armed-delete: pressing Delete in a cell input doesn't delete immediately
  // — it arms the cell and waits for Enter or a click on the confirm button.
  // Cleared on Escape, blur, focus change, or any text mutation.
  const [armedDeleteOffset, setArmedDeleteOffset] = useState<number | null>(null);
  useEffect(() => {
    if (armedDeleteOffset !== null && focusedOffset !== armedDeleteOffset) {
      setArmedDeleteOffset(null);
    }
  }, [focusedOffset, armedDeleteOffset]);

  const [zoom, setZoom] = useState(1);
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 5;
  const ZOOM_STEP = 0.25;
  function clampZoom(z: number) {
    return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
  }

  // Track the container's available width so we can size the image as
  // `containerWidth * zoom`. At zoom=1 this matches the prior `w-full`
  // behaviour (image fits container). At zoom>1 the image overflows
  // and the container's `overflow-auto` lets the user scroll.
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Selection action popup state
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [selectionPixels, setSelectionPixels] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [manualInput, setManualInput] = useState("");

  // NNV single-char prediction state for the selection popup. The user can
  // press "Predict" to crop the drawn rect, send it to the NNV per-char
  // endpoint, and get back top-K candidates. Used to seed the manual input
  // and populate the new char's `choices` list when the user clicks Add.
  const [nnvPrediction, setNnvPrediction] = useState<
    NomNaVietCandidate[] | null
  >(null);
  const [nnvLoading, setNnvLoading] = useState(false);
  const [nnvError, setNnvError] = useState<string | null>(null);

  // Per-popup overrides for the per-char preprocessing knobs. Initialised
  // from the document-level setting; user can toggle individual flags to
  // see how each one affects the crop NNV would receive (and what NNV
  // predicts on each variant) without changing the document defaults.
  const [popupPerChar, setPopupPerChar] = useState<PerCharCropOptions>(() => ({
    threshold: !!perCharCropOptions?.threshold,
    center: !!perCharCropOptions?.center,
    morphClose: !!perCharCropOptions?.morphClose,
  }));
  // Re-sync local toggles when the document-level options change (e.g.
  // user opened a different page or edited the global preprocessing
  // panel). Only fires while no selection is active so we don't reset
  // the user's experimental tweaks mid-session.
  useEffect(() => {
    if (selectionRect) return;
    setPopupPerChar({
      threshold: !!perCharCropOptions?.threshold,
      center: !!perCharCropOptions?.center,
      morphClose: !!perCharCropOptions?.morphClose,
    });
  }, [perCharCropOptions, selectionRect]);

  // Live preview of what NNV would receive, given the current popup
  // toggles and selection rect. Re-rendered as a tiny data URL on every
  // toggle change so the user can eyeball the effect without sending a
  // network request.
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!selectionRect || !imgRef.current) {
      setPreviewDataUrl(null);
      return;
    }
    const r = selectionRect;
    const bbox = [
      { x: r.x, y: r.y },
      { x: r.x + r.w, y: r.y },
      { x: r.x + r.w, y: r.y + r.h },
      { x: r.x, y: r.y + r.h },
    ];
    let cancelled = false;
    (async () => {
      try {
        const pixels = await cropBboxToPixelArray(
          imgRef.current!,
          bbox,
          0.1,
          popupPerChar
        );
        if (cancelled) return;
        const N = 64;
        const canvas = document.createElement("canvas");
        canvas.width = N;
        canvas.height = N;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const data = ctx.createImageData(N, N);
        for (let i = 0; i < N * N; i++) {
          const v = Math.round(pixels[i] * 255);
          data.data[i * 4] = v;
          data.data[i * 4 + 1] = v;
          data.data[i * 4 + 2] = v;
          data.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(data, 0, 0);
        setPreviewDataUrl(canvas.toDataURL());
      } catch {
        setPreviewDataUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectionRect, popupPerChar]);

  const selectedColumn =
    selectedColumnIndex !== null ? columns[selectedColumnIndex] ?? null : null;

  // Single source of truth for the image's current viewport rect. The
  // position:fixed input-panel anchors to it, the canvas overlay sizes to
  // its width/height, and `bbox * scaleY` math reads its width/height.
  // Tracked continuously via ResizeObserver so layout shifts (scrollbar
  // appearance, panel toggles, font reflow) can't drift the BB ring or
  // input cells off the underlying characters.
  const [imgScreenRect, setImgScreenRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const scaleX = imgScreenRect?.width ?? 1;
  const scaleY = imgScreenRect?.height ?? 1;

  useLayoutEffect(() => {
    function update() {
      const el = imgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setImgScreenRect((prev) => {
        if (
          prev &&
          prev.left === r.left &&
          prev.top === r.top &&
          prev.width === r.width &&
          prev.height === r.height
        ) {
          return prev;
        }
        return { left: r.left, top: r.top, width: r.width, height: r.height };
      });
    }
    update();
    const ro = new ResizeObserver(update);
    if (imgRef.current) ro.observe(imgRef.current);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, []);

  const [focusedRect, setFocusedRect] = useState<{
    left: number;
    top: number;
    height: number;
  } | null>(null);
  useLayoutEffect(() => {
    if (focusedOffset === null) {
      setFocusedRect(null);
      return;
    }
    function update() {
      const el = document.querySelector(
        `[data-char-offset="${focusedOffset}"]`
      ) as HTMLElement | null;
      if (!el) {
        setFocusedRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setFocusedRect({ left: r.left, top: r.top, height: r.height });
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [focusedOffset, spatialData, columns]);

  // Auto-pan: when the focused cell sits outside the image scroll container's
  // viewport (e.g. user tabbed to a column on a different part of the page,
  // or jumped via a recurring-correction Review button), nudge the container
  // just enough to bring the cell into view AND keep the corresponding image
  // column visible to its right.
  //
  // The input cells are rendered in a panel positioned to the *left* of the
  // image column they transcribe, so naively centering on the cell can leave
  // the actual column offscreen — the user would see their input but not the
  // photograph they're transcribing. We extend the "must be visible" target
  // rectangle rightward to the image column's right edge so both end up in
  // frame after a single auto-scroll.
  //
  // The cells live in a position:fixed overlay anchored to the image, so we
  // can't rely on browser scrollIntoView; we compute the delta against the
  // container's screen rect and scroll by that.
  useLayoutEffect(() => {
    if (focusedOffset === null) return;
    const container = containerRef.current;
    if (!container) return;
    const cell = document.querySelector(
      `[data-char-offset="${focusedOffset}"]`
    ) as HTMLElement | null;
    if (!cell) return;
    const cRect = container.getBoundingClientRect();
    const eRect = cell.getBoundingClientRect();
    const margin = 32; // px of breathing room around the target rect

    // Resolve the right edge of the photographed column this cell belongs
    // to. Falls back to the cell's own right edge if we can't find one
    // (e.g. orphaned char), preserving the prior behavior in that case.
    let targetRight = eRect.right;
    if (imgScreenRect) {
      const owningCol = columns.find((c) =>
        c.chars.some((ch) => ch.offset === focusedOffset)
      );
      if (owningCol?.bbox) {
        const colRightPx =
          imgScreenRect.left + owningCol.bbox.maxX * imgScreenRect.width;
        // If the column actually extends to the right of the cell, use its
        // right edge as the rightmost point we want visible. Add a few px
        // so the column boundary isn't flush with the viewport edge.
        if (colRightPx > targetRight) targetRight = colRightPx + 8;
      }
    }

    let dx = 0;
    let dy = 0;
    // Horizontal: prefer left-aligning the cell when the combined target
    // (cell-left → column-right) is too wide for the viewport, since the
    // user needs to see what they're typing first; the column will still
    // be partially visible to the right.
    const targetLeft = eRect.left;
    const targetWidth = targetRight - targetLeft;
    const visibleWidth = cRect.width - 2 * margin;
    if (targetWidth > visibleWidth) {
      // Can't fit both with full margins; pin the cell at the left margin
      // and let the column extend rightward as far as the viewport allows.
      dx = targetLeft - (cRect.left + margin);
    } else if (targetLeft < cRect.left + margin) {
      dx = targetLeft - (cRect.left + margin);
    } else if (targetRight > cRect.right - margin) {
      dx = targetRight - (cRect.right - margin);
    }
    if (eRect.top < cRect.top + margin) {
      dy = eRect.top - (cRect.top + margin);
    } else if (eRect.bottom > cRect.bottom - margin) {
      dy = eRect.bottom - (cRect.bottom - margin);
    }
    if (dx !== 0 || dy !== 0) {
      container.scrollBy({ left: dx, top: dy, behavior: "smooth" });
    }
  }, [focusedOffset, focusedRect, columns, imgScreenRect]);

  const focusedChar =
    focusedOffset !== null
      ? spatialData.find((c) => c.offset === focusedOffset)
      : null;
  const focusedChoices: string[] | undefined =
    focusedChar && (focusedChar as any).choices
      ? ((focusedChar as any).choices as string[])
      : undefined;

  function applyChoice(s: string) {
    if (focusedOffset === null) return;
    onCharChange(focusedOffset, s);
    if (selectedColumnIndex !== null) {
      const col = columns[selectedColumnIndex];
      if (col) {
        const bboxChars = col.chars.filter((c) => c.bbox);
        const idx = bboxChars.findIndex((c) => c.offset === focusedOffset);
        const next = bboxChars[idx + 1];
        if (next) onFocusChar(next.offset);
        else if (selectedColumnIndex < columns.length - 1)
          onSelectColumn(selectedColumnIndex + 1);
      }
    }
  }

  // Sync canvas size with image
  useEffect(() => {
    if (canvasRef.current && imgScreenRect && imgScreenRect.width > 1) {
      canvasRef.current.width = imgScreenRect.width;
      canvasRef.current.height = imgScreenRect.height;
    }
  }, [imgScreenRect]);

  // Focus management
  useEffect(() => {
    if (focusedOffset === null) return;
    const el = document.querySelector(`[data-char-offset="${focusedOffset}"]`) as HTMLInputElement | null;
    if (el) el.focus();
  }, [focusedOffset, selectedColumnIndex]);

  // ── Drag-to-add ──

  function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsDrawing(true);
    setDrawStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDrawRect(null);
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !drawStart || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    const newRect = {
      x: Math.min(drawStart.x, curX),
      y: Math.min(drawStart.y, curY),
      w: Math.abs(curX - drawStart.x),
      h: Math.abs(curY - drawStart.y),
    };
    setDrawRect(newRect);
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 2;
      ctx.strokeRect(newRect.x, newRect.y, newRect.w, newRect.h);
    }
  }

  function handleCanvasMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    // Mouseup with no prior canvas mousedown means the press happened on
    // an overlay (e.g. the candidate strip), the overlay moved/closed,
    // and the release landed on the canvas. Skip — otherwise we'd treat
    // it as a "click on empty space" and deselect the column the user
    // is editing.
    if (drawStart === null) return;
    setIsDrawing(false);
    if (drawRect && drawRect.w > 5 && drawRect.h > 5) {
      const sw = scaleX || 1;
      const sh = scaleY || 1;
      // Store both normalized and pixel rects for the action popup
      setSelectionRect({
        x: drawRect.x / sw,
        y: drawRect.y / sh,
        w: drawRect.w / sw,
        h: drawRect.h / sh,
      });
      setSelectionPixels({ ...drawRect });
      setManualInput("");
    } else {
      // Simple click — check if on a column, otherwise deselect
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const clickX = (e.clientX - rect.left) / scaleX;
        const clickY = (e.clientY - rect.top) / scaleY;
        const clickedCol = columns.findIndex(
          (col) =>
            clickX >= col.bbox.minX && clickX <= col.bbox.maxX &&
            clickY >= col.bbox.minY && clickY <= col.bbox.maxY
        );
        if (clickedCol >= 0) {
          onSelectColumn(clickedCol);
        } else {
          onDeselectColumn();
        }
      }
      clearSelection();
    }
    // Don't clear the canvas if we have a selection to show
    if (!(drawRect && drawRect.w > 5 && drawRect.h > 5)) {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setDrawRect(null);
    setDrawStart(null);
  }

  function clearSelection() {
    setSelectionRect(null);
    setSelectionPixels(null);
    setManualInput("");
    setNnvPrediction(null);
    setNnvError(null);
    setNnvLoading(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }

  // Predict the drawn region as a single character via the NNV endpoint.
  // The popup populates with top-K candidate chips; the manual input gets
  // seeded with top-1 so a user who's happy with the prediction can hit
  // Add without typing. The candidates flow into the new char's `choices`
  // when Add fires (handleManualAdd reads `nnvPrediction`).
  async function handleNnvPredict() {
    if (!selectionRect || !imgRef.current) return;
    setNnvLoading(true);
    setNnvError(null);
    setNnvPrediction(null);
    const r = selectionRect;
    const bbox = [
      { x: r.x, y: r.y },
      { x: r.x + r.w, y: r.y },
      { x: r.x + r.w, y: r.y + r.h },
      { x: r.x, y: r.y + r.h },
    ];
    try {
      const pixels = await cropBboxToPixelArray(
        imgRef.current,
        bbox,
        0.1,
        popupPerChar
      );
      const candidates = await recognizeSingleChar(pixels, 9);
      setNnvPrediction(candidates);
      if (candidates.length > 0 && manualInput.trim().length === 0) {
        setManualInput(candidates[0].char);
      }
    } catch (e: any) {
      setNnvError(e?.message ?? "NNV call failed");
    } finally {
      setNnvLoading(false);
    }
  }

  function handleManualAdd() {
    if (!selectionRect) return;
    const r = selectionRect;
    const bbox: Array<{ x: number; y: number }> = [
      { x: r.x, y: r.y },
      { x: r.x + r.w, y: r.y },
      { x: r.x + r.w, y: r.y + r.h },
      { x: r.x, y: r.y + r.h },
    ];
    const text = manualInput.trim();
    // Carry NNV's top-K into the new char's `choices` so the OCRToolbox
    // alternates panel can offer the other predictions immediately. The
    // primary text gets stripped from the alternates inside handleAddChar.
    const extras =
      nnvPrediction && nnvPrediction.length > 0
        ? {
            choices: nnvPrediction.map((c) => c.char),
            confidence: text
              ? nnvPrediction.find((c) => c.char === text)?.confidence ??
                nnvPrediction[0]?.confidence
              : undefined,
          }
        : undefined;
    // Empty text = empty placeholder box; OCRWorkspace stamps it uncertain.
    onAddChar(bbox, text, extras);
    clearSelection();
    // The popup is portalled to document.body and unmounts when
    // selection is cleared, taking the focused input with it. Without
    // an explicit focus shift the browser drops focus onto body; Tab
    // from there can leak to the URL bar / browser chrome (the user's
    // "focus goes to the browser" symptom). Pull focus back into the
    // editor container so subsequent keys stay scoped to the page.
    requestAnimationFrame(() => containerRef.current?.focus());
  }

  function handleOcrSelection(engine: "kandi" | "kandi+nnv") {
    if (!selectionRect) return;
    onOcrRegion(selectionRect, engine);
    clearSelection();
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) =>
      clampZoom(z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP))
    );
  }

  return (
    <div
      ref={containerRef}
      // tabIndex=-1 lets us programmatically focus the container after
      // popups unmount, so focus never escapes the editor onto browser
      // chrome. Negative tabIndex keeps it out of the Tab traversal
      // sequence — only programmatic .focus() can target it.
      tabIndex={-1}
      className="relative h-full overflow-auto bg-gray-100 outline-none"
      onWheel={handleWheel}
      style={{ scrollbarGutter: "stable" }}
    >
      {/* Floating zoom controls — absolute so they don't displace the image. */}
      <div className="absolute top-2 right-2 z-[70] inline-flex items-center gap-0.5 bg-white border border-gray-300 rounded shadow-sm text-[11px]">
        <button
          type="button"
          onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
          disabled={zoom <= ZOOM_MIN}
          title="Zoom out (Ctrl + scroll)"
          className="px-2 py-0.5 hover:bg-gray-100 disabled:opacity-30"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          title="Reset zoom"
          className="px-2 py-0.5 hover:bg-gray-100 tabular-nums"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
          disabled={zoom >= ZOOM_MAX}
          title="Zoom in (Ctrl + scroll)"
          className="px-2 py-0.5 hover:bg-gray-100 disabled:opacity-30"
        >
          +
        </button>
      </div>
      <div className="relative inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Document page"
          className="block h-auto"
          draggable={false}
          style={
            containerWidth
              ? { width: containerWidth * zoom, maxWidth: "none" }
              : { width: "100%" }
          }
        />

        {/* Drag-to-add canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => { if (isDrawing) handleCanvasMouseUp({} as any); }}
          className="absolute inset-0 z-20 cursor-crosshair"
          style={{ pointerEvents: "auto" }}
        />

        {/* Column highlight overlays with numbers */}
        {columns.map((col, ci) => {
          const left = col.bbox.minX * scaleX;
          const top = col.bbox.minY * scaleY;
          const width = (col.bbox.maxX - col.bbox.minX) * scaleX;
          const height = (col.bbox.maxY - col.bbox.minY) * scaleY;
          const isSelected = ci === selectedColumnIndex;

          return (
            <div
              key={ci}
              style={{ left, top, width, height, position: "absolute", zIndex: 5 }}
              className={`pointer-events-none border-2 transition-colors ${
                isSelected
                  ? "border-red-500 bg-red-500/5"
                  : col.isRow
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-indigo-400 bg-indigo-400/10"
              }`}
            >
              <span
                className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-1 rounded ${
                  isSelected
                    ? "bg-red-500 text-white"
                    : col.isRow
                    ? "bg-emerald-500 text-white"
                    : "bg-indigo-500 text-white"
                }`}
              >
                {col.isRow ? "R" : ""}{ci + 1}
              </span>
            </div>
          );
        })}

        {/* Selection highlight (stays clipped to image area — that's correct,
            it marks the selected region on the page). */}
        {selectionPixels && selectionRect && (
          <div
            style={{
              position: "absolute",
              left: selectionPixels.x,
              top: selectionPixels.y,
              width: selectionPixels.w,
              height: selectionPixels.h,
              zIndex: 25,
            }}
            className="border-2 border-dashed border-red-500 bg-red-500/10 pointer-events-none"
          />
        )}

      </div>

      {/* Selection action popup — portaled to document.body with viewport-
          fixed positioning so it floats over the right sidebar instead of
          being clipped by the image pane's overflow. Positioned just below
          the selection rectangle in viewport coords; if that would push it
          off the right edge, clamp left so it stays on-screen. */}
      {selectionPixels && imgScreenRect && typeof document !== "undefined" &&
        createPortal(
          (() => {
            const POPUP_WIDTH = 320; // approximate, used only for right-edge clamp
            const desiredLeft = imgScreenRect.left + selectionPixels.x;
            const top =
              imgScreenRect.top + selectionPixels.y + selectionPixels.h + 4;
            const maxLeft =
              typeof window !== "undefined"
                ? window.innerWidth - POPUP_WIDTH - 8
                : desiredLeft;
            const left = Math.max(8, Math.min(maxLeft, desiredLeft));
            return (
              <div
                style={{
                  position: "fixed",
                  left,
                  top,
                  zIndex: 1000,
                }}
                className="flex flex-col gap-1 bg-white border border-gray-300 rounded shadow-lg p-1.5 max-w-md"
              >
                <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => handleOcrSelection("kandi")}
                  className="px-2 py-1 text-[10px] font-medium rounded bg-branding-black text-white hover:bg-gray-800"
                >
                  OCR
                </button>
                <button
                  onClick={() => handleOcrSelection("kandi+nnv")}
                  title="Re-OCR existing Kandianguji characters in this region with Nôm Na Việt (replaces only chars whose top NNV guess is a Nôm-specific SIP code point)"
                  className="px-2 py-1 text-[10px] font-medium rounded bg-amber-600 text-white hover:bg-amber-700"
                >
                  Nôm Na
                </button>
                <button
                  onClick={handleNnvPredict}
                  disabled={nnvLoading}
                  title="Crop this region to a single character and ask Nôm Na Việt for its top-9 predictions"
                  className="px-2 py-1 text-[10px] font-medium rounded bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:opacity-50"
                >
                  {nnvLoading ? "…" : "Predict"}
                </button>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => {
                    // preventDefault keeps the Enter from leaking past
                    // the now-unmounting popup (where there's no <form>
                    // anchor) and stranding focus on document.body —
                    // i.e. the user's "focus jumps to the browser" report.
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      handleManualAdd();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      e.stopPropagation();
                      clearSelection();
                      // Move focus back into the editor container so the
                      // page stays the active document.
                      requestAnimationFrame(() =>
                        containerRef.current?.focus()
                      );
                    }
                  }}
                  placeholder="Type text (empty = uncertain)"
                  className="w-32 px-1.5 py-1 text-[10px] border border-gray-300 rounded focus:outline-none focus:border-indigo-400"
                  autoFocus
                />
                <button
                  onClick={handleManualAdd}
                  title={
                    manualInput.trim()
                      ? "Add char"
                      : "Add empty box (auto-marked uncertain)"
                  }
                  className="px-2 py-1 text-[10px] font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Add
                </button>
                <button
                  onClick={clearSelection}
                  className="px-1.5 py-1 text-[10px] text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
                </div>
                <div className="flex items-center gap-2 pt-0.5 border-t border-gray-100">
                  {previewDataUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={previewDataUrl}
                      alt="NNV crop preview"
                      title="What NNV will receive at the current toggle settings (64×64 grayscale, scaled up here for visibility)"
                      width={64}
                      height={64}
                      style={{
                        imageRendering: "pixelated",
                        background: "#fff",
                      }}
                      className="border border-gray-300 rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 border border-dashed border-gray-300 rounded flex items-center justify-center text-[9px] text-gray-400">
                      preview
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 text-[10px]">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!popupPerChar.threshold}
                        onChange={(e) =>
                          setPopupPerChar((p) => ({
                            ...p,
                            threshold: e.target.checked,
                          }))
                        }
                      />
                      <span>Threshold (Otsu)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!popupPerChar.center}
                        onChange={(e) =>
                          setPopupPerChar((p) => ({
                            ...p,
                            center: e.target.checked,
                          }))
                        }
                      />
                      <span>Tight-crop & center</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!popupPerChar.morphClose}
                        onChange={(e) =>
                          setPopupPerChar((p) => ({
                            ...p,
                            morphClose: e.target.checked,
                          }))
                        }
                      />
                      <span>Morph close (3×3)</span>
                    </label>
                  </div>
                </div>
                {nnvError && (
                  <div className="text-[10px] text-red-600 px-1">
                    NNV: {nnvError}
                  </div>
                )}
                {nnvPrediction && nnvPrediction.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-0.5 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 leading-none">
                      candidates:
                    </span>
                    {nnvPrediction.map((c, i) => (
                      <button
                        key={`${c.char}-${i}`}
                        type="button"
                        onClick={() => setManualInput(c.char)}
                        title={`Rank ${i + 1} · confidence ${(
                          c.confidence * 100
                        ).toFixed(1)}% — click to set as text`}
                        className={`px-1.5 py-0.5 text-base font-han-nom rounded border ${
                          manualInput === c.char
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {c.char}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })(),
          document.body
        )}

      {/* Character input overlays for selected column. Rendered OUTSIDE the
          zoom wrapper so position:fixed coords (already post-zoom from
          getBoundingClientRect) aren't re-scaled by the ancestor zoom.
          Suppressed in Quốc Ngữ mode — the QN cell layer below replaces
          this surface so the two don't overlap. */}
      {selectedColumn && !qnMode && (() => {
          const allCharsInCol = selectedColumn.chars.filter((c) => c.bbox);
          if (allCharsInCol.length === 0) return null;

          // Compute median main-text character height for uniform sizing
          const sectionTypeMap = new Map<number, "main" | "commentary">();
          for (const sec of selectedColumn.sections) {
            for (const c of sec.chars) sectionTypeMap.set(c.offset, sec.type);
          }
          const mainChars = allCharsInCol.filter((c) => sectionTypeMap.get(c.offset) !== "commentary");
          const sizeSource = mainChars.length > 0 ? mainChars : allCharsInCol;
          const heights = sizeSource.map((c) =>
            Math.abs(c.bbox![3].y - c.bbox![0].y) * scaleY
          ).sort((a, b) => a - b);
          const medianH = heights[Math.floor(heights.length / 2)];
          const SCALE = 1.4; // scale up for readability
          const MAIN_SIZE = Math.max(22, Math.round(medianH * SCALE));
          const COMMENT_SIZE = Math.max(16, Math.round(MAIN_SIZE * 0.65));
          const COL_GAP = 1;
          const PAD = 6; // padding inside the panel edges

          // Panel width: two commentary cells side by side + padding
          const PANEL_W = MAIN_SIZE + COL_GAP * 2 + PAD * 2;
          const colLeftPx = selectedColumn.bbox.minX * scaleX;
          const panelLeft = colLeftPx - PANEL_W - 6;
          const centerX = panelLeft + PANEL_W / 2;

          // For commentary chars, determine side and pair up same-Y chars
          const commentarySide = new Map<number, "right" | "left">();
          // Maps offset → shared Y center (px) for paired commentary chars
          const pairedY = new Map<number, number>();

          for (const sec of selectedColumn.sections) {
            if (sec.type !== "commentary") continue;
            const split = splitCommentarySides(sec.chars);
            if (!split) continue;

            split.side.forEach((s, offset) => commentarySide.set(offset, s));

            // Lift each paired right/left char to a shared Y center (in px),
            // mirroring the prior in-pane logic so vertically-aligned input
            // cells line up across the two sub-columns.
            for (const p of split.pairs) {
              if (!p.right || !p.left) continue;
              const ry = (p.right.bbox![0].y + p.right.bbox![2].y) / 2;
              const ly = (p.left.bbox![0].y + p.left.bbox![2].y) / 2;
              const sharedY = ((ry + ly) / 2) * scaleY;
              pairedY.set(p.right.offset, sharedY);
              pairedY.set(p.left.offset, sharedY);
            }
          }

          // Panel vertical extent from the column's geometric bounds, not
          // reading order. For columns with dual-line commentary, the last
          // char in reading order is the last left-sub-col entry, which can
          // sit well above the true bottom of the column (the last right-
          // sub-col char). Using selectedColumn.bbox captures the full
          // vertical extent of every char in the column.
          const panelTop = selectedColumn.bbox.minY * scaleY - 4;
          const panelBottom = selectedColumn.bbox.maxY * scaleY + 4;

          const panelElements = [
            <div
              key="__bg"
              style={{
                position: "absolute",
                left: panelLeft - 2,
                top: panelTop,
                width: PANEL_W + 4,
                height: panelBottom - panelTop,
                zIndex: 8,
              }}
              className="bg-white border border-gray-200 rounded-lg pointer-events-none shadow-sm"
            />,
          ];

          const cellElements = panelElements.concat(allCharsInCol.map((char, charIdx) => {
            const imgTop = char.bbox![0].y * scaleY;
            const imgLeft = char.bbox![0].x * scaleX;
            const boxW = Math.abs(char.bbox![1].x - char.bbox![0].x) * scaleX;
            const boxH = Math.abs(char.bbox![3].y - char.bbox![0].y) * scaleY;
            const isFocused = char.offset === focusedOffset;
            const conf = char.confidence;
            const isCommentary = sectionTypeMap.get(char.offset) === "commentary";
            const side = commentarySide.get(char.offset);

            // Cell size and horizontal position
            let cellSize: number;
            let cellLeft: number;
            if (isCommentary && side === "right") {
              cellSize = COMMENT_SIZE;
              cellLeft = centerX + COL_GAP / 2;
            } else if (isCommentary && side === "left") {
              cellSize = COMMENT_SIZE;
              cellLeft = centerX - COL_GAP / 2 - COMMENT_SIZE;
            } else {
              // Main text or single commentary char: centered on the line
              cellSize = isCommentary ? COMMENT_SIZE : MAIN_SIZE;
              cellLeft = centerX - cellSize / 2;
            }

            // Align vertically: use shared Y for paired commentary, otherwise char center
            const sharedCenterY = pairedY.get(char.offset);
            const charCenterY = sharedCenterY ?? (imgTop + boxH / 2);
            const cellTop = charCenterY - cellSize / 2;

            function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
              // Don't hijack Tab / Enter / arrows while an IME composition
              // is active. Pinyin / Vietnamese Telex / Nôm plugins bind
              // these to their own candidate picker or composition commit
              // — stealing them either drops the in-progress word (the
              // "can't type the last g" symptom) or sends the IME's chosen
              // char to the next box once we advance focus.
              if (
                e.nativeEvent.isComposing ||
                (e.nativeEvent as any).keyCode === 229
              ) {
                return;
              }
              const isArmed = armedDeleteOffset === char.offset;
              if (e.key === "Delete" && onDeleteChar) {
                e.preventDefault();
                setArmedDeleteOffset(isArmed ? null : char.offset);
                return;
              }
              if (isArmed && e.key === "Enter" && onDeleteChar) {
                e.preventDefault();
                setArmedDeleteOffset(null);
                onDeleteChar(char.offset);
                return;
              }
              if (isArmed && e.key === "Escape") {
                e.preventDefault();
                setArmedDeleteOffset(null);
                return;
              }
              if (isArmed) {
                // Any other key — cancel the armed state and let the key
                // proceed normally (typing in the cell, Tab to move, etc.).
                setArmedDeleteOffset(null);
              }
              if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                const next = allCharsInCol[charIdx + 1];
                if (next) {
                  onFocusChar(next.offset);
                } else if (selectedColumnIndex !== null && selectedColumnIndex < columns.length - 1) {
                  onSelectColumn(selectedColumnIndex + 1);
                } else {
                  onSelectColumn(0);
                }
              } else if (e.key === "Tab" && e.shiftKey) {
                e.preventDefault();
                const prev = allCharsInCol[charIdx - 1];
                if (prev) {
                  onFocusChar(prev.offset);
                } else if (selectedColumnIndex !== null && selectedColumnIndex > 0) {
                  const prevCol = columns[selectedColumnIndex - 1];
                  onSelectColumn(selectedColumnIndex - 1);
                  const lastChar = prevCol.chars.filter((c) => c.bbox).at(-1);
                  if (lastChar) onFocusChar(lastChar.offset);
                } else {
                  const lastCol = columns[columns.length - 1];
                  if (lastCol) {
                    onSelectColumn(columns.length - 1);
                    const lastChar = lastCol.chars.filter((c) => c.bbox).at(-1);
                    if (lastChar) onFocusChar(lastChar.offset);
                  }
                }
              } else if (e.key === "Enter") {
                e.preventDefault();
                const next = allCharsInCol[charIdx + 1];
                if (next) {
                  onFocusChar(next.offset);
                } else if (selectedColumnIndex !== null && selectedColumnIndex < columns.length - 1) {
                  onSelectColumn(selectedColumnIndex + 1);
                }
              }
            }

            const textColor = conf < 0.3
              ? "text-red-600"
              : conf < 0.5
              ? "text-amber-600"
              : "text-gray-800";

            const isArmedDelete = armedDeleteOffset === char.offset;
            const recurringSuggestions = recurringCorrections?.[char.text];
            const topSuggestion = recurringSuggestions?.[0];
            return (
              <div key={char.offset} style={{ position: "absolute", left: 0, top: 0, zIndex: isFocused ? 50 : 10 }}>
                {isFocused && (
                  <div
                    style={{
                      position: "absolute",
                      left: imgLeft,
                      top: imgTop,
                      width: boxW,
                      height: boxH,
                      zIndex: 45,
                    }}
                    className="pointer-events-none rounded ring-2 ring-offset-1 ring-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.4)]"
                  />
                )}
                {topSuggestion && (
                  <div
                    style={{
                      position: "absolute",
                      left: cellLeft - 2,
                      top: cellTop - 2,
                      width: cellSize + 4,
                      height: cellSize + 4,
                      zIndex: 44,
                    }}
                    className="pointer-events-none rounded ring-2 ring-fuchsia-500"
                  />
                )}
                <input
                  data-char-offset={char.offset}
                  type="text"
                  value={char.text}
                  maxLength={6}
                  onChange={(e) => {
                    if (armedDeleteOffset === char.offset) {
                      setArmedDeleteOffset(null);
                    }
                    onCharChange(char.offset, e.target.value);
                  }}
                  onCompositionEnd={(e) => {
                    // Flush the committed IME value (Vietnamese Telex,
                    // CJK IMEs) — onChange during composition only sees
                    // intermediate buffer states, not the final commit.
                    onCharChange(char.offset, (e.target as HTMLInputElement).value);
                  }}
                  onBlur={(e) => {
                    // Catches programmatic value writes from Chrome
                    // extensions (external Telex keyboards) that bypass
                    // React's synthetic onChange.
                    if (e.target.value !== char.text) {
                      onCharChange(char.offset, e.target.value);
                    }
                    if (armedDeleteOffset === char.offset) {
                      setArmedDeleteOffset(null);
                    }
                  }}
                  onFocus={() => onFocusChar(char.offset)}
                  onKeyDown={handleKeyDown}
                  title={`confidence: ${Math.round(conf * 100)}%${
                    char.uncertain ? " · flagged uncertain (` to clear)" : ""
                  }${char.ids ? ` · IDS: ${char.ids}` : ""}${
                    char.note ? ` · note: ${char.note}` : ""
                  }`}
                  style={{
                    position: "absolute",
                    left: cellLeft,
                    top: cellTop,
                    width: cellSize,
                    height: cellSize,
                    fontSize: Math.round(cellSize * 0.65),
                    lineHeight: 1,
                    padding: "1px",
                    zIndex: isFocused ? 50 : 10,
                    pointerEvents: "auto",
                  }}
                  className={`text-center font-han-nom outline-none ${textColor} ${
                    isArmedDelete
                      ? "bg-red-100 border-2 border-red-500 ring-2 ring-red-400 rounded"
                      : char.uncertain
                      ? "bg-yellow-100 border-2 border-yellow-500 rounded"
                      : isFocused
                      ? "bg-indigo-50 border-2 border-indigo-500 ring-2 ring-indigo-300 rounded"
                      : "bg-transparent border-0"
                  }`}
                />
                {topSuggestion && !isArmedDelete && (
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onCharChange(char.offset, topSuggestion.to);
                    }}
                    title={`You've corrected ${char.text} → ${topSuggestion.to} ${topSuggestion.totalChars} times. Click to apply.${
                      recurringSuggestions!.length > 1
                        ? ` (${recurringSuggestions!.length - 1} other suggestion${recurringSuggestions!.length - 1 === 1 ? "" : "s"})`
                        : ""
                    }`}
                    style={{
                      position: "absolute",
                      left: cellLeft + cellSize - 4,
                      top: cellTop - 12,
                      zIndex: 54,
                    }}
                    className="px-1 py-0.5 text-[10px] font-semibold rounded bg-fuchsia-600 text-white shadow hover:bg-fuchsia-700 font-han-nom"
                  >
                    →{topSuggestion.to}
                  </button>
                )}
                {isArmedDelete && onDeleteChar && (
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => {
                      // Use mousedown so we fire before the input blurs,
                      // which would otherwise clear armedDeleteOffset.
                      e.preventDefault();
                      setArmedDeleteOffset(null);
                      onDeleteChar(char.offset);
                    }}
                    title="Confirm delete (Enter to confirm, Esc to cancel)"
                    style={{
                      position: "absolute",
                      left: cellLeft + cellSize - 6,
                      top: cellTop - 10,
                      zIndex: 55,
                    }}
                    className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-600 text-white shadow hover:bg-red-700"
                  >
                    Delete?
                  </button>
                )}
                {/* Inline candidate popover lives at the OCRImagePane root
                    via position:fixed so it escapes the parent overflow-
                    clipping. See <CandidateStrip /> below the loop. */}
              </div>
            );
          }));

          // Wrap the entire panel + cells in a fixed-position container
          // anchored to the image's screen rect. Fixed positioning escapes
          // ancestor overflow so the panel can extend left of the image
          // column without being clipped by parent panes.
          if (!imgScreenRect) return null;
          return (
            <div
              style={{
                position: "fixed",
                left: imgScreenRect.left,
                top: imgScreenRect.top,
                width: imgScreenRect.width,
                height: imgScreenRect.height,
                pointerEvents: "none",
                zIndex: 60,
              }}
            >
              {cellElements}
            </div>
          );
        })()}

      {/* Quốc Ngữ cell layer — text-search's renderQnImageCells, DVN-
          adapted (no H/N tag filter). For the selected column, a vertical
          stack of boxes beside it: each box shows the read-only Hán-Nôm
          glyph next to an editable Quốc Ngữ input. Tab/Enter cycle the QN
          inputs in reading order; clicking the glyph focuses the char so
          the toolbox's Transliterate / prior-reading suggestions target
          it. */}
      {selectedColumn && qnMode && imgScreenRect && (() => {
          const charsInCol = selectedColumn.chars.filter(
            (c) => c.bbox && c.text && c.text !== "\n"
          );
          if (charsInCol.length === 0) return null;

          const heights = charsInCol
            .map((c) => Math.abs(c.bbox![3].y - c.bbox![0].y) * scaleY)
            .sort((a, b) => a - b);
          const medianH = heights[Math.floor(heights.length / 2)] || 24;
          const cellH = Math.max(24, Math.round(medianH));
          const glyphW = Math.max(22, Math.round(medianH * 0.95));
          const inputW = Math.max(56, Math.round(medianH * 2.8));
          const boxW = glyphW + inputW + 8;

          const colLeftPx = selectedColumn.bbox.minX * scaleX;
          const colRightPx = selectedColumn.bbox.maxX * scaleX;
          let boxLeft = colLeftPx - boxW - 6;
          if (boxLeft < 0) boxLeft = colRightPx + 6;

          function focusSibling(idx: number, dir: 1 | -1) {
            const n = charsInCol[idx + dir];
            if (n) {
              onFocusChar(n.offset);
              return;
            }
            if (selectedColumnIndex === null) return;
            const nextCol = selectedColumnIndex + dir;
            if (nextCol < 0 || nextCol > columns.length - 1) return;
            const target = columns[nextCol].chars.filter(
              (c) => c.bbox && c.text && c.text !== "\n"
            );
            onSelectColumn(nextCol);
            const land = dir === 1 ? target[0] : target.at(-1);
            if (land) onFocusChar(land.offset);
          }

          const cells = charsInCol.map((char, idx) => {
            const ys = char.bbox!.map((p) => p.y);
            const centerY =
              ((Math.min(...ys) + Math.max(...ys)) / 2) * scaleY;
            const top = centerY - cellH / 2;
            const isFocused = char.offset === focusedOffset;
            return (
              <div
                key={char.offset}
                style={{
                  position: "absolute",
                  left: boxLeft,
                  top,
                  width: boxW,
                  height: cellH,
                  zIndex: isFocused ? 50 : 12,
                }}
                className={`flex items-stretch rounded border shadow-sm pointer-events-auto ${
                  isFocused
                    ? "border-primary-blue ring-2 ring-blue-200 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <span
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onFocusChar(char.offset);
                  }}
                  title={`${char.text} — click to focus (toolbox: Transliterate / suggestions)`}
                  className="flex items-center justify-center font-han-nom text-gray-800 cursor-pointer select-none border-r border-gray-200"
                  style={{
                    width: glyphW,
                    fontSize: Math.round(cellH * 0.62),
                    lineHeight: 1,
                  }}
                >
                  {char.text}
                </span>
                <input
                  data-char-offset={char.offset}
                  type="text"
                  value={char.quocNgu ?? ""}
                  placeholder="—"
                  onChange={(e) => onQnChange?.(char.offset, e.target.value)}
                  onFocus={() => onFocusChar(char.offset)}
                  onKeyDown={(e) => {
                    if (
                      e.nativeEvent.isComposing ||
                      (e.nativeEvent as any).keyCode === 229
                    ) {
                      return;
                    }
                    if (e.key === "Tab") {
                      e.preventDefault();
                      focusSibling(idx, e.shiftKey ? -1 : 1);
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      focusSibling(idx, 1);
                    } else if (e.key === "Escape") {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="flex-1 min-w-0 px-1.5 font-halyard text-gray-900 bg-transparent outline-none"
                  style={{
                    fontSize: Math.max(12, Math.round(cellH * 0.5)),
                  }}
                />
              </div>
            );
          });

          return (
            <div
              style={{
                position: "fixed",
                left: imgScreenRect.left,
                top: imgScreenRect.top,
                width: imgScreenRect.width,
                height: imgScreenRect.height,
                pointerEvents: "none",
                zIndex: 60,
              }}
            >
              {cells}
            </div>
          );
        })()}

      {/* Candidate strip — fixed-position so it overlays document body and
          isn't clipped by any ancestor overflow. Anchored to the LEFT edge
          of the focused input cell, growing leftward. Suppressed in QN
          mode (those are OCR char choices; QN candidates live in the
          toolbox panel). */}
      {!qnMode && focusedRect && focusedChoices && focusedChoices.length > 0 && (
        <div
          style={{
            position: "fixed",
            left: focusedRect.left - 6,
            top: focusedRect.top,
            transform: "translateX(-100%)",
            zIndex: 1000,
          }}
          className="flex flex-row-reverse bg-white border border-gray-200 rounded shadow"
        >
          {focusedChoices.slice(0, 6).map((s, i) => (
            <button
              key={i}
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                applyChoice(s);
              }}
              title={`Press ${i + 1} to apply`}
              style={{ width: focusedRect.height, height: focusedRect.height }}
              className="relative flex items-center justify-center hover:bg-indigo-50 border-r border-gray-100 first:border-r-0"
            >
              <span className="absolute left-1/2 -translate-x-1/2 -top-2 inline-flex items-center justify-center w-2.5 h-2.5 text-[6px] font-semibold rounded-full bg-indigo-500 text-white leading-none ring-1 ring-white pointer-events-none">
                {i + 1}
              </span>
              <span
                className="font-han-nom"
                style={{ fontSize: Math.round(focusedRect.height * 0.65), lineHeight: 1 }}
              >
                {s}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
