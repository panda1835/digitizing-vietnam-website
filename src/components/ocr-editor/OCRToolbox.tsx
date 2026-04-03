"use client";

import { useState } from "react";
import type { Column } from "./useColumnDetection";

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
}: OCRToolboxProps) {
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestError, setSuggestError] = useState<string | null>(null);

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
              <span
                key={c.offset}
                className="group relative cursor-pointer hover:bg-red-100 rounded px-0.5 transition-colors"
                title={`Click to delete "${c.text}"`}
                onClick={() => onDeleteChar(c.offset)}
              >
                {c.text}
                <span className="absolute -top-1 -right-1 hidden group-hover:block text-[8px] bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center leading-none">×</span>
              </span>
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
