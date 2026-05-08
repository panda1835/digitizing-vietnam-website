"use client";

import { Fragment, useEffect, useRef, useMemo, useState } from "react";
import type { SpatialCharacter } from "@/lib/ocr-store";
import type { Column, LayoutMode } from "./useColumnDetection";
import { splitCommentarySides } from "./useColumnDetection";

// Font-size choices for the full-text view. Persisted in localStorage so
// the user's pick survives reload.
const FONT_SIZES = [20, 28, 36, 44, 56] as const;
const DEFAULT_FONT_SIZE = 20;

interface OCRTextPaneProps {
  spatialData: SpatialCharacter[];
  columns: Column[];
  layoutMode: LayoutMode;
  focusedOffset: number | null;
  onFocusChar: (offset: number) => void;
  onSelectColumn: (index: number) => void;
}

export default function OCRTextPane({
  spatialData,
  columns,
  layoutMode,
  focusedOffset,
  onFocusChar,
  onSelectColumn,
}: OCRTextPaneProps) {
  const spanRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_FONT_SIZE;
    const stored = window.localStorage.getItem("ocr-textpane-fontsize");
    const n = stored ? parseInt(stored, 10) : NaN;
    return Number.isFinite(n) && (FONT_SIZES as readonly number[]).includes(n)
      ? n
      : DEFAULT_FONT_SIZE;
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(
        "ocr-textpane-fontsize",
        String(fontSize)
      );
    } catch {
      // localStorage unavailable — silently ignore.
    }
  }, [fontSize]);

  // Scroll to focused character
  useEffect(() => {
    if (focusedOffset === null) return;
    const el = spanRefs.current.get(focusedOffset);
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focusedOffset]);

  // Build section type map for commentary detection
  const sectionTypeMap = useMemo(() => {
    const map = new Map<number, "main" | "commentary">();
    for (const col of columns) {
      for (const sec of col.sections) {
        for (const c of sec.chars) map.set(c.offset, sec.type);
      }
    }
    return map;
  }, [columns]);

  function renderChar(char: SpatialCharacter, i: number, keyPrefix = "") {
    if (!char.bbox) {
      return <span key={`${keyPrefix}${i}`}>{char.text === "\n" ? <br /> : char.text}</span>;
    }

    const isFocused = focusedOffset !== null && char.offset === focusedOffset;
    const conf = char.confidence;
    const isCommentary = sectionTypeMap.get(char.offset) === "commentary";

    const focusStyle = isFocused
      ? "bg-indigo-100 rounded-sm"
      : "";

    // Confidence colors deliberately picked from a different hue family
    // than commentary's amber so they're visually distinct.
    const confColor = conf < 0.3
      ? "text-red-600"
      : conf < 0.5
      ? "text-orange-500"
      : "";

    // Cells with a bbox but empty/whitespace text would render as an
    // invisible span and collapse the reading-flow layout. Show a faded
    // ▢ placeholder so the slot stays visible and clickable.
    const isBlank = !char.text || char.text.trim().length === 0;
    const display = isBlank ? "▢" : char.text;
    const blankStyle = isBlank ? "text-gray-300" : "";

    return (
      <span
        key={`${keyPrefix}${i}`}
        ref={(el) => {
          if (el) spanRefs.current.set(char.offset, el);
          else spanRefs.current.delete(char.offset);
        }}
        onClick={() => {
          const colIdx = columns.findIndex((c) =>
            c.chars.some((ch) => ch.offset === char.offset)
          );
          if (colIdx >= 0) onSelectColumn(colIdx);
          onFocusChar(char.offset);
        }}
        className={`cursor-pointer ${focusStyle} ${confColor} ${blankStyle} ${
          isCommentary ? "text-amber-800/80" : ""
        }`}
        title={
          isBlank
            ? `(empty cell) — confidence: ${Math.round(conf * 100)}%`
            : `${char.text} — confidence: ${Math.round(conf * 100)}%`
        }
      >
        {display}
      </span>
    );
  }

  // Structured column view matching reading mode styles
  if (columns.length > 0) {
    // Banxin columns (book title / volume / page-number metadata in the
    // central binding strip) interrupt the body reading flow. Hoist them
    // to a separate footer block so the main reading area stays clean.
    const bodyColumns = columns.filter((c) => c.kind !== "binding");
    const bindingColumns = columns.filter((c) => c.kind === "binding");

    // Group columns into X-bands. A band is a vertical strip of the
    // page that holds one woodblock column's content top-to-bottom — top
    // fragments, paired interlinear commentary, main body text, and
    // bottom commentary — all sharing the same X position. Within a band
    // everything flows inline as a continuous reading line; between
    // bands we break to a new block.
    const bands: Column[][] = [];
    for (const c of bodyColumns) {
      const cMid = (c.bbox.minX + c.bbox.maxX) / 2;
      let placed = false;
      for (const band of bands) {
        const overlapsBand = band.some((b) => {
          const bMid = (b.bbox.minX + b.bbox.maxX) / 2;
          return (
            (cMid >= b.bbox.minX && cMid <= b.bbox.maxX) ||
            (bMid >= c.bbox.minX && bMid <= c.bbox.maxX)
          );
        });
        if (overlapsBand) {
          band.push(c);
          placed = true;
          break;
        }
      }
      if (!placed) bands.push([c]);
    }
    // Transitively merge bands whose X-extents overlap. Initial placement
    // is order-dependent: e.g. col A at X[0.13, 0.17] and col B at
    // X[0.10, 0.13] don't directly overlap, but a later col C at X[0.10,
    // 0.15] would bridge them. After initial placement, walk pairs of
    // bands and merge whenever any member overlaps any member of another
    // band, to a fixed point.
    let merged = true;
    while (merged) {
      merged = false;
      outer: for (let i = 0; i < bands.length; i++) {
        for (let j = i + 1; j < bands.length; j++) {
          // Strict interior overlap (touching edges don't count). When two
          // adjacent cols' bboxes share an edge exactly (a.maxX === b.minX),
          // they are visually distinct columns and should stay in separate
          // bands; reading order then alternates band-by-band, which is
          // what the saved column order encodes.
          const overlaps = bands[i].some((a) =>
            bands[j].some(
              (b) => !(a.bbox.maxX <= b.bbox.minX || b.bbox.maxX <= a.bbox.minX)
            )
          );
          if (overlaps) {
            bands[i].push(...bands[j]);
            bands.splice(j, 1);
            merged = true;
            break outer;
          }
        }
      }
    }
    // Second merge pass: paired commentary halves with no main-text column
    // to bridge them. The X-overlap pass above can't see them — by
    // definition the halves sit side-by-side without overlapping. Merge
    // X-adjacent commentary-only bands when they Y-overlap and the gap
    // between their X-extents is at most one median char width.
    let mergedComm = true;
    while (mergedComm) {
      mergedComm = false;
      outerComm: for (let i = 0; i < bands.length; i++) {
        if (!bands[i].every((c) => (c.kind ?? "text") === "commentary")) continue;
        for (let j = i + 1; j < bands.length; j++) {
          if (!bands[j].every((c) => (c.kind ?? "text") === "commentary")) continue;
          const yOverlaps = bands[i].some((a) =>
            bands[j].some(
              (b) => !(a.bbox.maxY < b.bbox.minY || b.bbox.maxY < a.bbox.minY)
            )
          );
          if (!yOverlaps) continue;
          const iMin = Math.min(...bands[i].map((c) => c.bbox.minX));
          const iMax = Math.max(...bands[i].map((c) => c.bbox.maxX));
          const jMin = Math.min(...bands[j].map((c) => c.bbox.minX));
          const jMax = Math.max(...bands[j].map((c) => c.bbox.maxX));
          const gap =
            jMin > iMax ? jMin - iMax : iMin > jMax ? iMin - jMax : 0;
          const widths: number[] = [];
          for (const band of [bands[i], bands[j]]) {
            for (const col of band) {
              for (const ch of col.chars) {
                if (!ch.bbox) continue;
                const xs = ch.bbox.map((p) => p.x);
                widths.push(Math.max(...xs) - Math.min(...xs));
              }
            }
          }
          if (widths.length === 0) continue;
          widths.sort((a, b) => a - b);
          const medW = widths[Math.floor(widths.length / 2)];
          if (gap > medW) continue;
          bands[i].push(...bands[j]);
          bands.splice(j, 1);
          mergedComm = true;
          break outerComm;
        }
      }
    }
    // Sort bands RTL by max-cx and within each band sort cols top-to-bottom.
    bands.sort((a, b) => {
      const aMaxCx = Math.max(
        ...a.map((c) => (c.bbox.minX + c.bbox.maxX) / 2)
      );
      const bMaxCx = Math.max(
        ...b.map((c) => (c.bbox.minX + c.bbox.maxX) / 2)
      );
      return bMaxCx - aMaxCx;
    });
    for (const band of bands) {
      band.sort(
        (a, b) =>
          (a.bbox.minY + a.bbox.maxY) / 2 - (b.bbox.minY + b.bbox.maxY) / 2
      );
    }

    function renderBandBlock(band: Column[], bandIdx: number) {
      // Group cols into "rows" by Y-overlap. Within a row, multiple cols
      // are paired commentary halves (or co-located fragments). One row
      // contributes one inline content chunk; rows flow inline within
      // the band's block, so the entire band reads as one wrapping line.
      const rows: Column[][] = [];
      for (const c of band) {
        let placed = false;
        for (const row of rows) {
          const yOverlap = row.some(
            (r) =>
              !(c.bbox.maxY < r.bbox.minY || c.bbox.minY > r.bbox.maxY)
          );
          if (yOverlap) {
            row.push(c);
            placed = true;
            break;
          }
        }
        if (!placed) rows.push([c]);
      }

      const renderColChars = (col: Column, keyPrefix: string) => {
        const chars = col.chars.filter((c) => c.text.trim() || c.bbox);
        if (chars.length === 0) return null;
        const kind = col.kind ?? "text";
        if (kind === "commentary") {
          return (
            <span
              key={keyPrefix}
              className="text-amber-800/80"
              style={{ fontSize: `${fontSize * 0.75}px` }}
            >
              {chars.map((c, ci) => renderChar(c, ci, `${keyPrefix}-`))}
            </span>
          );
        }
        if (kind === "marginalia") {
          return (
            <span
              key={keyPrefix}
              className="text-slate-500"
              style={{ fontSize: `${fontSize * 0.75}px` }}
            >
              {chars.map((c, ci) => renderChar(c, ci, `${keyPrefix}-`))}
            </span>
          );
        }
        return (
          <span key={keyPrefix}>
            {chars.map((c, ci) => renderChar(c, ci, `${keyPrefix}-`))}
          </span>
        );
      };

      const renderRow = (row: Column[], ri: number) => {
        const rowKey = `b${bandIdx}-r${ri}`;
        // Paired commentary halves only when the row is purely commentary
        // and has 2+ cols → 双行夹注 reading: right sub-column top-to-
        // bottom in full, then left sub-column top-to-bottom.
        const allCommentary = row.every((c) => c.kind === "commentary");
        if (allCommentary && row.length >= 2) {
          const allChars = row.flatMap((c) =>
            c.chars.filter((c2) => c2.text.trim() || c2.bbox)
          );
          if (allChars.length === 0) return null;
          const split = splitCommentarySides(allChars);
          const ordered: SpatialCharacter[] = split
            ? [
                ...split.pairs
                  .map((p) => p.right)
                  .filter((x): x is SpatialCharacter => !!x),
                ...split.pairs
                  .map((p) => p.left)
                  .filter((x): x is SpatialCharacter => !!x),
              ]
            : allChars;
          return (
            <span
              key={rowKey}
              className="text-amber-800/80"
              style={{ fontSize: `${fontSize * 0.75}px` }}
            >
              {ordered.map((c, ci) => renderChar(c, ci, `${rowKey}-`))}
            </span>
          );
        }
        // Otherwise render each col separately so mixed-kind rows don't
        // collapse commentary chars into main-size text. Order RTL by
        // col centerX so right-most col reads first.
        const sortedRow = [...row].sort((a, b) => {
          const ax = (a.bbox.minX + a.bbox.maxX) / 2;
          const bx = (b.bbox.minX + b.bbox.maxX) / 2;
          return bx - ax;
        });
        return (
          <Fragment key={rowKey}>
            {sortedRow.map((col, ci) =>
              renderColChars(col, `${rowKey}-c${ci}`)
            )}
          </Fragment>
        );
      };

      return (
        <div
          key={`band-${bandIdx}`}
          className="font-han-nom text-branding-black font-light"
        >
          {rows.map(renderRow)}
        </div>
      );
    }

    function renderColumnBlock(col: Column) {
      return (
        <div
          key={col.index}
          className="font-han-nom text-branding-black font-light"
        >
          {col.sections.map((sec, si) => {
            const chars = sec.chars.filter((c) => c.text.trim() || c.bbox);
            if (chars.length === 0) return null;

            if (sec.type === "commentary") {
              const split =
                layoutMode === "commentary"
                  ? splitCommentarySides(sec.chars)
                  : null;

              if (split) {
                // Double-line interlinear annotation (双行夹注): render
                // as two stacked horizontal rows — right sub-column on
                // top (read first), left sub-column below — paired by
                // Y so each column of the original woodblock aligns.
                return (
                  <span
                    key={si}
                    className="text-amber-800/80 align-middle"
                    style={{
                      display: "inline-flex",
                      flexDirection: "column",
                      fontSize: `${fontSize * 0.75}px`,
                      lineHeight: 1.05,
                      verticalAlign: "middle",
                      marginInline: "2px",
                    }}
                  >
                    <span style={{ display: "flex", flexDirection: "row" }}>
                      {split.pairs.map((p, pi) =>
                        p.right ? (
                          renderChar(p.right, pi, `${col.index}-${si}-r-`)
                        ) : (
                          <span key={`r-pad-${pi}`}>&nbsp;</span>
                        )
                      )}
                    </span>
                    <span style={{ display: "flex", flexDirection: "row" }}>
                      {split.pairs.map((p, pi) =>
                        p.left ? (
                          renderChar(p.left, pi, `${col.index}-${si}-l-`)
                        ) : (
                          <span key={`l-pad-${pi}`}>&nbsp;</span>
                        )
                      )}
                    </span>
                  </span>
                );
              }

              return (
                <span
                  key={si}
                  className="text-amber-800/80"
                  style={{ fontSize: `${fontSize * 0.75}px` }}
                >
                  {chars.map((c, ci) => renderChar(c, ci, `${col.index}-${si}-`))}
                </span>
              );
            }
            return (
              <span key={si}>
                {chars.map((c, ci) => renderChar(c, ci, `${col.index}-${si}-`))}
              </span>
            );
          })}
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto p-5 select-text">
        <FontSizeToggle value={fontSize} onChange={setFontSize} />
        <div style={{ fontSize: `${fontSize}px`, lineHeight: 1.15 }}>
          {bands.map((band, bi) => renderBandBlock(band, bi))}
        </div>
        {bindingColumns.length > 0 && (
          <div className="mt-6 pt-3 border-t border-gray-200">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 mb-1">
              Binding (banxin)
            </div>
            <div
              className="space-y-0 text-amber-900/80"
              style={{ fontSize: "16px", lineHeight: 1.2 }}
            >
              {bindingColumns.map(renderColumnBlock)}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback: flat rendering
  return (
    <div className="h-full overflow-y-auto p-5 select-text">
      <FontSizeToggle value={fontSize} onChange={setFontSize} />
      <div
        className="font-han-nom text-branding-black font-light break-all"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.15 }}
      >
        {spatialData.map((char, i) => renderChar(char, i))}
      </div>
    </div>
  );
}

function FontSizeToggle({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 mb-2 text-[11px] text-gray-500">
      <span className="mr-1">size</span>
      {FONT_SIZES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`px-1.5 py-0.5 rounded ${
            s === value
              ? "bg-gray-800 text-white"
              : "text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
          title={`${s}px`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
