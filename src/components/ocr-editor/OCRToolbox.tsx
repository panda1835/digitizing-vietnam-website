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
  focusedOffset: number | null;
  onSuggestApply: (offset: number, suggestion: string) => void;
  spatialData: SpatialCharacter[];
  onFocusChar: (offset: number) => void;
  candidateData: SpatialCharacter[];
  onPromoteCandidate: (c: SpatialCharacter) => void;
  onDismissCandidate: (c: SpatialCharacter) => void;
  viewMode?: "charBox" | "column";
  onDeleteColumn?: (colIndex: number) => void;
  orphanedChars?: SpatialCharacter[];
  onDeleteOrphans?: () => void;
  onOpenLowConfReview?: (threshold: number) => void;
}

export default function OCRToolbox({
  columns,
  selectedColumnIndex,
  onSelectColumn,
  onDeleteChar,
  spatialDataLength,
  focusedOffset,
  onSuggestApply,
  spatialData,
  onFocusChar,
  candidateData,
  onPromoteCandidate,
  onDismissCandidate,
  viewMode = "charBox",
  onDeleteColumn,
  orphanedChars = [],
  onDeleteOrphans,
  onOpenLowConfReview,
}: OCRToolboxProps) {
  const [confThreshold, setConfThreshold] = useState(50);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [candIndex, setCandIndex] = useState(0);
  const [armedDeleteOffset, setArmedDeleteOffset] = useState<number | null>(null);

  // Get choices for the focused character directly from spatialData
  const focusedChoices = useMemo(() => {
    if (focusedOffset === null) return [];
    const char = spatialData.find((c) => c.offset === focusedOffset);
    return char?.choices ?? [];
  }, [spatialData, focusedOffset]);

  // Low-confidence review queue
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

  return (
    <div className="h-full overflow-y-auto p-3 flex flex-col gap-4 text-sm">
      {/* Column navigation */}
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

      {/* Column view: selected column info + delete */}
      {viewMode === "column" && selectedColumnIndex !== null && columns[selectedColumnIndex] && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Selected: {columns[selectedColumnIndex].isRow ? "Row" : "Column"} {selectedColumnIndex + 1}
          </p>
          <div className="text-xs text-gray-500 space-y-0.5 mb-2">
            <p>Characters: {columns[selectedColumnIndex].chars.length}</p>
            <p>Type: {columns[selectedColumnIndex].isRow ? "Horizontal row" : "Vertical column"}</p>
          </div>
          <button
            onClick={() => {
              if (window.confirm(`Delete column ${selectedColumnIndex + 1} with ${columns[selectedColumnIndex].chars.length} characters?`)) {
                onDeleteColumn?.(selectedColumnIndex);
              }
            }}
            className="w-full px-3 py-1.5 text-xs font-medium rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Delete Column ({columns[selectedColumnIndex].chars.length} chars)
          </button>
          <p className="text-[10px] text-gray-400 mt-1">
            Drag columns on the image to reposition. Draw on empty space to OCR a new region.
          </p>
        </div>
      )}

      {viewMode === "column" && (selectedColumnIndex === null || !columns[selectedColumnIndex]) && (
        <div className="text-xs text-gray-400 italic">
          Click a column on the image to select it. Drag to move. Drag edges to resize. Draw on empty space to add.
        </div>
      )}

      {/* Orphaned characters (column view) */}
      {viewMode === "column" && orphanedChars.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Orphaned Characters ({orphanedChars.length})
          </p>
          <p className="text-[10px] text-gray-400 mb-2">
            Characters not assigned to any column. Resize a column to claim them, or delete them.
          </p>
          <div className="flex flex-wrap gap-0.5 mb-2 text-sm font-serif bg-orange-50 border border-orange-200 rounded p-2">
            {orphanedChars.slice(0, 50).map((c, i) => (
              <span key={i} className="text-orange-700" title={`confidence: ${Math.round(c.confidence * 100)}%`}>
                {c.text}
              </span>
            ))}
            {orphanedChars.length > 50 && <span className="text-orange-400">…+{orphanedChars.length - 50}</span>}
          </div>
          <button
            onClick={onDeleteOrphans}
            className="w-full px-3 py-1.5 text-xs font-medium rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete All Orphans
          </button>
        </div>
      )}

      {/* Character box view tools */}
      {viewMode === "charBox" && selectedColumnIndex !== null && columns[selectedColumnIndex] && (
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

      {/* Stats (both modes) */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Stats</p>
        <div className="text-xs text-gray-500 space-y-0.5">
          <p>Characters with bbox: {spatialDataLength}</p>
          <p>Columns: {columns.length}</p>
        </div>
      </div>

      {/* Character-level tools (char box view only) */}
      {viewMode === "charBox" && <>
      {/* Alternative character suggestions from kandianguji choices */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Alternative Characters
        </p>
        {focusedOffset === null ? (
          <p className="text-[11px] text-gray-400 italic">Focus a character to see alternatives</p>
        ) : focusedChoices.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic">No alternatives available for this character</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {focusedChoices.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  onSuggestApply(focusedOffset, s);
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

            <button
              onClick={() => onOpenLowConfReview?.(confThreshold)}
              className="w-full mb-2 px-3 py-1.5 text-xs font-medium rounded bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            >
              Review All ({reviewQueue.length})
            </button>

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


      </>}

      {/* Keyboard shortcuts */}
      <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
        <p className="font-medium text-gray-500 mb-1">Keyboard</p>
        <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">Tab</kbd> Next char (wraps to next column)</p>
        <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">Shift+Tab</kbd> Previous char</p>
        <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">Enter</kbd> Next char</p>
        <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">Ctrl+←</kbd> Previous column</p>
        <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">Ctrl+→</kbd> Next column</p>
        <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">Esc</kbd> Deselect (draw mode)</p>
      </div>

    </div>
  );
}
