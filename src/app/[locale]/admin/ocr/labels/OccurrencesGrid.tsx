"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import RelabelCell from "./RelabelCell";
import BulkRelabel from "./BulkRelabel";
import MetadataEditPopover from "./MetadataEditPopover";
import CharCrop from "@/components/ocr-editor/CharCrop";

export interface OccurrenceVM {
  slug: string;
  page: number;
  offset: number;
  text: string;
  bbox: Array<{ x: number; y: number }> | null;
  confidence: number;
  uncertain: boolean;
  noReadingForm: boolean;
  ids: string;
  note: string;
  column: number | null;
  title: string;
}

interface OccurrencesGridProps {
  locale: string;
  query: string;
  occurrences: OccurrenceVM[];
  /** Pre-populates BulkRelabel's "new label" input. Wired from
   *  ?prefill=… so the sidebar can deep-link a from/to pair. */
  prefill?: string;
}

function keyOf(o: { slug: string; page: number; offset: number }) {
  return `${o.slug}|${o.page}|${o.offset}`;
}

export default function OccurrencesGrid({
  locale,
  query,
  occurrences,
  prefill,
}: OccurrencesGridProps) {
  // Default: every occurrence selected. User can opt-out per-cell or use
  // Select all / Deselect all for bulk toggling.
  const allKeys = useMemo(() => occurrences.map(keyOf), [occurrences]);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(allKeys)
  );

  function toggle(k: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }
  function selectAll() {
    setSelected(new Set(allKeys));
  }
  function deselectAll() {
    setSelected(new Set());
  }

  const selectedTargets = useMemo(
    () =>
      occurrences
        .filter((o) => selected.has(keyOf(o)))
        .map((o) => ({ slug: o.slug, page: o.page, offset: o.offset })),
    [occurrences, selected]
  );

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        <span className="font-han-nom text-base text-gray-800">{query}</span> ·{" "}
        {occurrences.length} occurrence
        {occurrences.length === 1 ? "" : "s"} · {selected.size} selected
      </p>

      <div className="mb-3 flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={selectAll}
          disabled={selected.size === occurrences.length}
          className="px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={deselectAll}
          disabled={selected.size === 0}
          className="px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40"
        >
          Deselect all
        </button>
      </div>

      <BulkRelabel query={query} targets={selectedTargets} prefill={prefill} />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {occurrences.map((o) => {
          const k = keyOf(o);
          const isSelected = selected.has(k);
          return (
            <div
              key={k}
              className={`border rounded-lg p-2 bg-white relative ${
                !isSelected
                  ? "border-gray-200 opacity-50"
                  : o.uncertain
                  ? "border-yellow-400"
                  : "border-gray-200"
              }`}
            >
              <label
                className="absolute top-1.5 left-1.5 z-10 flex items-center bg-white/90 rounded px-1 py-0.5 cursor-pointer"
                title={isSelected ? "Deselect" : "Select"}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(k)}
                  className="cursor-pointer"
                />
              </label>
              {/* Tiny dedicated open-in-editor link. The card body itself
                  is not clickable so the user can interact with the inline
                  relabel input without accidentally navigating. */}
              <Link
                href={`/${locale}/admin/ocr/edit/${encodeURIComponent(
                  o.slug
                )}/${o.page}`}
                title={`Open ${o.title} · page ${o.page}${
                  o.column !== null ? ` · column ${o.column}` : ""
                } · offset ${o.offset} · conf ${Math.round(
                  o.confidence * 100
                )}%${o.uncertain ? " · uncertain" : ""}`}
                className="absolute top-1.5 right-1.5 z-10 inline-flex items-center justify-center w-6 h-6 rounded bg-white/90 border border-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300"
                aria-label="Open this page in editor"
              >
                ↗
              </Link>
              <div>
                <CharCrop slug={o.slug} page={o.page} bbox={o.bbox} />
                <div className="text-[10px] text-gray-500 mt-1 truncate">
                  {o.title}
                </div>
                <div className="text-[10px] text-gray-400">
                  p{o.page}
                  {o.column !== null ? ` · c${o.column}` : ""} ·{" "}
                  {Math.round(o.confidence * 100)}%
                </div>
              </div>
              {o.ids && (
                <div
                  className="text-[10px] text-gray-500 mt-1 font-han-nom truncate"
                  title={`IDS: ${o.ids}`}
                >
                  IDS: {o.ids}
                </div>
              )}
              <div className="mt-2">
                <RelabelCell
                  slug={o.slug}
                  page={o.page}
                  offset={o.offset}
                  initialText={o.text}
                />
              </div>
              <MetadataEditPopover
                slug={o.slug}
                page={o.page}
                offset={o.offset}
                initialUncertain={o.uncertain}
                initialNoReadingForm={o.noReadingForm}
                initialIds={o.ids}
                initialNote={o.note}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
