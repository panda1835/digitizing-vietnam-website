"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { Column } from "./useColumnDetection";
import type { SpatialCharacter } from "@/lib/ocr-store";

const IDS_OPERATORS: Array<{ char: string; label: string; example?: string }> = [
  { char: "⿰", label: "Left + right", example: "⿰木目" },
  { char: "⿱", label: "Top + bottom", example: "⿱日月" },
  { char: "⿲", label: "Left + middle + right", example: "⿲彳言寸" },
  { char: "⿳", label: "Top + middle + bottom", example: "⿳亠口小" },
  { char: "⿴", label: "Full surround", example: "⿴囗玉" },
  { char: "⿵", label: "Surround from above", example: "⿵冂人" },
  { char: "⿶", label: "Surround from below", example: "⿶凵口" },
  { char: "⿷", label: "Surround from left", example: "⿷匚口" },
  { char: "⿸", label: "Surround from upper-left", example: "⿸厂口" },
  { char: "⿹", label: "Surround from upper-right", example: "⿹勹口" },
  { char: "⿺", label: "Surround from lower-left", example: "⿺辶口" },
  { char: "⿻", label: "Overlaid", example: "⿻十口" },
  { char: "⿼", label: "Surround from right (Unicode 13.0)" },
  { char: "⿽", label: "Surround from lower-right (Unicode 13.0)" },
  { char: "⿾", label: "Horizontal reflection (Unicode 13.0)" },
  { char: "⿿", label: "Rotation (Unicode 13.0)" },
];

interface OCRToolboxProps {
  columns: Column[];
  selectedColumnIndex: number | null;
  onSelectColumn: (index: number) => void;
  onDeleteChar: (offset: number) => void;
  spatialDataLength: number;
  focusedOffset: number | null;
  onSuggestApply: (offset: number, suggestion: string) => void;
  /**
   * Patch arbitrary non-text fields on a single char (uncertain, ids,
   * note). Used by the Labeler metadata panel.
   */
  onCharFieldsChange: (offset: number, patch: Partial<SpatialCharacter>) => void;
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
  onCharFieldsChange,
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

  // Focused char's labeler metadata. Local state so the user can type
  // freely; commit on blur via onCharFieldsChange. Sync back from
  // spatialData when the focused char changes (or its underlying
  // values change due to an out-of-band edit).
  const focusedChar = useMemo(
    () =>
      focusedOffset === null
        ? null
        : spatialData.find((c) => c.offset === focusedOffset) ?? null,
    [spatialData, focusedOffset]
  );
  const [idsDraft, setIdsDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const idsInputRef = useRef<HTMLInputElement>(null);

  function insertIdsOperator(op: string) {
    const input = idsInputRef.current;
    const start = input?.selectionStart ?? idsDraft.length;
    const end = input?.selectionEnd ?? idsDraft.length;
    const next = idsDraft.slice(0, start) + op + idsDraft.slice(end);
    setIdsDraft(next);
    requestAnimationFrame(() => {
      input?.focus();
      const caret = start + op.length;
      input?.setSelectionRange(caret, caret);
    });
  }
  useEffect(() => {
    setIdsDraft(focusedChar?.ids ?? "");
    setNoteDraft(focusedChar?.note ?? "");
  }, [focusedOffset, focusedChar?.ids, focusedChar?.note]);

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

  const lookupChar =
    focusedChar?.text && focusedChar.text.trim() ? focusedChar.text : null;

  return (
    <div className="h-full overflow-y-auto p-3 flex flex-col gap-4 text-sm">
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
          <div className="flex flex-wrap gap-0.5 mb-2 text-sm font-han-nom bg-orange-50 border border-orange-200 rounded p-2">
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
                  <span className="font-han-nom">{c.text}</span>
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

      {/* Character-level tools (char box view only) */}
      {viewMode === "charBox" && <>
      {/* Alternate candidate suggestions from OCR choices */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Alternate Candidates
        </p>
        {focusedOffset === null ? (
          <p className="text-[11px] text-gray-400 italic">Focus a character to see candidates</p>
        ) : focusedChoices.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic">No candidates available for this character</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {focusedChoices.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  onSuggestApply(focusedOffset, s);
                }}
                title={i < 9 ? `Press ${i + 1} to apply` : undefined}
                className="relative px-2 py-1 text-base rounded border border-gray-300 hover:bg-indigo-50 hover:border-indigo-400"
              >
                {i < 9 && (
                  <span className="absolute -top-1.5 -left-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] font-semibold rounded-full bg-indigo-500 text-white leading-none">
                    {i + 1}
                  </span>
                )}
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* External dictionary lookup for the focused char */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Lookup
          {lookupChar && (
            <span className="ml-1 font-han-nom text-base text-gray-700 normal-case">
              {lookupChar}
            </span>
          )}
        </p>
        {lookupChar ? (
          <div className="flex flex-col gap-1">
            <a
              href={`https://nomnaviet.com/search?q=${encodeURIComponent(lookupChar)}&tab=search`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1.5 text-xs text-center rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              Nôm Na Việt ↗
            </a>
            <a
              href={`https://www.digitizingvietnam.com/en/tools/han-nom-dictionaries/general?q=${encodeURIComponent(lookupChar)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1.5 text-xs text-center rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              DigitizingVN Hán-Nôm Dictionaries ↗
            </a>
            <a
              href={`https://zi.tools/zi/${encodeURIComponent(lookupChar)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1.5 text-xs text-center rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              zi.tools ↗
            </a>
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 italic">
            Focus a character to enable lookup
          </p>
        )}
      </div>

      {/* Labeler metadata for the focused char */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Labeler Metadata
        </p>
        {focusedChar === null ? (
          <p className="text-[11px] text-gray-400 italic">Focus a character to flag / annotate</p>
        ) : (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!focusedChar.uncertain}
                onChange={(e) =>
                  onCharFieldsChange(focusedChar.offset, {
                    uncertain: e.target.checked,
                  })
                }
              />
              <span>
                Uncertain
                <span className="text-gray-400 ml-1">
                  (or press <kbd className="px-1 rounded border border-gray-300 bg-gray-50 text-[10px] font-mono">`</kbd>)
                </span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!focusedChar.noReadingForm}
                onChange={(e) =>
                  onCharFieldsChange(focusedChar.offset, {
                    noReadingForm: e.target.checked,
                  })
                }
              />
              <span>
                No reading form
                <span className="text-gray-400 ml-1">
                  (glyph→reading mapping unknown — surfaces on{" "}
                  <a
                    href="/unmapped"
                    className="text-indigo-600 hover:underline"
                  >
                    /unmapped
                  </a>
                  )
                </span>
              </span>
            </label>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                IDS
                <span className="ml-1 text-gray-400 normal-case tracking-normal">
                  (for unencoded chars, e.g., ⿰口巴)
                </span>
              </label>
              <div className="flex flex-wrap gap-0.5 mb-1">
                {IDS_OPERATORS.map((op) => (
                  <button
                    key={op.char}
                    type="button"
                    onClick={() => insertIdsOperator(op.char)}
                    title={`${op.label}${op.example ? ` — ${op.example}` : ""}`}
                    className="px-1.5 py-0.5 text-base font-han-nom border border-gray-300 rounded hover:bg-indigo-50 hover:border-indigo-400 leading-none"
                  >
                    {op.char}
                  </button>
                ))}
              </div>
              <input
                ref={idsInputRef}
                type="text"
                value={idsDraft}
                onChange={(e) => setIdsDraft(e.target.value)}
                onBlur={() => {
                  if ((focusedChar.ids ?? "") !== idsDraft) {
                    onCharFieldsChange(focusedChar.offset, {
                      ids: idsDraft || undefined,
                    });
                  }
                }}
                placeholder="Pick a structure above, then type components"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-indigo-400 font-han-nom"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                Note
              </label>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                onBlur={() => {
                  if ((focusedChar.note ?? "") !== noteDraft) {
                    onCharFieldsChange(focusedChar.offset, {
                      note: noteDraft || undefined,
                    });
                  }
                }}
                placeholder="Free-form labeler note…"
                rows={2}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-indigo-400 resize-y"
              />
            </div>
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
                    <span className="font-han-nom text-base leading-none">{char.text}</span>
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
