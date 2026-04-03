"use client";

import { useState, useMemo } from "react";
import type { Column } from "./useColumnDetection";
import type { SpatialCharacter } from "@/lib/ocr-store";

interface OCRToolboxProps {
  columns: Column[];
  selectedColumnIndex: number | null;
  onSelectColumn: (index: number) => void;
  onDeleteChar: (offset: number) => void;
  spatialDataLength: number;
  rawText: string;
  slug: string;
  page: number;
  focusedOffset: number | null;
  onSuggestApply: (offset: number, suggestion: string) => void;
  spatialData: SpatialCharacter[];
  onFocusChar: (offset: number) => void;
  candidateData: SpatialCharacter[];
  onPromoteCandidate: (c: SpatialCharacter) => void;
  onDismissCandidate: (c: SpatialCharacter) => void;
}

export default function OCRToolbox({
  columns,
  selectedColumnIndex,
  onSelectColumn,
  onDeleteChar,
  spatialDataLength,
  rawText,
  slug,
  page,
  focusedOffset,
  onSuggestApply,
  spatialData,
  onFocusChar,
  candidateData,
  onPromoteCandidate,
  onDismissCandidate,
}: OCRToolboxProps) {
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [confThreshold, setConfThreshold] = useState(50);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [candIndex, setCandIndex] = useState(0);
  const [armedDeleteOffset, setArmedDeleteOffset] = useState<number | null>(null);

  // Compute median character dimensions from all bbox chars
  const { medianW, medianH } = useMemo(() => {
    const bboxChars = spatialData.filter((c) => c.bbox);
    if (bboxChars.length === 0) return { medianW: 0, medianH: 0 };
    const ws = bboxChars
      .map((c) => Math.abs(c.bbox![1].x - c.bbox![0].x))
      .sort((a, b) => a - b);
    const hs = bboxChars
      .map((c) => Math.abs(c.bbox![2].y - c.bbox![0].y))
      .sort((a, b) => a - b);
    const mid = Math.floor(ws.length / 2);
    return { medianW: ws[mid], medianH: hs[mid] };
  }, [spatialData]);

  // Low-confidence review queue: all bbox chars below the threshold, no size filter
  // (size filtering only applies to candidateData — excluded detections)
  const reviewQueue = useMemo(() => {
    return spatialData.filter((c) => c.bbox && c.confidence < confThreshold / 100);
  }, [spatialData, confThreshold]);

  function navigateReview(idx: number) {
    const clamped = Math.max(0, Math.min(reviewQueue.length - 1, idx));
    setReviewIndex(clamped);
    const char = reviewQueue[clamped];
    if (!char) return;
    const colIdx = columns.findIndex((col) =>
      col.chars.some((c) => c.offset === char.offset)
    );
    if (colIdx >= 0) onSelectColumn(colIdx);
    onFocusChar(char.offset);
  }

  async function handleSuggest() {
    if (focusedOffset === null) return;
    setSuggesting(true);
    setSuggestions([]);
    setSuggestError(null);
    try {
      const res = await fetch("/api/ocr/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offset: focusedOffset, slug, page }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch (e: any) {
      setSuggestError(e.message);
    } finally {
      setSuggesting(false);
    }
  }

  function handleDownload() {
    const blob = new Blob([rawText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}_page_${page}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-full overflow-y-auto p-3 flex flex-col gap-4 text-sm">
      {/* Column navigation — number buttons */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Columns ({columns.length})
        </p>
        <div className="flex flex-wrap gap-1">
          {columns.map((col) => (
            <button
              key={col.index}
              onClick={() => onSelectColumn(col.index)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                selectedColumnIndex === col.index
                  ? "bg-red-500 text-white border-red-500"
                  : col.isRow
                  ? "bg-white text-emerald-700 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50"
                  : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
              }`}
              title={col.isRow ? `Row ${col.index + 1}` : `Column ${col.index + 1}`}
            >
              {col.isRow ? "R" : ""}{col.index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Selected column text — click a char to delete */}
      {selectedColumnIndex !== null && columns[selectedColumnIndex] && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Column {selectedColumnIndex + 1} ({columns[selectedColumnIndex].chars.length} chars)
          </p>
          <div className="text-sm bg-indigo-50 border border-indigo-200 rounded p-2 break-all flex flex-wrap gap-0.5">
            {columns[selectedColumnIndex].chars.map((c) => (
              armedDeleteOffset === c.offset ? (
                <span key={c.offset} className="flex items-center gap-0.5 bg-red-50 border border-red-200 rounded px-1 py-0.5">
                  <span className="font-serif">{c.text}</span>
                  <button
                    onClick={() => { onDeleteChar(c.offset); setArmedDeleteOffset(null); }}
                    className="text-[9px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded px-1 leading-tight"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setArmedDeleteOffset(null)}
                    className="text-[9px] text-gray-400 hover:text-gray-600 leading-tight"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <span
                  key={c.offset}
                  className="group relative cursor-pointer hover:bg-red-100 rounded px-0.5 transition-colors"
                  title={`Click to delete "${c.text}"`}
                  onClick={() => setArmedDeleteOffset(c.offset)}
                >
                  {c.text}
                  <span className="absolute -top-1 -right-1 hidden group-hover:block text-[8px] bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center leading-none">×</span>
                </span>
              )
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Stats</p>
        <div className="text-xs text-gray-500 space-y-0.5">
          <p>Characters with bbox: {spatialDataLength}</p>
          <p>Columns: {columns.length}</p>
        </div>
      </div>

      {/* Gemini suggestions */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Suggest alternatives
        </p>
        <button
          onClick={handleSuggest}
          disabled={suggesting || focusedOffset === null}
          className="w-full px-3 py-1.5 text-xs rounded border border-indigo-300 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
        >
          {suggesting
            ? "Asking Gemini…"
            : focusedOffset === null
            ? "Focus a character first"
            : "Suggest for focused char"}
        </button>
        {suggestError && (
          <p className="text-xs text-red-500 mt-1">{suggestError}</p>
        )}
        {suggestions.length > 0 && focusedOffset !== null && (
          <div className="mt-2 flex flex-wrap gap-1">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  onSuggestApply(focusedOffset, s);
                  setSuggestions([]);
                }}
                className="px-2 py-1 text-base rounded border border-gray-300 hover:bg-indigo-50 hover:border-indigo-400"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Low confidence review queue */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Low Confidence Review
        </p>

        {/* Threshold slider */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-gray-400 w-16 shrink-0">
            &lt;{confThreshold}% conf
          </span>
          <input
            type="range"
            min={10}
            max={80}
            step={5}
            value={confThreshold}
            onChange={(e) => { setConfThreshold(Number(e.target.value)); setReviewIndex(0); }}
            className="flex-1 accent-amber-500"
          />
        </div>

        {reviewQueue.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic">
            No characters match this threshold with typical character sizes.
          </p>
        ) : (
          <>
            {/* Prev / Next navigation */}
            <div className="flex items-center gap-1 mb-2">
              <button
                onClick={() => navigateReview(reviewIndex - 1)}
                disabled={reviewIndex === 0}
                className="px-2 py-1 text-[11px] rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="flex-1 text-center text-[11px] text-gray-500">
                {reviewIndex + 1} / {reviewQueue.length}
              </span>
              <button
                onClick={() => navigateReview(reviewIndex + 1)}
                disabled={reviewIndex >= reviewQueue.length - 1}
                className="px-2 py-1 text-[11px] rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-30"
              >
                Next →
              </button>
            </div>

            {/* Scrollable list */}
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {reviewQueue.map((char, i) => {
                const conf = Math.round(char.confidence * 100);
                const isCurrent = i === reviewIndex;
                const confColor =
                  char.confidence < 0.3
                    ? "text-red-600"
                    : "text-yellow-600";
                return (
                  <button
                    key={char.offset}
                    onClick={() => navigateReview(i)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-left text-[11px] transition-colors ${
                      isCurrent
                        ? "bg-amber-100 border border-amber-300"
                        : "hover:bg-gray-100 border border-transparent"
                    }`}
                  >
                    <span className="font-serif text-base leading-none">{char.text}</span>
                    <span className={`font-medium ${confColor}`}>{conf}%</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Excluded OCR detections (candidates) */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Excluded Detections
        </p>
        <p className="text-[10px] text-gray-400 mb-2">
          Characters the OCR found but filtered out — review and add any that are real.
        </p>

        {candidateData.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic">
            {candidateData.length === 0
              ? "None — re-run OCR to collect excluded detections."
              : "All reviewed."}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-1 mb-2">
              <button
                onClick={() => setCandIndex((i) => Math.max(0, i - 1))}
                disabled={candIndex === 0}
                className="px-2 py-1 text-[11px] rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="flex-1 text-center text-[11px] text-gray-500">
                {candIndex + 1} / {candidateData.length}
              </span>
              <button
                onClick={() => setCandIndex((i) => Math.min(candidateData.length - 1, i + 1))}
                disabled={candIndex >= candidateData.length - 1}
                className="px-2 py-1 text-[11px] rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-30"
              >
                Next →
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {candidateData.map((char, i) => {
                const conf = Math.round(char.confidence * 100);
                const isCurrent = i === candIndex;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-2 py-1 rounded text-[11px] transition-colors ${
                      isCurrent
                        ? "bg-orange-50 border border-orange-300"
                        : "border border-transparent"
                    }`}
                  >
                    <span className="font-serif text-base leading-none">{char.text}</span>
                    <span className="text-gray-400 mx-1">{conf}%</span>
                    <button
                      onClick={() => {
                        onPromoteCandidate(char);
                        setCandIndex((prev) => Math.min(prev, candidateData.length - 2));
                      }}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200"
                    >
                      + Add
                    </button>
                    <button
                      onClick={() => {
                        onDismissCandidate(char);
                        setCandIndex((prev) => Math.min(prev, candidateData.length - 2));
                      }}
                      className="ml-1 px-1.5 py-0.5 text-[10px] rounded text-gray-400 hover:text-red-500 border border-transparent hover:border-red-200"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Keyboard shortcuts */}
      <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
        <p className="font-medium text-gray-500 mb-1">Keyboard</p>
        <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">Tab</kbd> Next char / column</p>
        <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">Shift+Tab</kbd> Previous char / column</p>
        <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">Enter</kbd> Next char / column</p>
        <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">← →</kbd> Prev / next column</p>
        <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">↑ ↓</kbd> Prev / next character</p>
        <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">Esc</kbd> Deselect (draw mode)</p>
      </div>

      {/* Download */}
      <div className="mt-auto pt-2 border-t border-gray-100">
        <button
          onClick={handleDownload}
          className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
        >
          Download page text (.txt)
        </button>
      </div>
    </div>
  );
}
