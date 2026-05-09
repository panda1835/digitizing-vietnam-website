"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  ConfirmedColumn,
  ColumnKind,
  SpatialCharacter,
} from "@/lib/ocr-store";
import { splitColumnByYGaps } from "./useColumnDetection";

type Bbox = ConfirmedColumn["bbox"];

const KINDS: ColumnKind[] = ["text", "binding", "marginalia", "commentary"];

const KIND_GLYPH: Record<ColumnKind, string> = {
  text: "T",
  binding: "B",
  marginalia: "M",
  commentary: "C",
};

const KIND_LABEL: Record<ColumnKind, string> = {
  text: "Body text",
  binding: "Binding strip (banxin)",
  marginalia: "Marginalia / off-text",
  commentary: "Interlinear commentary",
};

// Tailwind classes for the on-image overlay border + tinted fill, by kind.
// Selected state overrides this in the render path.
const KIND_OVERLAY: Record<ColumnKind, string> = {
  text: "border-indigo-400 bg-indigo-400/10 hover:bg-indigo-400/20",
  binding: "border-amber-500 bg-amber-500/10 hover:bg-amber-500/20",
  marginalia: "border-slate-500 bg-slate-500/10 hover:bg-slate-500/20",
  commentary: "border-sky-500 bg-sky-500/10 hover:bg-sky-500/20",
};

const KIND_BADGE: Record<ColumnKind, string> = {
  text: "bg-indigo-500 text-white",
  binding: "bg-amber-500 text-white",
  marginalia: "bg-slate-500 text-white",
  commentary: "bg-sky-500 text-white",
};

function getKind(col: ConfirmedColumn): ColumnKind {
  return col.kind ?? "text";
}

/**
 * Walk the existing reading order and return the index where a freshly
 * drawn column should slot in. Han-Nôm convention: right-to-left
 * across X-bands (descending X-center), then top-to-bottom within an
 * X-band (where "same band" = the bboxes overlap on the X axis).
 *
 * Assumes the existing array is already in correct reading order — i.e.,
 * the user confirmed it or auto-detect produced it. The first existing
 * column that the new one should come *before* is the insertion point;
 * if no such column is found we append at the end.
 *
 * Edge cases (skewed existing order, columns with weird overlaps)
 * degrade to "best effort" — the user can always drag-reorder.
 */
function findReadingOrderInsertIndex(
  newCol: ConfirmedColumn,
  existing: ConfirmedColumn[]
): number {
  if (existing.length === 0) return 0;
  const newCx = (newCol.bbox.minX + newCol.bbox.maxX) / 2;
  const newCy = (newCol.bbox.minY + newCol.bbox.maxY) / 2;
  for (let i = 0; i < existing.length; i++) {
    const e = existing[i];
    const eCx = (e.bbox.minX + e.bbox.maxX) / 2;
    const eCy = (e.bbox.minY + e.bbox.maxY) / 2;
    const sameBand = !(
      newCol.bbox.maxX < e.bbox.minX || newCol.bbox.minX > e.bbox.maxX
    );
    if (sameBand) {
      // Overlapping X-band → top-to-bottom by Y-center.
      if (newCy < eCy) return i;
    } else {
      // Different bands → RTL by X-center.
      if (newCx > eCx) return i;
    }
  }
  return existing.length;
}

interface Props {
  imageUrl: string;
  columns: ConfirmedColumn[];
  onChange: (next: ConfirmedColumn[]) => void;
  /**
   * Optional auto-detected starting columns. Shown via a one-click
   * "Use auto-detected" prompt when the persisted columns list is empty.
   */
  autoDetected?: ConfirmedColumn[];
  charCounts?: number[];
  /**
   * Page chars. Required for the per-row "Split" action that finds
   * Y-gaps inside a column and breaks it into multiple sub-columns.
   * Optional so the component still renders when chars haven't been
   * OCR'd yet (Split button is hidden in that case).
   */
  spatialData?: SpatialCharacter[];
}

type DragMode =
  | { kind: "none" }
  | { kind: "create"; startN: { x: number; y: number }; curN: { x: number; y: number } }
  | {
      kind: "move";
      index: number;
      offsetN: { x: number; y: number };
      orig: Bbox;
      /**
       * Group drag: original bboxes for every column moving as a unit.
       * Always at least one entry (the dragged column). When the dragged
       * column was part of a 2+ selection, the rest of the selection is
       * included so the whole group translates by one shared delta.
       */
      groupOrigs: Map<number, Bbox>;
      /** Union bbox across `groupOrigs`, used to clamp the shared delta. */
      groupBounds: Bbox;
    }
  | {
      kind: "resize";
      index: number;
      handle: ResizeHandle;
      orig: Bbox;
      /**
       * Group resize: original bboxes for every column being resized as a
       * unit. The same edge delta is applied to all members on each axis
       * implied by `handle` (e.g. "n" = top edge of every member moves by
       * the same dy). Single-col resize falls through with a one-entry map.
       */
      groupOrigs: Map<number, Bbox>;
    };

type ResizeHandle =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

const HANDLE_SIZE = 10;

export default function ColumnStep({
  imageUrl,
  columns,
  onChange,
  autoDetected,
  charCounts,
  spatialData,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [imgRect, setImgRect] = useState<{
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
      setImgRect((prev) => {
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

  const scaleX = imgRect?.width ?? 1;
  const scaleY = imgRect?.height ?? 1;

  // Multi-selection. `selected` is the full set of selected column indices;
  // `anchor` is the most recently single-clicked row, used as the pivot for
  // shift-click range selection. When `selected.size === 1`, behavior is
  // identical to the prior single-select.
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [anchor, setAnchor] = useState<number | null>(null);
  const [drag, setDrag] = useState<DragMode>({ kind: "none" });

  const selectOnly = useCallback((idx: number) => {
    setSelected(new Set([idx]));
    setAnchor(idx);
  }, []);
  const clearSelection = useCallback(() => {
    setSelected(new Set());
    setAnchor(null);
  }, []);
  // Modifier-aware row select. Cmd/Ctrl toggles, Shift extends range from
  // the current anchor, no modifier replaces the selection.
  const handleRowSelect = useCallback(
    (ci: number, e: { metaKey: boolean; ctrlKey: boolean; shiftKey: boolean }) => {
      if (e.metaKey || e.ctrlKey) {
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(ci)) next.delete(ci);
          else next.add(ci);
          return next;
        });
        setAnchor(ci);
      } else if (e.shiftKey && anchor !== null) {
        setSelected((prev) => {
          const next = new Set(prev);
          const lo = Math.min(anchor, ci);
          const hi = Math.max(anchor, ci);
          for (let k = lo; k <= hi; k++) next.add(k);
          return next;
        });
        // anchor stays so further shift-clicks pivot on the same row.
      } else {
        setSelected(new Set([ci]));
        setAnchor(ci);
      }
    },
    [anchor]
  );

  // Convert a clientX/clientY (viewport) to image-normalized coords.
  const clientToNorm = useCallback(
    (clientX: number, clientY: number) => {
      const r = imgRef.current?.getBoundingClientRect();
      if (!r || r.width <= 0 || r.height <= 0) return { x: 0, y: 0 };
      return {
        x: (clientX - r.left) / r.width,
        y: (clientY - r.top) / r.height,
      };
    },
    []
  );

  // Mouse-up / mouse-move on document so the drag continues even if the
  // pointer leaves the image.
  useEffect(() => {
    if (drag.kind === "none") return;
    function onMove(e: MouseEvent) {
      const cur = clientToNorm(e.clientX, e.clientY);
      if (drag.kind === "create") {
        setDrag({ ...drag, curN: cur });
      } else if (drag.kind === "move") {
        // Compute the desired delta from the dragged column's original
        // top-left, then clamp the delta against the *group bounds* so all
        // members stay on the page and keep their relative offsets.
        const desiredDx = cur.x - drag.offsetN.x - drag.orig.minX;
        const desiredDy = cur.y - drag.offsetN.y - drag.orig.minY;
        const dx = Math.max(
          -drag.groupBounds.minX,
          Math.min(1 - drag.groupBounds.maxX, desiredDx)
        );
        const dy = Math.max(
          -drag.groupBounds.minY,
          Math.min(1 - drag.groupBounds.maxY, desiredDy)
        );
        const next = columns.slice();
        for (const [i, orig] of drag.groupOrigs) {
          next[i] = {
            ...next[i],
            bbox: {
              minX: orig.minX + dx,
              maxX: orig.maxX + dx,
              minY: orig.minY + dy,
              maxY: orig.maxY + dy,
            },
          };
        }
        onChange(next);
      } else if (drag.kind === "resize") {
        // Compute the desired edge delta on each axis the handle implies,
        // measured against the dragged column's original bbox. Then clamp
        // each delta so that for *every* member of the group the resulting
        // edge stays within [0, 1] and doesn't cross the opposite edge.
        const h = drag.handle;
        const origs = [...drag.groupOrigs.values()];
        let dMinY = 0, dMaxY = 0, dMinX = 0, dMaxX = 0;
        if (h.includes("n")) {
          const desired = cur.y - drag.orig.minY;
          // desired added to each orig.minY: must stay >= 0 and
          // <= orig.maxY - 0.001.
          let lo = -Infinity, hi = Infinity;
          for (const o of origs) {
            lo = Math.max(lo, -o.minY);
            hi = Math.min(hi, o.maxY - 0.001 - o.minY);
          }
          dMinY = Math.max(lo, Math.min(hi, desired));
        }
        if (h.includes("s")) {
          const desired = cur.y - drag.orig.maxY;
          let lo = -Infinity, hi = Infinity;
          for (const o of origs) {
            lo = Math.max(lo, o.minY + 0.001 - o.maxY);
            hi = Math.min(hi, 1 - o.maxY);
          }
          dMaxY = Math.max(lo, Math.min(hi, desired));
        }
        if (h.includes("w")) {
          const desired = cur.x - drag.orig.minX;
          let lo = -Infinity, hi = Infinity;
          for (const o of origs) {
            lo = Math.max(lo, -o.minX);
            hi = Math.min(hi, o.maxX - 0.001 - o.minX);
          }
          dMinX = Math.max(lo, Math.min(hi, desired));
        }
        if (h.includes("e")) {
          const desired = cur.x - drag.orig.maxX;
          let lo = -Infinity, hi = Infinity;
          for (const o of origs) {
            lo = Math.max(lo, o.minX + 0.001 - o.maxX);
            hi = Math.min(hi, 1 - o.maxX);
          }
          dMaxX = Math.max(lo, Math.min(hi, desired));
        }

        const next = columns.slice();
        for (const [i, o] of drag.groupOrigs) {
          next[i] = {
            ...next[i],
            bbox: {
              minX: o.minX + dMinX,
              maxX: o.maxX + dMaxX,
              minY: o.minY + dMinY,
              maxY: o.maxY + dMaxY,
            },
          };
        }
        onChange(next);
      }
    }
    function onUp() {
      if (drag.kind === "create") {
        const minX = Math.max(0, Math.min(drag.startN.x, drag.curN.x));
        const maxX = Math.min(1, Math.max(drag.startN.x, drag.curN.x));
        const minY = Math.max(0, Math.min(drag.startN.y, drag.curN.y));
        const maxY = Math.min(1, Math.max(drag.startN.y, drag.curN.y));
        // Skip tiny / accidental drags.
        if (maxX - minX > 0.005 && maxY - minY > 0.005) {
          const newCol: ConfirmedColumn = {
            bbox: { minX, maxX, minY, maxY },
            kind: "text",
          };
          // Slot into the existing reading order based on Han-Nôm RTL
          // sweep + top-to-bottom within an X-band. User can still
          // drag-reorder if the auto-pick is wrong.
          const insertAt = findReadingOrderInsertIndex(newCol, columns);
          const next: ConfirmedColumn[] = [
            ...columns.slice(0, insertAt),
            newCol,
            ...columns.slice(insertAt),
          ];
          onChange(next);
          selectOnly(insertAt);
        }
      }
      setDrag({ kind: "none" });
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [drag, clientToNorm, columns, onChange]);

  // Delete key removes every selected column. Esc clears the selection.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (selected.size === 0) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const next = columns.filter((_, i) => !selected.has(i));
        onChange(next);
        clearSelection();
      } else if (e.key === "Escape") {
        clearSelection();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, columns, onChange, clearSelection]);

  function handleImageMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    // Background click → start a "create new column" drag.
    if (e.button !== 0) return;
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    clearSelection();
    const start = clientToNorm(e.clientX, e.clientY);
    setDrag({ kind: "create", startN: start, curN: start });
  }

  function startMove(e: React.MouseEvent, index: number) {
    // Modifier-click on an overlay = multi-select gesture, not a move drag.
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      handleRowSelect(index, e);
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    // Plain click always collapses to a single-column selection — even
    // when the clicked column was part of a prior multi-selection. Use
    // Cmd/Ctrl/Shift modifiers (handled above) for additive gestures.
    selectOnly(index);
    const dragGroup = [index];
    const groupOrigs = new Map<number, Bbox>(
      dragGroup.map((i) => [i, { ...columns[i].bbox }])
    );
    const allBoxes = [...groupOrigs.values()];
    const groupBounds: Bbox = {
      minX: Math.min(...allBoxes.map((b) => b.minX)),
      maxX: Math.max(...allBoxes.map((b) => b.maxX)),
      minY: Math.min(...allBoxes.map((b) => b.minY)),
      maxY: Math.max(...allBoxes.map((b) => b.maxY)),
    };

    const cur = clientToNorm(e.clientX, e.clientY);
    const orig = columns[index].bbox;
    setDrag({
      kind: "move",
      index,
      offsetN: { x: cur.x - orig.minX, y: cur.y - orig.minY },
      orig: { ...orig },
      groupOrigs,
      groupBounds,
    });
  }

  function startResize(e: React.MouseEvent, index: number, handle: ResizeHandle) {
    e.preventDefault();
    e.stopPropagation();

    // Resize the whole selection if the grabbed column is part of a
    // 2+ multi-selection; otherwise collapse to a single-col resize.
    const groupIndices =
      selected.has(index) && selected.size > 1 ? [...selected] : [index];
    if (groupIndices.length === 1) {
      selectOnly(index);
    }
    const groupOrigs = new Map<number, Bbox>(
      groupIndices.map((i) => [i, { ...columns[i].bbox }])
    );

    setDrag({
      kind: "resize",
      index,
      handle,
      orig: { ...columns[index].bbox },
      groupOrigs,
    });
  }

  // ── Sortable list (right sidebar) ──

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Stable per-row IDs so DnD reorder stays well-defined while items are
  // being added/removed/reordered. Uses a ref-counted pool keyed by array
  // position with re-mapping when rows shift.
  const idsRef = useRef<string[]>([]);
  const ids = useMemo(() => {
    const cur = idsRef.current;
    while (cur.length < columns.length) cur.push(`col-${cur.length}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    if (cur.length > columns.length) cur.length = columns.length;
    return cur.slice();
  }, [columns.length]);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;
    const nextIds = arrayMove(ids, oldIndex, newIndex);
    idsRef.current = nextIds;
    onChange(arrayMove(columns, oldIndex, newIndex));
    // Single-row drag clears any multi-selection — the post-reorder index
    // mapping for an arbitrary selected set isn't worth getting wrong.
    // Anchor follows the dragged row to its new position.
    selectOnly(newIndex);
  }

  function setKindAt(i: number, kind: ColumnKind) {
    const next = columns.slice();
    next[i] = { ...next[i], kind };
    onChange(next);
  }

  function deleteAt(i: number) {
    const next = columns.slice();
    next.splice(i, 1);
    onChange(next);
    // Clear selection — index reshuffle would invalidate any retained set.
    clearSelection();
  }

  // Transient feedback for the Split action — keyed by column index so
  // the inline message attaches to the row the user clicked.
  const [splitMessage, setSplitMessage] = useState<{
    index: number;
    text: string;
  } | null>(null);
  useEffect(() => {
    if (!splitMessage) return;
    const t = setTimeout(() => setSplitMessage(null), 2500);
    return () => clearTimeout(t);
  }, [splitMessage]);

  function splitAt(i: number) {
    if (!spatialData || spatialData.length === 0) {
      setSplitMessage({ index: i, text: "no chars" });
      return;
    }
    const target = columns[i];
    const pieces = splitColumnByYGaps(target.bbox, spatialData);
    if (pieces.length < 2) {
      setSplitMessage({ index: i, text: "no gap found" });
      return;
    }
    // Carry the original column's kind forward to every split piece so the
    // user doesn't have to reset it on each new column.
    const kind = target.kind;
    const replacements: ConfirmedColumn[] = pieces.map((p) => ({
      bbox: p.bbox,
      ...(kind !== undefined ? { kind } : {}),
    }));
    const next: ConfirmedColumn[] = [
      ...columns.slice(0, i),
      ...replacements,
      ...columns.slice(i + 1),
    ];
    // Stable IDs need to grow to match the new length; the existing
    // useMemo on columns.length handles that on the next render.
    onChange(next);
    selectOnly(i);
    setSplitMessage(null);
  }

  // ── Bulk actions (run on every column in `selected`) ──

  function bulkDelete() {
    if (selected.size === 0) return;
    const next = columns.filter((_, i) => !selected.has(i));
    onChange(next);
    clearSelection();
  }

  function bulkSetKind(kind: ColumnKind) {
    if (selected.size === 0) return;
    const next = columns.map((c, i) => (selected.has(i) ? { ...c, kind } : c));
    onChange(next);
    // Selection retained — common to set kind then continue acting on the set.
  }

  function bulkSplit() {
    if (selected.size === 0 || !spatialData || spatialData.length === 0) return;
    // Walk highest → lowest so earlier indices stay valid as we splice.
    const indices = [...selected].sort((a, b) => b - a);
    let next = columns.slice();
    for (const i of indices) {
      const target = next[i];
      const pieces = splitColumnByYGaps(target.bbox, spatialData);
      if (pieces.length < 2) continue;
      const kind = target.kind;
      const replacements: ConfirmedColumn[] = pieces.map((p) => ({
        bbox: p.bbox,
        ...(kind !== undefined ? { kind } : {}),
      }));
      next = [...next.slice(0, i), ...replacements, ...next.slice(i + 1)];
    }
    onChange(next);
    clearSelection();
  }

  function bulkMerge() {
    if (selected.size < 2) return;
    const indices = [...selected].sort((a, b) => a - b);
    const cols = indices.map((i) => columns[i]);
    const minX = Math.min(...cols.map((c) => c.bbox.minX));
    const maxX = Math.max(...cols.map((c) => c.bbox.maxX));
    const minY = Math.min(...cols.map((c) => c.bbox.minY));
    const maxY = Math.max(...cols.map((c) => c.bbox.maxY));
    // Inherit kind from the first selected column (in reading order).
    const kind = cols[0].kind;
    const merged: ConfirmedColumn = {
      bbox: { minX, maxX, minY, maxY },
      ...(kind !== undefined ? { kind } : {}),
    };
    const firstIdx = indices[0];
    const next: ConfirmedColumn[] = [];
    for (let i = 0; i < columns.length; i++) {
      if (i === firstIdx) next.push(merged);
      else if (selected.has(i)) continue;
      else next.push(columns[i]);
    }
    onChange(next);
    selectOnly(firstIdx);
  }

  // Live "create" preview rectangle.
  const createPreview =
    drag.kind === "create"
      ? {
          left: Math.min(drag.startN.x, drag.curN.x) * scaleX,
          top: Math.min(drag.startN.y, drag.curN.y) * scaleY,
          width: Math.abs(drag.curN.x - drag.startN.x) * scaleX,
          height: Math.abs(drag.curN.y - drag.startN.y) * scaleY,
        }
      : null;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Center: image with column overlays */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-gray-100">
        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 uppercase tracking-wide flex items-center gap-2">
          <span>Step 1 — Columns</span>
          <span className="text-gray-400 font-normal normal-case tracking-normal">
            Drag empty area to add · drag a column to move · corners/edges
            resize · Del removes
          </span>
        </div>

        {/* Action bar — always visible at the top of the image pane.
            Buttons disable themselves when the current selection is too
            small for the action (Merge needs 2+; the rest need 1+). */}
        {(() => {
          const n = selected.size;
          const hasOne = n >= 1;
          const hasTwo = n >= 2;
          return (
            <div className="px-2 py-1.5 bg-blue-50 border-b border-blue-200 flex items-center justify-center gap-1.5 text-[11px] flex-wrap">
              <span className={`font-semibold ${hasOne ? "text-blue-700" : "text-gray-400"}`}>
                {n === 0 ? "No selection" : `${n} selected`}
              </span>
              <span className="text-blue-300">|</span>
              <span className="text-gray-500">Kind:</span>
              {KINDS.map((k) => (
                <button
                  key={k}
                  onClick={() => bulkSetKind(k)}
                  disabled={!hasOne}
                  title={
                    hasOne
                      ? `Set kind to ${KIND_LABEL[k]}`
                      : "Select a column first"
                  }
                  className={`w-5 h-5 text-[10px] font-bold leading-none rounded ${KIND_BADGE[k]} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {KIND_GLYPH[k]}
                </button>
              ))}
              <span className="text-blue-300">|</span>
              {spatialData && spatialData.length > 0 && (
                <button
                  onClick={bulkSplit}
                  disabled={!hasOne}
                  title={
                    hasOne
                      ? "Split each selected column at internal Y-gaps"
                      : "Select a column first"
                  }
                  className="px-1.5 py-0.5 font-medium bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-100"
                >
                  Split
                </button>
              )}
              <button
                onClick={bulkMerge}
                disabled={!hasTwo}
                title={
                  hasTwo
                    ? "Merge selected columns into one (union bbox; kind from the first in reading order)"
                    : "Select 2 or more columns to merge"
                }
                className="px-1.5 py-0.5 font-medium bg-purple-100 hover:bg-purple-200 text-purple-800 rounded disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-100"
              >
                Merge
              </button>
              <button
                onClick={() => {
                  if (n === 0) return;
                  if (n === 1 || window.confirm(`Delete ${n} columns?`)) {
                    bulkDelete();
                  }
                }}
                disabled={!hasOne}
                title={hasOne ? "Delete selected" : "Select a column first"}
                className="px-1.5 py-0.5 font-medium bg-red-100 hover:bg-red-200 text-red-800 rounded disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-100"
              >
                Delete
              </button>
              {hasOne && (
                <button
                  onClick={clearSelection}
                  title="Clear selection (Esc)"
                  className="text-blue-400 hover:text-blue-600 px-1"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })()}

        {/* Single-selection details. Shown right below the action bar so
            the info sits near the image (i.e. where the user is looking)
            without duplicating the sidebar list. Hidden when 0 or 2+
            columns are selected — those cases are handled by the action
            bar's count + bulk actions. */}
        {(() => {
          if (selected.size !== 1) return null;
          const ci = Array.from(selected)[0];
          const col = columns[ci];
          if (!col) return null;
          const kind = getKind(col);
          const charCount = charCounts?.[ci] ?? 0;
          const w = col.bbox.maxX - col.bbox.minX;
          const h = col.bbox.maxY - col.bbox.minY;
          const fmt = (n: number) => (n * 100).toFixed(1) + "%";
          return (
            <div className="px-3 py-1.5 bg-white border-b border-gray-200 flex items-center justify-center gap-3 text-[11px] text-gray-700">
              <span>
                <span className="text-gray-500">Column</span>{" "}
                <span className="font-semibold">#{ci + 1}</span>
                <span className="text-gray-400"> of {columns.length}</span>
              </span>
              <span className="text-gray-300">·</span>
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${KIND_BADGE[kind]} text-[10px] font-semibold`}
              >
                <span>{KIND_GLYPH[kind]}</span>
                <span>{KIND_LABEL[kind]}</span>
              </span>
              <span className="text-gray-300">·</span>
              <span>
                <span className="font-semibold">{charCount}</span>{" "}
                <span className="text-gray-500">
                  char{charCount === 1 ? "" : "s"}
                </span>
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500 tabular-nums">
                {fmt(w)} × {fmt(h)}
              </span>
            </div>
          );
        })()}

        <div
          ref={containerRef}
          className="relative flex-1 min-h-0 overflow-auto bg-gray-100 flex items-center justify-center min-w-0"
        >
          <div
            className="relative inline-block select-none max-w-full max-h-full min-w-0 min-h-0"
            onMouseDown={handleImageMouseDown}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Document page"
              className="block max-w-full max-h-full w-auto h-auto pointer-events-none"
              draggable={false}
            />

            {/* Column overlays */}
            {columns.map((col, ci) => {
              const left = col.bbox.minX * scaleX;
              const top = col.bbox.minY * scaleY;
              const width = (col.bbox.maxX - col.bbox.minX) * scaleX;
              const height = (col.bbox.maxY - col.bbox.minY) * scaleY;
              const isSelected = selected.has(ci);
              const isAnchor = ci === anchor;
              const kind = getKind(col);
              return (
                <div
                  key={ci}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    width,
                    height,
                    zIndex: isSelected ? 30 : 10,
                  }}
                  onMouseDown={(e) => startMove(e, ci)}
                  className={`cursor-move border-2 ${
                    isSelected
                      ? "border-red-500 bg-red-500/10"
                      : KIND_OVERLAY[kind]
                  }`}
                >
                  <span
                    className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? "bg-red-500 text-white"
                        : KIND_BADGE[kind]
                    }`}
                  >
                    {ci + 1}
                  </span>

                  {/* Resize handles render on every selected column —
                      grabbing any one resizes all selected together,
                      moving the matching edge by a shared delta. */}
                  {isSelected &&
                    renderHandles((h, e) => startResize(e, ci, h))}
                </div>
              );
            })}

            {/* In-flight create rectangle */}
            {createPreview && (
              <div
                style={{
                  position: "absolute",
                  left: createPreview.left,
                  top: createPreview.top,
                  width: createPreview.width,
                  height: createPreview.height,
                  zIndex: 40,
                }}
                className="border-2 border-dashed border-emerald-500 bg-emerald-500/10 pointer-events-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Right: sortable list */}
      <div className="w-72 border-l border-gray-200 bg-white overflow-hidden flex flex-col">
        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 uppercase tracking-wide flex items-center justify-between">
          <span>Reading order</span>
          <span className="text-gray-400 font-normal normal-case tracking-normal">
            {columns.length} {columns.length === 1 ? "column" : "columns"}
            <span className="ml-1 text-gray-300">· Ctrl/Shift+click for multi</span>
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          {columns.length === 0 ? (
            <div className="p-3 text-xs text-gray-400">
              No columns yet. Drag on the image to add one
              {autoDetected && autoDetected.length > 0
                ? ", or click the auto-detect button above."
                : "."}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <ul className="divide-y divide-gray-100">
                  {columns.map((col, ci) => (
                    <SortableRow
                      key={ids[ci]}
                      id={ids[ci]}
                      index={ci}
                      bbox={col.bbox}
                      kind={getKind(col)}
                      charCount={charCounts?.[ci]}
                      isSelected={selected.has(ci)}
                      onSelect={(e) => handleRowSelect(ci, e)}
                      onDelete={() => deleteAt(ci)}
                      onSetKind={(k) => setKindAt(ci, k)}
                      onSplit={
                        spatialData && spatialData.length > 0
                          ? () => splitAt(ci)
                          : undefined
                      }
                      splitMessage={
                        splitMessage?.index === ci ? splitMessage.text : null
                      }
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Resize handles ──

function renderHandles(
  start: (h: ResizeHandle, e: React.MouseEvent) => void
) {
  const positions: Array<{ h: ResizeHandle; style: React.CSSProperties; cursor: string }> = [
    { h: "nw", style: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 }, cursor: "nwse-resize" },
    { h: "n", style: { top: -HANDLE_SIZE / 2, left: `calc(50% - ${HANDLE_SIZE / 2}px)` }, cursor: "ns-resize" },
    { h: "ne", style: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 }, cursor: "nesw-resize" },
    { h: "e", style: { top: `calc(50% - ${HANDLE_SIZE / 2}px)`, right: -HANDLE_SIZE / 2 }, cursor: "ew-resize" },
    { h: "se", style: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 }, cursor: "nwse-resize" },
    { h: "s", style: { bottom: -HANDLE_SIZE / 2, left: `calc(50% - ${HANDLE_SIZE / 2}px)` }, cursor: "ns-resize" },
    { h: "sw", style: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 }, cursor: "nesw-resize" },
    { h: "w", style: { top: `calc(50% - ${HANDLE_SIZE / 2}px)`, left: -HANDLE_SIZE / 2 }, cursor: "ew-resize" },
  ];
  return positions.map(({ h, style, cursor }) => (
    <span
      key={h}
      style={{
        position: "absolute",
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        background: "white",
        border: "1.5px solid #ef4444",
        borderRadius: 2,
        cursor,
        ...style,
      }}
      onMouseDown={(e) => start(h, e)}
    />
  ));
}

// ── Sortable row ──

function SortableRow({
  id,
  index,
  bbox,
  kind,
  charCount,
  isSelected,
  onSelect,
  onDelete,
  onSetKind,
  onSplit,
  splitMessage,
}: {
  id: string;
  index: number;
  bbox: Bbox;
  kind: ColumnKind;
  charCount?: number;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onSetKind: (k: ColumnKind) => void;
  onSplit?: () => void;
  splitMessage?: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const w = ((bbox.maxX - bbox.minX) * 100).toFixed(1);
  const h = ((bbox.maxY - bbox.minY) * 100).toFixed(1);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 px-2 py-1.5 text-xs ${
        isSelected ? "bg-red-50" : "hover:bg-gray-50"
      }`}
      onClick={(e) => onSelect(e)}
    >
      <button
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        className="text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing px-1"
      >
        ⋮⋮
      </button>
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded font-bold text-[11px] ${
          isSelected ? "bg-red-500 text-white" : KIND_BADGE[kind]
        }`}
      >
        {index + 1}
      </span>
      {/* Kind segmented control */}
      <div
        className="inline-flex border border-gray-200 rounded overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {KINDS.map((k) => (
          <button
            key={k}
            onClick={(e) => {
              e.stopPropagation();
              onSetKind(k);
            }}
            title={KIND_LABEL[k]}
            className={`w-5 h-5 text-[10px] font-bold leading-none ${
              k === kind
                ? `${KIND_BADGE[k]}`
                : "bg-white text-gray-400 hover:bg-gray-100"
            }`}
          >
            {KIND_GLYPH[k]}
          </button>
        ))}
      </div>
      <span className="text-gray-500 font-mono text-[10px]">
        {w}×{h}%
      </span>
      {typeof charCount === "number" && (
        <span className="text-gray-400 text-[10px]">{charCount}ch</span>
      )}
      {splitMessage && (
        <span className="text-amber-600 text-[10px]">{splitMessage}</span>
      )}
      {onSplit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSplit();
          }}
          title="Split column at internal blank gaps (≥ 0.3× char height)"
          className="ml-auto text-gray-400 hover:text-emerald-600 px-1 font-bold leading-none"
        >
          ⇅
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete column"
        className={`${onSplit ? "" : "ml-auto"} text-gray-400 hover:text-red-500 px-1`}
      >
        ✕
      </button>
    </li>
  );
}
