"use client";

import { useEffect, useMemo, useState } from "react";
import type { SpatialCharacter, ConfirmedColumn } from "@/lib/ocr-store";
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
import {
  rerecognizeWithNomNaViet,
  type PerCharCropOptions,
} from "@/lib/nomnaviet-ocr";

export type ViewMode = "charBox" | "column";
export type BboxOverride = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

/**
 * Walk the existing reading order and return the index where a freshly
 * created column should slot in. Han-Nôm convention: right-to-left
 * across X-bands (descending X-center), then top-to-bottom within an
 * X-band (where "same band" = the bboxes overlap on the X axis).
 *
 * Mirrors the helper of the same name in ColumnStep.tsx — keep them in
 * sync. Used here for region-OCR auto-column-creation.
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
      if (newCy < eCy) return i;
    } else {
      if (newCx > eCx) return i;
    }
  }
  return existing.length;
}

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

  /**
   * When set, char→column binding skips auto-detection and uses these
   * column rectangles in the supplied reading order (Step 1 confirmed).
   */
  confirmedColumns?: ConfirmedColumn[];
  /**
   * Optional setter for confirmed columns. When provided, region OCR
   * auto-creates a new column for any OCR'd rectangle whose chars
   * don't land inside an existing confirmed column. Without this prop
   * those chars become orphans.
   */
  onConfirmedColumnsChange?: (next: ConfirmedColumn[]) => void;
  /**
   * Per-character preprocessing for NNV calls. Applied to each 64×64
   * crop before sending pixels to the recognize endpoint. Plumbed down
   * to OCRImagePane (single-char Predict button) and to the kandi+nnv
   * region re-OCR pipeline.
   */
  perCharCropOptions?: PerCharCropOptions;
  /**
   * Called when an existing char's `text` is mutated (manual edit, NNV
   * replacement, region re-OCR replacing chars in place). Used by the
   * parent to invalidate Step 3 (`quocNguConfirmedAt`) — Quốc Ngữ
   * readings are keyed to the glyph, so any change means readings need
   * re-verification. Not called for adding/removing chars (those have
   * no prior reading to invalidate).
   */
  onCharTextChanged?: () => void;
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
  confirmedColumns,
  onConfirmedColumnsChange,
  perCharCropOptions,
  onCharTextChanged,
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
  // If `confirmedColumns` is supplied (Step 1 done), bucket chars into those
  // rather than running auto-clustering.
  const detectedColumns = useColumnDetection(
    spatialData,
    resolvedLayoutMode,
    confirmedColumns
  );
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
    const prev = spatialData.find((c) => c.offset === offset);
    const oldText = prev?.text;
    const textActuallyChanged = oldText !== undefined && oldText !== newText;
    const updated = spatialData.map((c) => {
      if (c.offset !== offset) return c;
      // Drop per-char Quốc Ngữ readings the moment the underlying glyph
      // changes — they were keyed to the old text. Keep all other fields
      // (bbox, choices, uncertain, ids, note, etc.) intact.
      if (textActuallyChanged) {
        const { quocNgu: _q, quocNguChoices: _qc, ...rest } = c;
        return { ...rest, text: newText };
      }
      return { ...c, text: newText };
    });
    onSpatialDataChange(updated);
    if (textActuallyChanged) onCharTextChanged?.();

    // Repetition nudge: if the user just made a meaningful correction and
    // the same (from,to) pair is either (a) recurring corpus-wide or (b)
    // already applied earlier in this session, surface a banner offering
    // to one-shot the remaining same-`from` cells on this page.
    if (
      oldText !== undefined &&
      oldText !== newText &&
      oldText.length > 0 &&
      newText.length > 0
    ) {
      const key = `${oldText}\t${newText}`;
      const sessionCount = (sessionPairCounts.get(key) ?? 0) + 1;
      const newCounts = new Map(sessionPairCounts);
      newCounts.set(key, sessionCount);
      setSessionPairCounts(newCounts);

      const corpusRecurring = (recurringCorrections[oldText] ?? []).some(
        (s) => s.to === newText
      );
      const triggers = sessionCount >= 2 || corpusRecurring;
      if (triggers) {
        const remaining = updated
          .filter((c) => c.offset !== offset && c.text === oldText && c.bbox)
          .map((c) => c.offset);
        if (remaining.length > 0) {
          setNudge({ from: oldText, to: newText, remainingOffsets: remaining });
        }
      }
    }
  }

  // ── Repetition-nudge state ──
  // Tracks (from\tto) → count of times this pair has been applied during the
  // current editing session, so we can fire a "save time?" banner the second
  // time it happens (or the first time if the pair is corpus-recurring).
  const [sessionPairCounts, setSessionPairCounts] = useState<Map<string, number>>(
    new Map()
  );
  const [nudge, setNudge] = useState<
    | { from: string; to: string; remainingOffsets: number[] }
    | null
  >(null);
  // Cursor into nudge.remainingOffsets for the "Review" button. Reset when
  // a new nudge appears so the user always starts at the first occurrence.
  const [nudgeReviewIndex, setNudgeReviewIndex] = useState(0);
  useEffect(() => {
    setNudgeReviewIndex(0);
  }, [nudge]);

  function applyNudgeToAll() {
    if (!nudge) return;
    const { to, remainingOffsets } = nudge;
    const offsets = new Set(remainingOffsets);
    const updated = spatialData.map((c) =>
      offsets.has(c.offset) ? { ...c, text: to } : c
    );
    onSpatialDataChange(updated);
    setNudge(null);
  }

  // Step through nudge.remainingOffsets one cell at a time, focusing each
  // and selecting its enclosing column so the user can see exactly where the
  // suggested correction would land before deciding to apply.
  function reviewNudgeNext() {
    if (!nudge || nudge.remainingOffsets.length === 0) return;
    const idx = nudgeReviewIndex % nudge.remainingOffsets.length;
    const off = nudge.remainingOffsets[idx];
    const colIdx = columns.findIndex((col) =>
      col.chars.some((c) => c.offset === off)
    );
    if (colIdx >= 0) handleSelectColumn(colIdx);
    onFocusedOffsetChange(off);
    setNudgeReviewIndex(idx + 1);
  }

  /**
   * Patch arbitrary fields on the focused char without touching `text`.
   * Used for the labeler-metadata fields (`uncertain`, `ids`, `note`).
   */
  function handleCharFieldsChange(
    offset: number,
    patch: Partial<SpatialCharacter>
  ) {
    const updated = spatialData.map((c) =>
      c.offset === offset ? { ...c, ...patch } : c
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
      off += Math.max(1, c.text.length);
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
      offset += Math.max(1, c.text.length);
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
      offset += Math.max(1, c.text.length);
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
        offset += Math.max(1, c.text.length);
      }
      onSpatialDataChange(updated);
    }

    onSelectColumnIndexChange(newColIndex);
  }

  function handleAddChar(
    bbox: Array<{ x: number; y: number }>,
    text: string,
    extras?: { choices?: string[]; confidence?: number; originalText?: string }
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

    const isEmpty = !text.trim();
    // Dedupe choices and drop the primary text from the alternate list so
    // the OCRToolbox doesn't show "predicted top-1" as both the primary
    // and an alternate option.
    const dedupedChoices = (() => {
      if (!extras?.choices || extras.choices.length === 0) return undefined;
      const seen = new Set<string>([text]);
      const out: string[] = [];
      for (const c of extras.choices) {
        if (!c || seen.has(c)) continue;
        seen.add(c);
        out.push(c);
      }
      return out.length > 0 ? out : undefined;
    })();
    const newChar: SpatialCharacter = {
      text,
      originalText: extras?.originalText ?? text,
      bbox,
      confidence:
        typeof extras?.confidence === "number"
          ? extras.confidence
          : isEmpty
          ? 0
          : 1.0,
      offset: 0,
      ...(isEmpty ? { uncertain: true } : {}),
      ...(dedupedChoices ? { choices: dedupedChoices } : {}),
    };
    const next = [...spatialData];
    next.splice(insertIndex, 0, newChar);
    let offset = 0;
    for (const c of next) {
      c.offset = offset;
      offset += Math.max(1, c.text.length);
    }
    onSpatialDataChange(next);
  }

  // ── Region OCR (re-OCR a drawn rectangle) ──

  async function handleOcrRegion(
    rect: {
      x: number;
      y: number;
      w: number;
      h: number;
    },
    engine: "kandi" | "kandi+nnv" = "kandi"
  ) {
    if (!imageUrl) return;

    // "Nôm Na" region button: don't re-detect — just refine the chars
    // whose existing kandi bbox falls inside the drawn rect via NNV.
    // Mirrors the page-level "Re-OCR with Nôm Na Việt" button: NNV
    // replaces primary text only when its top guess is a SIP Nôm
    // code point (handled inside rerecognizeWithNomNaViet).
    if (engine === "kandi+nnv") {
      const inRect = spatialData.filter((c) => {
        if (!c.bbox) return false;
        const xs = c.bbox.map((p) => p.x);
        const ys = c.bbox.map((p) => p.y);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
        return (
          cx >= rect.x &&
          cx <= rect.x + rect.w &&
          cy >= rect.y &&
          cy <= rect.y + rect.h
        );
      });
      if (inRect.length === 0) {
        // eslint-disable-next-line no-alert
        alert(
          "No existing Kandianguji characters inside that region. " +
            "Run Kandianguji first (page-level or region OCR), then re-run Nôm Na."
        );
        return;
      }
      try {
        const fullImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error("Failed to decode image for NNV"));
          el.src = imageUrl;
        });
        const rerec = await rerecognizeWithNomNaViet(fullImg, inRect, {
          concurrency: 1,
          slotJitterMs: 1000,
          perChar: perCharCropOptions,
        });
        const byOffset = new Map(rerec.spatialData.map((c) => [c.offset, c]));
        const next = spatialData.map((c) => byOffset.get(c.offset) ?? c);
        onSpatialDataChange(next);
        // NNV may have rewritten primary text on any of the chars it
        // touched — invalidate Step 3 if it was confirmed. The library
        // already strips per-char readings on chars whose text changed,
        // so this only fires the page-level signal.
        if (rerec.replacements.some((r) => r.changed)) {
          onCharTextChanged?.();
        }
      } catch (e: any) {
        // eslint-disable-next-line no-alert
        alert(
          `Nôm Na Việt re-OCR failed: ${e?.message ?? "unknown error"}. Existing characters left unchanged.`
        );
      }
      return;
    }

    try {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
      const blob = await imgRes.blob();

      const croppedBlob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const sx = Math.round(rect.x * img.naturalWidth);
          const sy = Math.round(rect.y * img.naturalHeight);
          const sw = Math.round(rect.w * img.naturalWidth);
          const sh = Math.round(rect.h * img.naturalHeight);
          if (sw < 4 || sh < 4) {
            return reject(
              new Error(
                `Region too small (${sw}×${sh} px). Drag a bigger box.`
              )
            );
          }
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
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `OCR call failed (HTTP ${res.status})`);
      }
      const data = await res.json();
      const regionChars: SpatialCharacter[] = data.spatialData ?? [];
      const charsWithBbox = regionChars.filter((c) => c.bbox);
      if (charsWithBbox.length === 0) {
        // eslint-disable-next-line no-alert
        alert(
          "Region OCR finished but Kandianguji didn't detect any characters. " +
            "Try a larger or higher-contrast region, or zoom in."
        );
        return;
      }

      const remapped: SpatialCharacter[] = charsWithBbox.map((c) => ({
        ...c,
        bbox: c.bbox!.map((v) => ({
          x: rect.x + v.x * rect.w,
          y: rect.y + v.y * rect.h,
        })),
      }));

      // If the new chars don't fall inside any existing confirmed
      // column, auto-create one for the OCR'd region so they're not
      // orphaned. Skipped when there's no confirmed-columns setter
      // wired up (caller doesn't want us to mutate column state).
      let nextConfirmedColumns = confirmedColumns;
      if (onConfirmedColumnsChange) {
        const insideExisting = remapped.some((c) => {
          if (!c.bbox) return false;
          const xs = c.bbox.map((p) => p.x);
          const ys = c.bbox.map((p) => p.y);
          const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
          const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
          return (confirmedColumns ?? []).some((col) => {
            const b = col.bbox;
            return cx >= b.minX && cx <= b.maxX && cy >= b.minY && cy <= b.maxY;
          });
        });
        if (!insideExisting) {
          const newCol: ConfirmedColumn = {
            bbox: {
              minX: rect.x,
              maxX: rect.x + rect.w,
              minY: rect.y,
              maxY: rect.y + rect.h,
            },
            kind: "text",
          };
          const insertAt = findReadingOrderInsertIndex(
            newCol,
            confirmedColumns ?? []
          );
          const existing = confirmedColumns ?? [];
          nextConfirmedColumns = [
            ...existing.slice(0, insertAt),
            newCol,
            ...existing.slice(insertAt),
          ];
          onConfirmedColumnsChange(nextConfirmedColumns);
        }
      }

      // Re-bin the merged char list into the (possibly newly extended)
      // confirmed columns so new chars get inserted in the right
      // reading-order slot. Falls back to auto-detect when no columns
      // are confirmed yet.
      const merged = [...spatialData, ...remapped];
      const reordered = reorderByColumns(
        merged,
        "auto",
        nextConfirmedColumns
      );
      onSpatialDataChange(reordered);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("Region OCR failed:", e);
      // eslint-disable-next-line no-alert
      alert(`Region OCR failed: ${e?.message ?? "unknown error"}`);
    }
  }

  // ── Recurring-correction suggestions ──
  // Pre-fetched once at mount: a map from `from`-text → ranked list of
  // `to`-suggestions the user has applied at least N times across the corpus.
  // OCRImagePane consults this per cell to flag chars that match a known
  // recurring confusion ("you've corrected 月 → 肉 47 times — apply?").
  const [recurringCorrections, setRecurringCorrections] = useState<
    Record<string, Array<{ to: string; totalChars: number }>>
  >({});
  useEffect(() => {
    let cancelled = false;
    fetch("/api/recurring-corrections?threshold=2")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (!cancelled) setRecurringCorrections(data ?? {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

      // Use e.code for physical-key detection so IMEs (e.g. Vietnamese
      // Telex) don't mask the keystroke as `e.key === "Process"`.
      // We intentionally fire even while IME composition flags are set,
      // because Windows Telex reports `isComposing === true` more
      // aggressively than the spec implies — gating on it broke the
      // hotkey under native Telex. Tradeoff: pinyin/Wubi candidate
      // pickers also bind 1-9, so users on those IMEs need to commit
      // their composition (space/enter) before our hotkey applies.
      // The beforeinput shield below stops the digit from leaking
      // into the next box after focus advances.
      const digitMatch = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
      const isPlainDigit =
        digitMatch !== null && !e.ctrlKey && !e.metaKey && !e.altKey;

      // Digit 1–9 — replace focused char with the Nth alternate candidate
      // and advance focus to the next char (mirrors ArrowDown behaviour).
      if (focusedOffset !== null && isPlainDigit) {
        const focusedChar = spatialData.find((c) => c.offset === focusedOffset);
        const choices = (focusedChar as any)?.choices as string[] | undefined;
        const digit = digitMatch![1];
        const candidate = choices?.[parseInt(digit, 10) - 1];
        if (candidate) {
          e.preventDefault();
          // IME guard: Windows Vietnamese Telex commits any pending
          // composition AND queues input events for the digit itself
          // that fire *after* this handler returns. preventDefault on
          // the keydown doesn't cancel those queued events, so the
          // digit lands in whichever input is focused at flush time —
          // i.e. the *next* box once we advance focus below.
          //
          // Strategy: stash the destination char's expected text on a
          // window flag. On the first input event that hits the new
          // input within 300ms, snap its value back to the expected
          // text and propagate via React-aware setter so onChange
          // syncs parent state. Catches Telex regardless of inputType
          // or whether the digit is sent solo or appended to a vowel.
          const handleStrayInput = (ev: Event) => {
            const tgt = ev.target as HTMLInputElement | null;
            if (!tgt || !tgt.hasAttribute("data-char-offset")) return;
            const expected = (tgt as any).__digitHotkeyExpected as
              | string
              | undefined;
            if (expected === undefined) return;
            // Strip any occurrence of the digit that snuck in.
            const cleaned = tgt.value.split(digit).join("");
            if (cleaned === expected) {
              // Nothing to do beyond preventing a re-fire.
              if (ev.type === "beforeinput") ev.preventDefault();
              return;
            }
            // Use the React-aware native value setter so React's
            // synthetic onChange picks up the correction.
            const setter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              "value"
            )?.set;
            setter?.call(tgt, cleaned || expected);
            tgt.dispatchEvent(new Event("input", { bubbles: true }));
            if (ev.type === "beforeinput") ev.preventDefault();
          };
          window.addEventListener("beforeinput", handleStrayInput, true);
          window.addEventListener("input", handleStrayInput, true);
          const cleanupShield = () => {
            window.removeEventListener("beforeinput", handleStrayInput, true);
            window.removeEventListener("input", handleStrayInput, true);
            // Drop the marker from whichever input we tagged.
            document
              .querySelectorAll<HTMLInputElement>("[data-char-offset]")
              .forEach((el) => {
                delete (el as any).__digitHotkeyExpected;
              });
          };
          setTimeout(cleanupShield, 300);

          handleSuggestApply(focusedOffset, candidate);
          if (selectedColumnIndex !== null) {
            const col = columns[selectedColumnIndex];
            if (col) {
              const bboxChars = col.chars.filter((c) => c.bbox);
              const idx = bboxChars.findIndex((c) => c.offset === focusedOffset);
              const next = bboxChars[idx + 1];
              if (next) {
                // Tag the next input with its expected (pre-IME) value
                // so the shield knows what to snap it back to.
                queueMicrotask(() => {
                  const el = document.querySelector<HTMLInputElement>(
                    `[data-char-offset="${next.offset}"]`
                  );
                  if (el) (el as any).__digitHotkeyExpected = next.text;
                });
                onFocusedOffsetChange(next.offset);
              } else if (selectedColumnIndex < columns.length - 1) {
                handleSelectColumn(selectedColumnIndex + 1);
              }
            }
          }
          return;
        }
      }

      // Backtick (`) — toggle the focused char's labeler `uncertain` flag.
      // Works inside OCR cell inputs too (we hijack before the input
      // would receive the keystroke). Backtick is never a Han-Nôm
      // character, so it's safe to hijack unconditionally — must run
      // before the IME guard below, since IMEs like Weasel/Rime can
      // mark backtick keydowns as composing (keyCode 229, key="Process").
      if (
        focusedOffset !== null &&
        !e.ctrlKey && !e.metaKey && !e.altKey &&
        (e.key === "`" || e.code === "Backquote")
      ) {
        e.preventDefault();
        const focusedChar = spatialData.find((c) => c.offset === focusedOffset);
        if (focusedChar) {
          handleCharFieldsChange(focusedOffset, {
            uncertain: !focusedChar.uncertain,
          });
        }
        return;
      }

      // While an IME composition is active (e.g. Vietnamese Telex), don't
      // intercept further keys — they're part of the composition and
      // hijacking them corrupts the IME's state machine.
      if (e.isComposing || (e as any).keyCode === 229) return;

      // Let the cell input keep handling its own Tab / Enter / arrows.
      if (isOcrCellInput) return;

      // Tab from "nothing focused" jumps into the first char of the first
      // column. Only fires when we have data — otherwise let the browser's
      // default Tab behaviour run.
      if (
        e.key === "Tab" &&
        !e.shiftKey &&
        focusedOffset === null &&
        columns.length > 0
      ) {
        for (let ci = 0; ci < columns.length; ci++) {
          const firstChar = columns[ci].chars.find((c) => c.bbox);
          if (firstChar) {
            e.preventDefault();
            handleSelectColumn(ci);
            onFocusedOffsetChange(firstChar.offset);
            return;
          }
        }
      }

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
    // Backtick shield: IMEs like Weasel/Rime queue the character via
    // beforeinput/input events that fire AFTER the keydown handler returns,
    // so preventDefault on keydown alone doesn't stop the ` from landing in
    // the cell. Swallow any backtick insertion on data-char-offset inputs.
    // Backtick is never a valid Han-Nôm char, so unconditional rejection
    // is safe.
    function handleBeforeInput(e: Event) {
      const ev = e as InputEvent;
      const tgt = ev.target as HTMLElement | null;
      if (!tgt || tgt.tagName !== "INPUT") return;
      if (!tgt.hasAttribute("data-char-offset")) return;
      const data = ev.data;
      if (data && data.includes("`")) ev.preventDefault();
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeinput", handleBeforeInput, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeinput", handleBeforeInput, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColumnIndex, focusedOffset, columns, spatialData]);

  // ── Toolbox callbacks (in-memory variants) ──

  function handleDeleteOrphans() {
    const orphanOffsets = new Set(orphanedChars.map((c) => c.offset));
    const next = spatialData.filter((c) => !orphanOffsets.has(c.offset));
    let offset = 0;
    for (const c of next) {
      c.offset = offset;
      offset += Math.max(1, c.text.length);
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
      {nudge && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
          }}
          className="flex items-center gap-3 px-4 py-2 bg-fuchsia-50 border border-fuchsia-300 rounded-lg shadow-lg text-sm"
        >
          <span className="text-gray-700">
            You corrected{" "}
            <span className="font-han-nom font-semibold">{nudge.from}</span> →{" "}
            <span className="font-han-nom font-semibold">{nudge.to}</span>.{" "}
            <span className="text-gray-500">
              {nudge.remainingOffsets.length} other{" "}
              {nudge.remainingOffsets.length === 1 ? "cell has" : "cells have"}{" "}
              <span className="font-han-nom">{nudge.from}</span> on this page.
            </span>
          </span>
          <button
            type="button"
            onClick={reviewNudgeNext}
            title="Jump to each occurrence one at a time so you can verify before applying"
            className="px-2 py-1 text-xs font-medium rounded border border-fuchsia-400 text-fuchsia-700 hover:bg-fuchsia-100"
          >
            Review{" "}
            {(nudgeReviewIndex % nudge.remainingOffsets.length) + 1}/
            {nudge.remainingOffsets.length}
          </button>
          <button
            type="button"
            onClick={applyNudgeToAll}
            className="px-2 py-1 text-xs font-medium rounded bg-fuchsia-600 text-white hover:bg-fuchsia-700"
          >
            Apply to {nudge.remainingOffsets.length}
          </button>
          <button
            type="button"
            onClick={() => setNudge(null)}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
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
            onDeleteChar={handleDeleteChar}
            onFocusChar={onFocusedOffsetChange}
            onAddChar={handleAddChar}
            recurringCorrections={recurringCorrections}
            onOcrRegion={handleOcrRegion}
            focusedOffset={focusedOffset}
            viewMode={viewMode}
            onMoveColumn={handleMoveColumn}
            onResizeColumn={handleResizeColumn}
            onDeleteColumn={handleDeleteColumn}
            onCreateColumn={handleCreateColumn}
            perCharCropOptions={perCharCropOptions}
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
          onCharFieldsChange={handleCharFieldsChange}
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
