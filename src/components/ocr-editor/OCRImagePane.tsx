"use client";

import { useRef, useState, useEffect, useLayoutEffect } from "react";
import type { SpatialCharacter } from "@/lib/ocr-store";
import type { Column } from "./useColumnDetection";
import { splitCommentarySides } from "./useColumnDetection";

interface OCRImagePaneProps {
  imageUrl: string;
  columns: Column[];
  selectedColumnIndex: number | null;
  spatialData: SpatialCharacter[];
  onSelectColumn: (index: number) => void;
  onDeselectColumn: () => void;
  onCharChange: (offset: number, newText: string) => void;
  onFocusChar: (offset: number) => void;
  onAddChar: (bbox: Array<{ x: number; y: number }>, text: string) => void;
  onOcrRegion: (rect: { x: number; y: number; w: number; h: number }) => void;
  focusedOffset: number | null;
  viewMode?: "charBox" | "column";
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
}

export default function OCRImagePane({
  imageUrl,
  columns,
  selectedColumnIndex,
  spatialData,
  onSelectColumn,
  onDeselectColumn,
  onCharChange,
  onFocusChar,
  onAddChar,
  onOcrRegion,
  focusedOffset,
}: OCRImagePaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [imgDims, setImgDims] = useState({ w: 1, h: 1 });

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Selection action popup state
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [selectionPixels, setSelectionPixels] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [manualInput, setManualInput] = useState("");

  const scaleX = imgDims.w;
  const scaleY = imgDims.h;

  const selectedColumn =
    selectedColumnIndex !== null ? columns[selectedColumnIndex] ?? null : null;

  // Track the image's screen rect so we can render the input panel and the
  // candidate-strip popover at document-body coords via position:fixed.
  // Without this they're clipped by ancestor overflow when they extend past
  // the image's left edge.
  const [imgScreenRect, setImgScreenRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  useLayoutEffect(() => {
    function update() {
      const el = imgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setImgScreenRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [imgDims]);

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

  function handleImgLoad() {
    if (imgRef.current) {
      setImgDims({ w: imgRef.current.clientWidth, h: imgRef.current.clientHeight });
    }
  }

  // Sync canvas size with image
  useEffect(() => {
    if (canvasRef.current && imgDims.w > 1) {
      canvasRef.current.width = imgDims.w;
      canvasRef.current.height = imgDims.h;
    }
  }, [imgDims]);

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
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }

  function handleManualAdd() {
    if (!selectionRect || !manualInput.trim()) return;
    const r = selectionRect;
    const bbox: Array<{ x: number; y: number }> = [
      { x: r.x, y: r.y },
      { x: r.x + r.w, y: r.y },
      { x: r.x + r.w, y: r.y + r.h },
      { x: r.x, y: r.y + r.h },
    ];
    onAddChar(bbox, manualInput.trim());
    clearSelection();
  }

  function handleOcrSelection() {
    if (!selectionRect) return;
    onOcrRegion(selectionRect);
    clearSelection();
  }

  return (
    <div ref={containerRef} className="relative h-full overflow-auto bg-gray-100">
      <div className="relative inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Document page"
          className="block w-full h-auto"
          draggable={false}
          onLoad={handleImgLoad}
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

        {/* Selection action popup */}
        {selectionPixels && selectionRect && (
          <>
            {/* Selection highlight */}
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
            {/* Action buttons below the selection */}
            <div
              style={{
                position: "absolute",
                left: selectionPixels.x,
                top: selectionPixels.y + selectionPixels.h + 4,
                zIndex: 30,
              }}
              className="flex items-center gap-1 bg-white border border-gray-300 rounded shadow-lg p-1.5"
            >
              <button
                onClick={handleOcrSelection}
                className="px-2 py-1 text-[10px] font-medium rounded bg-branding-black text-white hover:bg-gray-800"
              >
                OCR
              </button>
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleManualAdd(); }}
                placeholder="Type text…"
                className="w-24 px-1.5 py-1 text-[10px] border border-gray-300 rounded focus:outline-none focus:border-indigo-400"
                autoFocus
              />
              <button
                onClick={handleManualAdd}
                disabled={!manualInput.trim()}
                className="px-2 py-1 text-[10px] font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-30"
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
          </>
        )}

        {/* Character input overlays for selected column */}
        {selectedColumn && (() => {
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
                <input
                  data-char-offset={char.offset}
                  type="text"
                  value={char.text}
                  maxLength={4}
                  onChange={(e) => onCharChange(char.offset, e.target.value)}
                  onFocus={() => onFocusChar(char.offset)}
                  onKeyDown={handleKeyDown}
                  title={`confidence: ${Math.round(conf * 100)}%`}
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
                  className={`text-center font-serif outline-none bg-transparent ${textColor} ${
                    isFocused ? "border-2 border-indigo-500 ring-2 ring-indigo-300 bg-indigo-50 rounded" : "border-0"
                  }`}
                />
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
      </div>

      {/* Candidate strip — fixed-position so it overlays document body and
          isn't clipped by any ancestor overflow. Anchored to the LEFT edge
          of the focused input cell, growing leftward. */}
      {focusedRect && focusedChoices && focusedChoices.length > 0 && (
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
                className="font-serif"
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
