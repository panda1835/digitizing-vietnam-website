"use client";

import { useEffect, useMemo } from "react";
import type { SpatialCharacter } from "@/lib/ocr-store";
import {
  useColumnDetection,
  reorderByColumns,
  pickLayoutMode,
  type LayoutMode,
  type Column,
} from "./useColumnDetection";
import OCRTextPane from "./OCRTextPane";
import OCRImagePane from "./OCRImagePane";
import OCRToolbox from "./OCRToolbox";

export type ViewMode = "charBox" | "column";
export type BboxOverride = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export interface OCRWorkspaceProps {
  /** Loaded OCR characters. */
  spatialData: SpatialCharacter[];
  /**
   * Called whenever in-memory spatial data changes (char edits, deletes,
   * column moves, etc.). The parent decides whether to persist (e.g. via
   * `useOCRSave`) or keep the change ephemeral.
   */
  onSpatialDataChange: (next: SpatialCharacter[]) => void;

  /** Image URL behind the bbox overlays. */
  imageUrl: string;

  /**
   * Layout-mode hint. Defaults to "auto" — picks "commentary" when the page
   * has bimodal char-size distribution (interlinear annotation present),
   * else "simple". Pass an explicit value only when the auto-detect needs
   * to be overridden.
   */
  layoutMode?: LayoutMode;
  /** "charBox" shows per-char inputs; "column" shows column boundaries for editing. */
  viewMode: ViewMode;

  /** Currently selected column (for column-level editing in column view). */
  selectedColumnIndex: number | null;
  onSelectColumnIndexChange: (idx: number | null) => void;

  /** Currently focused character offset. */
  focusedOffset: number | null;
  onFocusedOffsetChange: (offset: number | null) => void;

  /** Manual column-bbox overrides (resize / create-column persistence). */
  bboxOverrides: Record<number, BboxOverride>;
  onBboxOverridesChange: (next: Record<number, BboxOverride>) => void;

  /** Optional alternative-OCR pool surfaced in the toolbox right pane. */
  candidateData?: SpatialCharacter[];
  onCandidateDataChange?: (next: SpatialCharacter[]) => void;

  /**
   * OCR detection mode used when the user draws a region to re-OCR.
   * Defaults to "auto".
   */
  regionOcrDetMode?: "auto" | "sp" | "hp";

  /** Optional hook so the parent can show a low-confidence review modal. */
  onOpenLowConfReview?: (threshold: number) => void;
}

/**
 * Self-contained 3-pane editor view: text pane (left), image+overlays
 * (center), toolbox (right). Owns column detection, all in-memory editing
 * handlers, and global keyboard navigation. Parent owns persistence,
 * page-level chrome, and any view-mode/layout-mode toggle UI.
 */
export default function OCRWorkspace({
  spatialData,
  onSpatialDataChange,
  imageUrl,
  layoutMode = "auto",
  viewMode,
  selectedColumnIndex,
  onSelectColumnIndexChange,
  focusedOffset,
  onFocusedOffsetChange,
  bboxOverrides,
  onBboxOverridesChange,
  candidateData = [],
  onCandidateDataChange,
  regionOcrDetMode = "auto",
  onOpenLowConfReview,
}: OCRWorkspaceProps) {
  // Resolve "auto" to a concrete mode once so the panes (which branch on
  // "commentary" for dual-sub-col rendering) and column detection agree.
  const resolvedLayoutMode = useMemo<"simple" | "commentary">(() => {
    if (layoutMode !== "auto") return layoutMode;
    const charsWithBbox = spatialData.filter(
      (c) => c.bbox && c.bbox.length === 4
    );
    return pickLayoutMode(charsWithBbox);
  }, [layoutMode, spatialData]);

  // Detect columns from current data, then layer in any manual bbox overrides.
  const detectedColumns = useColumnDetection(spatialData, resolvedLayoutMode);
  const columns = useMemo<Column[]>(() => {
    return detectedColumns.map((col, i) => {
      const override = bboxOverrides[i];
      if (override) return { ...col, bbox: override };
      return col;
    });
  }, [detectedColumns, bboxOverrides]);

  const orphanedChars = useMemo(() => {
    const assignedOffsets = new Set<number>();
    for (const col of columns) {
      for (const c of col.chars) assignedOffsets.add(c.offset);
    }
    return spatialData.filter(
      (c) => c.bbox && !assignedOffsets.has(c.offset)
    );
  }, [spatialData, columns]);

  // ── Selection / focus helpers ──

  function handleSelectColumn(ci: number) {
    onSelectColumnIndexChange(ci);
    const firstChar = columns[ci]?.chars.find((c) => c.bbox);
    if (firstChar) onFocusedOffsetChange(firstChar.offset);
  }

  function handleDeselectColumn() {
    onSelectColumnIndexChange(null);
    onFocusedOffsetChange(null);
  }

  // ── In-memory editing handlers (lifted verbatim from OCREditor) ──

  function handleCharChange(offset: number, newText: string) {
    const updated = spatialData.map((c) =>
      c.offset === offset ? { ...c, text: newText } : c
    );
    onSpatialDataChange(updated);
  }

  function handleSuggestApply(offset: number, suggestion: string) {
    handleCharChange(offset, suggestion);
  }

  function handleDeleteChar(offset: number) {
    const next = spatialData.filter((c) => c.offset !== offset);
    let off = 0;
    for (const c of next) {
      c.offset = off;
      off += c.text.length;
    }
    onSpatialDataChange(next);
  }

  function handleMoveColumn(colIndex: number, deltaX: number, deltaY: number) {
    const col = columns[colIndex];
    if (!col) return;
    const movedOffsets = new Set(col.chars.map((c) => c.offset));
    const updated = spatialData.map((c) => {
      if (!movedOffsets.has(c.offset) || !c.bbox) return c;
      return {
        ...c,
        bbox: c.bbox.map((v) => ({
          x: Math.max(0, Math.min(1, v.x + deltaX)),
          y: Math.max(0, Math.min(1, v.y + deltaY)),
        })),
      };
    });
    onSpatialDataChange(updated);
  }

  function handleResizeColumn(colIndex: number, newBbox: BboxOverride) {
    onBboxOverridesChange({ ...bboxOverrides, [colIndex]: newBbox });

    const col = columns[colIndex];
    if (!col) return;

    const inBbox = (c: SpatialCharacter) => {
      if (!c.bbox) return false;
      const cx = (c.bbox[0].x + c.bbox[2].x) / 2;
      const cy = (c.bbox[0].y + c.bbox[2].y) / 2;
      return (
        cx >= newBbox.minX &&
        cx <= newBbox.maxX &&
        cy >= newBbox.minY &&
        cy <= newBbox.maxY
      );
    };

    const claimed: SpatialCharacter[] = [];
    const rest: SpatialCharacter[] = [];
    for (const c of spatialData) {
      if (inBbox(c)) claimed.push(c);
      else rest.push(c);
    }

    const isRow =
      newBbox.maxX - newBbox.minX > (newBbox.maxY - newBbox.minY) * 1.5;
    if (isRow) {
      claimed.sort((a, b) => {
        const ax = a.bbox ? (a.bbox[0].x + a.bbox[2].x) / 2 : 0;
        const bx = b.bbox ? (b.bbox[0].x + b.bbox[2].x) / 2 : 0;
        return ax - bx;
      });
    } else {
      claimed.sort((a, b) => {
        const ay = a.bbox ? (a.bbox[0].y + a.bbox[2].y) / 2 : 0;
        const by = b.bbox ? (b.bbox[0].y + b.bbox[2].y) / 2 : 0;
        return ay - by;
      });
    }

    const colOffsets = new Set(col.chars.map((c) => c.offset));
    const firstColIdx = spatialData.findIndex((c) => colOffsets.has(c.offset));
    const insertIdx =
      firstColIdx >= 0
        ? rest.findIndex((c) => spatialData.indexOf(c) >= firstColIdx)
        : rest.length;

    const updated = [...rest];
    updated.splice(insertIdx >= 0 ? insertIdx : rest.length, 0, ...claimed);

    let offset = 0;
    for (const c of updated) {
      c.offset = offset;
      offset += c.text.length;
    }
    onSpatialDataChange(updated);
  }

  function handleDeleteColumn(colIndex: number) {
    const col = columns[colIndex];
    if (!col) return;
    const deleteOffsets = new Set(col.chars.map((c) => c.offset));
    const next = spatialData.filter((c) => !deleteOffsets.has(c.offset));
    let offset = 0;
    for (const c of next) {
      c.offset = offset;
      offset += c.text.length;
    }
    onSpatialDataChange(next);
    onSelectColumnIndexChange(null);
    onFocusedOffsetChange(null);
  }

  function handleCreateColumn(bbox: BboxOverride) {
    const newColIndex = columns.length;
    onBboxOverridesChange({ ...bboxOverrides, [newColIndex]: bbox });

    const inBbox = (c: SpatialCharacter) => {
      if (!c.bbox) return false;
      const cx = (c.bbox[0].x + c.bbox[2].x) / 2;
      const cy = (c.bbox[0].y + c.bbox[2].y) / 2;
      return (
        cx >= bbox.minX &&
        cx <= bbox.maxX &&
        cy >= bbox.minY &&
        cy <= bbox.maxY
      );
    };

    const assignedOffsets = new Set<number>();
    for (const col of columns) {
      for (const c of col.chars) assignedOffsets.add(c.offset);
    }

    const claimed: SpatialCharacter[] = [];
    const rest: SpatialCharacter[] = [];
    for (const c of spatialData) {
      if (inBbox(c) && !assignedOffsets.has(c.offset)) claimed.push(c);
      else rest.push(c);
    }

    if (claimed.length > 0) {
      const isRow =
        bbox.maxX - bbox.minX > (bbox.maxY - bbox.minY) * 1.5;
      if (isRow) {
        claimed.sort((a, b) => {
          const ax = a.bbox ? (a.bbox[0].x + a.bbox[2].x) / 2 : 0;
          const bx = b.bbox ? (b.bbox[0].x + b.bbox[2].x) / 2 : 0;
          return ax - bx;
        });
      } else {
        claimed.sort((a, b) => {
          const ay = a.bbox ? (a.bbox[0].y + a.bbox[2].y) / 2 : 0;
          const by = b.bbox ? (b.bbox[0].y + b.bbox[2].y) / 2 : 0;
          return ay - by;
        });
      }
      const updated = [...rest, ...claimed];
      let offset = 0;
      for (const c of updated) {
        c.offset = offset;
        offset += c.text.length;
      }
      onSpatialDataChange(updated);
    }

    onSelectColumnIndexChange(newColIndex);
  }

  function handleAddChar(
    bbox: Array<{ x: number; y: number }>,
    text: string
  ) {
    const newCenter = {
      x: (bbox[0].x + bbox[2].x) / 2,
      y: (bbox[0].y + bbox[2].y) / 2,
    };

    let bestColIdx = -1;
    let bestDist = Infinity;
    for (let ci = 0; ci < columns.length; ci++) {
      const col = columns[ci];
      const colCx = (col.bbox.minX + col.bbox.maxX) / 2;
      const dist = Math.abs(newCenter.x - colCx);
      if (dist < bestDist) {
        bestDist = dist;
        bestColIdx = ci;
      }
    }

    let insertIndex = spatialData.length;
    if (bestColIdx >= 0) {
      const col = columns[bestColIdx];
      let lastBeforeIdx = -1;
      for (const colChar of col.chars) {
        if (!colChar.bbox) continue;
        const cy = (colChar.bbox[0].y + colChar.bbox[2].y) / 2;
        if (cy <= newCenter.y) {
          const sdIdx = spatialData.findIndex(
            (c) => c.offset === colChar.offset
          );
          if (sdIdx >= 0) lastBeforeIdx = sdIdx;
        }
      }
      if (lastBeforeIdx >= 0) insertIndex = lastBeforeIdx + 1;
      else {
        const firstChar = col.chars.find((c) => c.bbox);
        if (firstChar) {
          const sdIdx = spatialData.findIndex(
            (c) => c.offset === firstChar.offset
          );
          if (sdIdx >= 0) insertIndex = sdIdx;
        }
      }
    }

    const newChar: SpatialCharacter = {
      text,
      bbox,
      confidence: 1.0,
      offset: 0,
    };
    const next = [...spatialData];
    next.splice(insertIndex, 0, newChar);
    let offset = 0;
    for (const c of next) {
      c.offset = offset;
      offset += c.text.length;
    }
    onSpatialDataChange(next);
  }

  // ── Region OCR (re-OCR a drawn rectangle) ──

  async function handleOcrRegion(rect: {
    x: number;
    y: number;
    w: number;
    h: number;
  }) {
    if (!imageUrl) return;
    try {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error("Failed to fetch image");
      const blob = await imgRes.blob();

      const croppedBlob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const sx = Math.round(rect.x * img.naturalWidth);
          const sy = Math.round(rect.y * img.naturalHeight);
          const sw = Math.round(rect.w * img.naturalWidth);
          const sh = Math.round(rect.h * img.naturalHeight);
          const canvas = document.createElement("canvas");
          canvas.width = sw;
          canvas.height = sh;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas not supported"));
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("Blob failed"))),
            "image/jpeg",
            0.95
          );
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = URL.createObjectURL(blob);
      });

      const formData = new FormData();
      formData.append("image", croppedBlob, "region.jpg");
      formData.append("det_mode", regionOcrDetMode);

      const res = await fetch("/api/ocr/process-page", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`OCR failed: ${res.status}`);
      const data = await res.json();
      const regionChars: SpatialCharacter[] = data.spatialData ?? [];
      if (regionChars.length === 0) return;

      const remapped: SpatialCharacter[] = regionChars
        .filter((c: SpatialCharacter) => c.bbox)
        .map((c: SpatialCharacter) => ({
          ...c,
          bbox: c.bbox!.map((v) => ({
            x: rect.x + v.x * rect.w,
            y: rect.y + v.y * rect.h,
          })),
        }));

      const merged = [...spatialData, ...remapped];
      const reordered = reorderByColumns(merged);
      onSpatialDataChange(reordered);
    } catch {
      /* swallow — caller can wire an error toast via state if it cares */
    }
  }

  // ── Global keyboard shortcuts (arrow nav, Esc deselect, digit-pick) ──

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      // Per-cell OCR inputs (the ones with data-char-offset) should still
      // honour the digit-candidate hotkey, even though they're <input>.
      // Other inputs/textareas swallow all hotkeys as before.
      const isOcrCellInput =
        tag === "INPUT" && target?.hasAttribute("data-char-offset");
      if ((tag === "INPUT" || tag === "TEXTAREA") && !isOcrCellInput) return;

      // Digit 1–9 — replace focused char with the Nth alternate candidate
      // and advance focus to the next char (mirrors ArrowDown behaviour).
      if (
        focusedOffset !== null &&
        !e.ctrlKey && !e.metaKey && !e.altKey &&
        e.key >= "1" && e.key <= "9"
      ) {
        const focusedChar = spatialData.find((c) => c.offset === focusedOffset);
        const choices = (focusedChar as any)?.choices as string[] | undefined;
        const candidate = choices?.[parseInt(e.key, 10) - 1];
        if (candidate) {
          e.preventDefault();
          handleSuggestApply(focusedOffset, candidate);
          if (selectedColumnIndex !== null) {
            const col = columns[selectedColumnIndex];
            if (col) {
              const bboxChars = col.chars.filter((c) => c.bbox);
              const idx = bboxChars.findIndex((c) => c.offset === focusedOffset);
              const next = bboxChars[idx + 1];
              if (next) {
                onFocusedOffsetChange(next.offset);
              } else if (selectedColumnIndex < columns.length - 1) {
                handleSelectColumn(selectedColumnIndex + 1);
              }
            }
          }
          return;
        }
      }

      // Let the cell input keep handling its own Tab / Enter / arrows.
      if (isOcrCellInput) return;

      if (e.key === "Escape") {
        handleDeselectColumn();
      } else if (
        e.key === "ArrowLeft" &&
        selectedColumnIndex !== null &&
        selectedColumnIndex > 0
      ) {
        e.preventDefault();
        handleSelectColumn(selectedColumnIndex - 1);
      } else if (
        e.key === "ArrowRight" &&
        selectedColumnIndex !== null &&
        selectedColumnIndex < columns.length - 1
      ) {
        e.preventDefault();
        handleSelectColumn(selectedColumnIndex + 1);
      } else if (e.key === "ArrowDown" && selectedColumnIndex !== null) {
        e.preventDefault();
        const col = columns[selectedColumnIndex];
        if (!col) return;
        const bboxChars = col.chars.filter((c) => c.bbox);
        const currentIdx = bboxChars.findIndex(
          (c) => c.offset === focusedOffset
        );
        const next = bboxChars[currentIdx + 1];
        if (next) onFocusedOffsetChange(next.offset);
        else if (selectedColumnIndex < columns.length - 1)
          handleSelectColumn(selectedColumnIndex + 1);
      } else if (e.key === "ArrowUp" && selectedColumnIndex !== null) {
        e.preventDefault();
        const col = columns[selectedColumnIndex];
        if (!col) return;
        const bboxChars = col.chars.filter((c) => c.bbox);
        const currentIdx = bboxChars.findIndex(
          (c) => c.offset === focusedOffset
        );
        const prev = bboxChars[currentIdx - 1];
        if (prev) onFocusedOffsetChange(prev.offset);
        else if (selectedColumnIndex > 0) {
          const prevCol = columns[selectedColumnIndex - 1];
          onSelectColumnIndexChange(selectedColumnIndex - 1);
          const lastChar = prevCol.chars.filter((c) => c.bbox).at(-1);
          if (lastChar) onFocusedOffsetChange(lastChar.offset);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColumnIndex, focusedOffset, columns, spatialData]);

  // ── Toolbox callbacks (in-memory variants) ──

  function handleDeleteOrphans() {
    const orphanOffsets = new Set(orphanedChars.map((c) => c.offset));
    const next = spatialData.filter((c) => !orphanOffsets.has(c.offset));
    let offset = 0;
    for (const c of next) {
      c.offset = offset;
      offset += c.text.length;
    }
    onSpatialDataChange(next);
  }

  function handlePromoteCandidate(c: SpatialCharacter) {
    if (onCandidateDataChange) {
      onCandidateDataChange(candidateData.filter((x) => x.offset !== c.offset));
    }
    if (c.bbox) handleAddChar(c.bbox, c.text);
  }

  function handleDismissCandidate(c: SpatialCharacter) {
    if (onCandidateDataChange) {
      onCandidateDataChange(candidateData.filter((x) => x.offset !== c.offset));
    }
  }

  // ── Render ──

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: full text */}
      <div className="w-1/3 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 uppercase tracking-wide">
          Full Text
        </div>
        <OCRTextPane
          spatialData={spatialData}
          columns={columns}
          layoutMode={resolvedLayoutMode}
          focusedOffset={focusedOffset}
          onFocusChar={onFocusedOffsetChange}
          onSelectColumn={handleSelectColumn}
        />
      </div>

      {/* Center: image + overlays */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 uppercase tracking-wide">
          {viewMode === "column"
            ? selectedColumnIndex !== null
              ? `Column ${selectedColumnIndex + 1} selected`
              : "Click a column to select, drag to move, draw to add"
            : selectedColumnIndex !== null
            ? `Editing column ${selectedColumnIndex + 1}`
            : "Click a column or draw to add"}
        </div>
        <div className="flex-1 overflow-hidden">
          <OCRImagePane
            imageUrl={imageUrl}
            columns={columns}
            selectedColumnIndex={selectedColumnIndex}
            spatialData={spatialData}
            onSelectColumn={handleSelectColumn}
            onDeselectColumn={handleDeselectColumn}
            onCharChange={handleCharChange}
            onFocusChar={onFocusedOffsetChange}
            onAddChar={handleAddChar}
            onOcrRegion={handleOcrRegion}
            focusedOffset={focusedOffset}
            viewMode={viewMode}
            onMoveColumn={handleMoveColumn}
            onResizeColumn={handleResizeColumn}
            onDeleteColumn={handleDeleteColumn}
            onCreateColumn={handleCreateColumn}
          />
        </div>
      </div>

      {/* Right: toolbox */}
      <div className="w-1/4 border-l border-gray-200 bg-white overflow-hidden flex flex-col">
        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 uppercase tracking-wide">
          Tools
        </div>
        <OCRToolbox
          columns={columns}
          selectedColumnIndex={selectedColumnIndex}
          onSelectColumn={handleSelectColumn}
          spatialDataLength={spatialData.filter((c) => c.bbox).length}
          focusedOffset={focusedOffset}
          onDeleteChar={handleDeleteChar}
          onSuggestApply={handleSuggestApply}
          spatialData={spatialData}
          onFocusChar={onFocusedOffsetChange}
          candidateData={candidateData}
          viewMode={viewMode}
          onDeleteColumn={handleDeleteColumn}
          orphanedChars={orphanedChars}
          onDeleteOrphans={handleDeleteOrphans}
          onPromoteCandidate={handlePromoteCandidate}
          onDismissCandidate={handleDismissCandidate}
          onOpenLowConfReview={onOpenLowConfReview ?? (() => {})}
        />
      </div>
    </div>
  );
}
