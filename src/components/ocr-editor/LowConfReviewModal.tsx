"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { SpatialCharacter } from "@/lib/ocr-store";
import type { Column } from "./useColumnDetection";

interface LowConfReviewModalProps {
  reviewQueue: SpatialCharacter[];
  columns: Column[];
  spatialData: SpatialCharacter[];
  imageUrl: string;
  onCharChange: (offset: number, newText: string) => void;
  onDeleteChar: (offset: number) => void;
  onFocusChar: (offset: number) => void;
  onSelectColumn: (index: number) => void;
  onClose: () => void;
}

export default function LowConfReviewModal({
  reviewQueue,
  columns,
  spatialData,
  imageUrl,
  onCharChange,
  onDeleteChar,
  onFocusChar,
  onSelectColumn,
  onClose,
}: LowConfReviewModalProps) {
  const [index, setIndex] = useState(0);
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = reviewQueue[index] ?? null;

  // Load image natural dimensions for crop rendering
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageUrl;
  }, [imageUrl]);

  // Focus input when navigating
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [index]);

  // Sync editor focus with current review item
  useEffect(() => {
    if (!current) return;
    onFocusChar(current.offset);
    const colIdx = columns.findIndex((col) =>
      col.chars.some((c) => c.offset === current.offset)
    );
    if (colIdx >= 0) onSelectColumn(colIdx);
  }, [current, columns, onFocusChar, onSelectColumn]);

  // Get context: surrounding characters in the same column
  const context = useMemo(() => {
    if (!current) return { before: "", after: "", colLabel: "" };
    const col = columns.find((c) => c.chars.some((ch) => ch.offset === current.offset));
    if (!col) return { before: "", after: "", colLabel: "?" };
    const chars = col.chars;
    const idx = chars.findIndex((c) => c.offset === current.offset);
    const before = chars.slice(Math.max(0, idx - 5), idx).map((c) => c.text).join("");
    const after = chars.slice(idx + 1, idx + 6).map((c) => c.text).join("");
    return { before, after, colLabel: `${col.isRow ? "Row" : "Col"} ${col.index + 1}` };
  }, [current, columns]);

  function goNext() {
    if (index < reviewQueue.length - 1) setIndex(index + 1);
    else onClose();
  }

  function goPrev() {
    if (index > 0) setIndex(index - 1);
  }

  function handleAcceptAlternative(alt: string) {
    if (!current) return;
    onCharChange(current.offset, alt);
    goNext();
  }

  function handleDelete() {
    if (!current) return;
    onDeleteChar(current.offset);
    // After deletion, the queue will update externally. Stay at same index
    // (which now points to next item) or close if empty.
    if (reviewQueue.length <= 1) onClose();
    else if (index >= reviewQueue.length - 1) setIndex(Math.max(0, index - 1));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowRight" || e.key === "Tab") { e.preventDefault(); goNext(); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); return; }
  }

  if (reviewQueue.length === 0) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-gray-500 mb-4">No low-confidence characters to review at this threshold.</p>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded bg-branding-black text-white hover:bg-gray-800">Close</button>
        </div>
      </div>
    );
  }

  if (!current || !current.bbox) {
    return null;
  }

  // Show loading overlay while image dimensions are loading
  if (!imgNatural) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Crop region around the character
  const PAD = 0.04;
  const bx0 = current.bbox![0].x;
  const by0 = current.bbox![0].y;
  const bx1 = current.bbox![2].x;
  const by1 = current.bbox![2].y;
  const rL = Math.max(0, bx0 - PAD);
  const rT = Math.max(0, by0 - PAD);
  const rR = Math.min(1, bx1 + PAD);
  const rB = Math.min(1, by1 + PAD);
  const rW = rR - rL || 0.1;
  const rH = rB - rT || 0.1;

  const CROP_W = 200;
  const CROP_H = 180;
  const scale = Math.min(CROP_W / (rW * imgNatural.w), CROP_H / (rH * imgNatural.h));
  const bgW = imgNatural.w * scale;
  const bgH = imgNatural.h * scale;
  const centerOffX = (CROP_W - rW * imgNatural.w * scale) / 2;
  const centerOffY = (CROP_H - rH * imgNatural.h * scale) / 2;
  const bgX = -rL * imgNatural.w * scale + centerOffX;
  const bgY = -rT * imgNatural.h * scale + centerOffY;

  const hlL = (bx0 - rL) * imgNatural.w * scale + centerOffX;
  const hlT = (by0 - rT) * imgNatural.h * scale + centerOffY;
  const hlW = (bx1 - bx0) * imgNatural.w * scale;
  const hlH = (by1 - by0) * imgNatural.h * scale;

  const conf = current.confidence;
  const confPct = Math.round(conf * 100);
  const confColor = conf < 0.3 ? "text-red-600" : conf < 0.5 ? "text-yellow-600" : "text-green-600";
  const barColor = conf < 0.3 ? "bg-red-400" : conf < 0.5 ? "bg-yellow-400" : "bg-green-400";

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[420px] max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Low Confidence Review
            </span>
            <span className="text-xs text-gray-400">
              {index + 1} / {reviewQueue.length}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-amber-400 transition-all duration-200"
            style={{ width: `${((index + 1) / reviewQueue.length) * 100}%` }}
          />
        </div>

        {/* Image crop */}
        <div className="flex justify-center py-3 bg-gray-50">
          <div
            className="relative bg-gray-200 rounded-lg overflow-hidden border border-gray-200"
            style={{ width: CROP_W, height: CROP_H }}
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
            <div
              style={{ position: "absolute", left: hlL, top: hlT, width: hlW, height: hlH }}
              className="border-2 border-amber-400 bg-amber-300/30 rounded-sm shadow-[0_0_6px_2px_rgba(251,191,36,0.6)]"
            />
          </div>
        </div>

        {/* Character info */}
        <div className="px-4 py-3 space-y-3">
          {/* Current char + confidence */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-4xl font-han-nom leading-none">{current.text}</span>
              <p className="text-[10px] text-gray-400 mt-1">{context.colLabel}</p>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${confColor}`}>{confPct}%</span>
                <span className="text-[10px] text-gray-400">confidence</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${confPct}%` }} />
              </div>
            </div>
          </div>

          {/* Context */}
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-gray-400 mb-1">Context</p>
            <p className="text-base font-han-nom">
              <span className="text-gray-400">{context.before}</span>
              <span className="bg-amber-200 text-amber-900 px-0.5 rounded">{current.text}</span>
              <span className="text-gray-400">{context.after}</span>
            </p>
          </div>

          {/* Edit input */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 w-10">Edit:</span>
            <input
              ref={inputRef}
              type="text"
              value={current.text}
              maxLength={4}
              onChange={(e) => onCharChange(current.offset, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); goNext(); }
              }}
              className="flex-1 px-2 py-1 text-lg font-han-nom text-center border border-gray-300 rounded focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Alternative candidates */}
          {current.choices && current.choices.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Alternatives</p>
              <div className="flex flex-wrap gap-1">
                {current.choices.map((alt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAcceptAlternative(alt)}
                    className="w-10 h-10 text-lg font-han-nom rounded border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="px-3 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              onClick={goNext}
              className="px-3 py-1.5 text-xs rounded bg-branding-black text-white hover:bg-gray-800"
            >
              {index >= reviewQueue.length - 1 ? "Done" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
