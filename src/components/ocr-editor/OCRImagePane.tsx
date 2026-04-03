"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { SpatialCharacter } from "@/lib/ocr-store";
import type { Column } from "./useColumnDetection";

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
  onOcrRegion: (rect: { x: number; y: number; w: number; h: number }, engine: "vision" | "paddle") => void;
  onDeleteChar: (offset: number) => void;
  focusedOffset: number | null;
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
  onDeleteChar,
  focusedOffset,
}: OCRImagePaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [imgDims, setImgDims] = useState({ w: 1, h: 1 });
  const [deleteArmed, setDeleteArmed] = useState(false);

  // Disarm delete confirmation if the focused character changes
  useEffect(() => { setDeleteArmed(false); }, [focusedOffset]);

  // Draggable character detail card
  const CARD_W = 224; // w-56 = 14rem = 224px
  const CARD_H = 210; // approximate card height
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (cardPos === null) {
      setCardPos({
        x: Math.round(window.innerWidth / 2 - CARD_W / 2),
        y: Math.round(window.innerHeight / 2 - CARD_H / 2),
      });
    }
  }, [cardPos]);

  const handleCardMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragOffsetRef.current = {
      x: e.clientX - (cardPos?.x ?? 0),
      y: e.clientY - (cardPos?.y ?? 0),
    };
    function onMove(me: MouseEvent) {
      if (!dragOffsetRef.current) return;
      setCardPos({
        x: me.clientX - dragOffsetRef.current.x,
        y: me.clientY - dragOffsetRef.current.y,
      });
    }
    function onUp() {
      dragOffsetRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [cardPos]);

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

  // Focused character metadata
  const focusedChar =
    focusedOffset !== null
      ? spatialData.find((c) => c.offset === focusedOffset) ?? null
      : null;

  const focusedColIdx =
    focusedChar !== null
      ? columns.findIndex((col) =>
          col.chars.some((c) => c.offset === focusedOffset)
        )
      : -1;

  const focusedPosInCol =
    focusedChar !== null && focusedColIdx >= 0
      ? (columns[focusedColIdx]?.chars.findIndex(
          (c) => c.offset === focusedOffset
        ) ?? -1) + 1
      : null;

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

  function handleOcrSelection(engine: "vision" | "paddle") {
    if (!selectionRect) return;
    onOcrRegion(selectionRect, engine);
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
                onClick={() => handleOcrSelection("vision")}
                className="px-2 py-1 text-[10px] font-medium rounded bg-branding-black text-white hover:bg-gray-800"
              >
                Vision OCR
              </button>
              <button
                onClick={() => handleOcrSelection("paddle")}
                className="px-2 py-1 text-[10px] font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Paddle OCR
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
        {selectedColumn &&
          selectedColumn.chars.map((char, charIdx) => {
            if (!char.bbox) return null;

            const left = char.bbox[0].x * scaleX;
            const top = char.bbox[0].y * scaleY;
            const boxW = Math.abs(char.bbox[1].x - char.bbox[0].x) * scaleX;
            const boxH = Math.abs(char.bbox[3].y - char.bbox[0].y) * scaleY;
            const isFocused = char.offset === focusedOffset;
            const conf = char.confidence;

            const allCharsInCol = selectedColumn.chars.filter((c) => c.bbox);

            function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
              if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                const next = allCharsInCol[charIdx + 1];
                if (next) {
                  onFocusChar(next.offset);
                } else if (selectedColumnIndex !== null && selectedColumnIndex < columns.length - 1) {
                  onSelectColumn(selectedColumnIndex + 1);
                } else {
                  // Last char of last column — wrap to first char of first column
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
                  // First char of first column — wrap to last char of last column
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

            const confBorder = isFocused
              ? "border-red-500 ring-1 ring-red-400"
              : conf < 0.3
              ? "border-red-400 bg-red-50/90"
              : conf < 0.5
              ? "border-yellow-400 bg-yellow-50/90"
              : "border-indigo-300 bg-white/90";

            return (
              <div key={char.offset} style={{ position: "absolute", left: 0, top: 0, zIndex: isFocused ? 50 : 10 }}>
                {/* Focused character bounding-box highlight on the image */}
                {isFocused && (
                  <div
                    style={{
                      position: "absolute",
                      left,
                      top,
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
                    left: left - boxW - 4,
                    top,
                    width: boxW,
                    height: boxH,
                    fontSize: Math.max(10, boxH * 0.7),
                    lineHeight: 1,
                    padding: "1px",
                    zIndex: isFocused ? 50 : 10,
                  }}
                  className={`border rounded text-center font-sans shadow-sm outline-none transition-colors ${confBorder}`}
                />
              </div>
            );
          })}
      </div>

      {/* Character detail card — fixed overlay, shown when a character is focused */}
      {focusedChar && focusedChar.bbox && (() => {
        const PAD = 0.06;
        const CARD_IMG_W = 100;
        const CARD_IMG_H = 80;

        const bx0 = focusedChar.bbox[0].x;
        const by0 = focusedChar.bbox[0].y;
        const bx1 = focusedChar.bbox[1].x;
        const by2 = focusedChar.bbox[2].y;

        const rL = Math.max(0, bx0 - PAD);
        const rT = Math.max(0, by0 - PAD);
        const rR = Math.min(1, bx1 + PAD);
        const rB = Math.min(1, by2 + PAD);
        const rW = rR - rL || 0.1;
        const rH = rB - rT || 0.1;

        const iW = imgDims.w || 1;
        const iH = imgDims.h || 1;
        const scale = Math.min(CARD_IMG_W / (rW * iW), CARD_IMG_H / (rH * iH));
        const bgW = iW * scale;
        const bgH = iH * scale;
        const centerOffX = (CARD_IMG_W - rW * iW * scale) / 2;
        const centerOffY = (CARD_IMG_H - rH * iH * scale) / 2;
        const bgX = -rL * iW * scale + centerOffX;
        const bgY = -rT * iH * scale + centerOffY;

        // Character highlight position within the card image
        const hlL = (bx0 - rL) * iW * scale + centerOffX;
        const hlT = (by0 - rT) * iH * scale + centerOffY;
        const hlW = (bx1 - bx0) * iW * scale;
        const hlH = (by2 - by0) * iH * scale;

        const conf = focusedChar.confidence;
        const confPct = Math.round(conf * 100);
        const confColor =
          conf < 0.3
            ? "text-red-600 bg-red-50"
            : conf < 0.5
            ? "text-yellow-700 bg-yellow-50"
            : "text-emerald-700 bg-emerald-50";
        const barColor =
          conf < 0.3 ? "bg-red-400" : conf < 0.5 ? "bg-yellow-400" : "bg-emerald-400";

        const totalInCol =
          focusedColIdx >= 0 ? columns[focusedColIdx]?.chars.length : null;

        return (
          <div
            className="fixed z-[200] w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden select-none"
            style={{ left: cardPos?.x ?? 0, top: cardPos?.y ?? 0 }}
          >
            {/* Drag handle strip */}
            <div
              className="flex items-center justify-end px-2 py-1 bg-gray-50 border-b border-gray-100 cursor-grab active:cursor-grabbing"
              onMouseDown={handleCardMouseDown}
            >
              {/* Move icon — 4-way arrow */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="5 9 2 12 5 15"/>
                <polyline points="9 5 12 2 15 5"/>
                <polyline points="15 19 12 22 9 19"/>
                <polyline points="19 9 22 12 19 15"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <line x1="12" y1="2" x2="12" y2="22"/>
              </svg>
            </div>

            {/* Image preview (no longer the drag handle) */}
            <div
              className="relative bg-gray-100 overflow-hidden"
              style={{ width: CARD_IMG_W, height: CARD_IMG_H, margin: "0 auto" }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: `${bgW}px ${bgH}px`,
                  backgroundPosition: `${bgX}px ${bgY}px`,
                  backgroundRepeat: "no-repeat",
                }}
              />
              {/* Amber highlight box over the character */}
              <div
                style={{
                  position: "absolute",
                  left: hlL,
                  top: hlT,
                  width: hlW,
                  height: hlH,
                }}
                className="border-2 border-amber-400 bg-amber-300/30 rounded-sm shadow-[0_0_6px_2px_rgba(251,191,36,0.6)]"
              />
            </div>

            <div className="px-3 py-2.5 space-y-1.5">
              {/* Character display + confidence badge + delete */}
              <div className="flex items-center justify-between">
                <span className="text-3xl font-serif leading-none tracking-wide">
                  {focusedChar.text}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${confColor}`}>
                    {confPct}% conf
                  </span>
                  {deleteArmed ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { onDeleteChar(focusedChar.offset); setDeleteArmed(false); }}
                        className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                        style={{ pointerEvents: "auto" }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteArmed(false)}
                        className="px-1.5 py-0.5 text-[10px] rounded text-gray-500 hover:text-gray-700 transition-colors"
                        style={{ pointerEvents: "auto" }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteArmed(true)}
                      title="Delete character"
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      style={{ pointerEvents: "auto" }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Confidence bar */}
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${confPct}%` }}
                />
              </div>

              {/* Position info */}
              <div className="text-[10px] text-gray-500 space-y-0.5">
                {focusedColIdx >= 0 && (
                  <div>
                    <span className="font-medium text-gray-700">
                      {columns[focusedColIdx]?.isRow ? "Row" : "Column"}{" "}
                      {focusedColIdx + 1}
                    </span>
                    {focusedPosInCol !== null && totalInCol !== null && (
                      <span className="ml-1">
                        · position {focusedPosInCol} / {totalInCol}
                      </span>
                    )}
                  </div>
                )}
                <div className="font-mono">
                  bbox ({Math.round(bx0 * 1000) / 10}%,{" "}
                  {Math.round(by0 * 1000) / 10}%) →{" "}
                  ({Math.round(bx1 * 1000) / 10}%,{" "}
                  {Math.round(by2 * 1000) / 10}%)
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
