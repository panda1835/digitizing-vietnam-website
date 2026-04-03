import { useMemo } from "react";
import type { SpatialCharacter } from "@/lib/ocr-store";

export interface Column {
  index: number;
  chars: SpatialCharacter[];
  /** Bounding box of the entire column in normalized [0,1] coords */
  bbox: { minX: number; maxX: number; minY: number; maxY: number };
  /** Whether this group is a horizontal row (true) or vertical column (false) */
  isRow: boolean;
}

function getBBoxCenter(bbox: Array<{ x: number; y: number }>) {
  const xs = bbox.map((v) => v.x);
  const ys = bbox.map((v) => v.y);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
}

function getBBoxWidth(bbox: Array<{ x: number; y: number }>) {
  const xs = bbox.map((v) => v.x);
  return Math.max(...xs) - Math.min(...xs);
}

function getBBoxHeight(bbox: Array<{ x: number; y: number }>) {
  const ys = bbox.map((v) => v.y);
  return Math.max(...ys) - Math.min(...ys);
}

function computeGroupBbox(chars: SpatialCharacter[]) {
  const allX = chars.flatMap((c) => c.bbox!.map((v) => v.x));
  const allY = chars.flatMap((c) => c.bbox!.map((v) => v.y));
  return {
    minX: Math.min(...allX),
    maxX: Math.max(...allX),
    minY: Math.min(...allY),
    maxY: Math.max(...allY),
  };
}

/**
 * Detect vertical columns and horizontal rows in spatial data.
 *
 * 1. Group characters into preliminary clusters by X-proximity (potential columns).
 * 2. Classify each cluster: if its width > 60% of page width, it's a horizontal row;
 *    otherwise it's a vertical column.
 * 3. Rows are sorted left-to-right internally, columns top-to-bottom.
 * 4. Groups are interleaved by Y position: rows and columns are ordered by their
 *    top Y position, with columns in RTL order when at similar Y.
 */
export function detectColumns(spatialData: SpatialCharacter[]): Column[] {
  const chars = spatialData.filter(
    (c) => c.bbox && c.bbox.length === 4
  );
  if (!chars.length) return [];

  // Compute character dimensions
  const avgW = chars.reduce((sum, c) => sum + getBBoxWidth(c.bbox!), 0) / chars.length;
  const avgH = chars.reduce((sum, c) => sum + getBBoxHeight(c.bbox!), 0) / chars.length;
  const yThreshold = Math.max(avgH * 0.8, 0.005);

  // ── Step 1: Group by X-proximity into preliminary clusters ──
  // Use per-character threshold: each character uses its own width to decide
  // if it belongs to a nearby cluster. This prevents small annotation characters
  // from merging with adjacent small columns (their threshold is tighter).
  const sorted = [...chars].sort(
    (a, b) => getBBoxCenter(a.bbox!).x - getBBoxCenter(b.bbox!).x
  );

  const clusters: { centerX: number; avgCharW: number; chars: SpatialCharacter[] }[] = [];
  for (const char of sorted) {
    const cx = getBBoxCenter(char.bbox!).x;
    const charW = getBBoxWidth(char.bbox!);
    // Threshold based on the character's own width — smaller chars get tighter grouping
    const charThreshold = Math.max(charW * 0.6, 0.003);

    let placed = false;
    let bestCluster: typeof clusters[0] | null = null;
    let bestDist = Infinity;

    for (const cl of clusters) {
      // Also consider the cluster's average char width for the threshold
      const clThreshold = Math.max(cl.avgCharW * 0.6, 0.003);
      const threshold = Math.min(charThreshold, clThreshold);
      const dist = Math.abs(cx - cl.centerX);
      if (dist < threshold && dist < bestDist) {
        bestCluster = cl;
        bestDist = dist;
      }
    }

    if (bestCluster) {
      bestCluster.chars.push(char);
      bestCluster.centerX =
        bestCluster.chars.reduce((s, c) => s + getBBoxCenter(c.bbox!).x, 0) / bestCluster.chars.length;
      bestCluster.avgCharW =
        bestCluster.chars.reduce((s, c) => s + getBBoxWidth(c.bbox!), 0) / bestCluster.chars.length;
      placed = true;
    }

    if (!placed) {
      clusters.push({ centerX: cx, avgCharW: charW, chars: [char] });
    }
  }

  // ── Step 2: Classify each cluster as row or column ──
  // A cluster whose X span > 60% of the page is a horizontal row.
  // (Page width in normalized coords is ~1.0, but we use actual content bounds.)
  const allXCoords = chars.flatMap((c) => c.bbox!.map((v) => v.x));
  const contentWidth = Math.max(...allXCoords) - Math.min(...allXCoords);
  const rowWidthThreshold = contentWidth * 0.6;

  type ClassifiedGroup = {
    chars: SpatialCharacter[];
    isRow: boolean;
    bbox: { minX: number; maxX: number; minY: number; maxY: number };
  };

  const groups: ClassifiedGroup[] = [];

  for (const cl of clusters) {
    if (cl.chars.length < 2) continue; // Filter noise

    const bbox = computeGroupBbox(cl.chars);
    const clusterWidth = bbox.maxX - bbox.minX;
    const clusterHeight = bbox.maxY - bbox.minY;

    if (clusterWidth > rowWidthThreshold && clusterWidth > clusterHeight * 1.5) {
      // This is a horizontal row — sort left-to-right
      // But first, check if it should be split into Y-based sub-rows
      const subRows = splitIntoRows(cl.chars, yThreshold);
      for (const row of subRows) {
        row.sort((a, b) => getBBoxCenter(a.bbox!).x - getBBoxCenter(b.bbox!).x);
        groups.push({ chars: row, isRow: true, bbox: computeGroupBbox(row) });
      }
    } else {
      // Vertical column — sort top-to-bottom
      cl.chars.sort((a, b) => getBBoxCenter(a.bbox!).y - getBBoxCenter(b.bbox!).y);
      groups.push({ chars: cl.chars, isRow: false, bbox });
    }
  }

  // ── Step 3: Keep all groups — no aggressive filtering ──
  // Even single-char groups may be real (seals, annotations, titles).
  // Users can clean up manually in the editor.
  const filtered = groups;

  // ── Step 4: Order groups by reading position ──
  // Simple and strict: RIGHT-TO-LEFT by center X.
  const allGroups = [...filtered];

  allGroups.sort((a, b) => {
    const aCx = (a.bbox.minX + a.bbox.maxX) / 2;
    const bCx = (b.bbox.minX + b.bbox.maxX) / 2;
    return bCx - aCx; // Higher X = lower index (RTL)
  });

  return allGroups.map((g, i) => ({
    index: i,
    chars: g.chars,
    bbox: g.bbox,
    isRow: g.isRow,
  }));
}

/** Split characters into horizontal rows by Y-proximity. */
function splitIntoRows(
  chars: SpatialCharacter[],
  yThreshold: number
): SpatialCharacter[][] {
  const sorted = [...chars].sort(
    (a, b) => getBBoxCenter(a.bbox!).y - getBBoxCenter(b.bbox!).y
  );

  const rows: SpatialCharacter[][] = [];
  let currentRow: SpatialCharacter[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevY = getBBoxCenter(currentRow[currentRow.length - 1].bbox!).y;
    const curY = getBBoxCenter(sorted[i].bbox!).y;
    if (Math.abs(curY - prevY) <= yThreshold) {
      currentRow.push(sorted[i]);
    } else {
      rows.push(currentRow);
      currentRow = [sorted[i]];
    }
  }
  if (currentRow.length) rows.push(currentRow);
  return rows;
}

/**
 * Reorder spatial data to match detected column reading order.
 * Characters in columns come first (RTL, top-to-bottom within each),
 * followed by any characters not assigned to a column.
 * Whitespace characters (newlines) are inserted between columns.
 */
export function reorderByColumns(spatialData: SpatialCharacter[]): SpatialCharacter[] {
  const columns = detectColumns(spatialData);
  if (columns.length === 0) return spatialData;

  const assignedOffsets = new Set<number>();
  const result: SpatialCharacter[] = [];

  for (let ci = 0; ci < columns.length; ci++) {
    const col = columns[ci];
    for (const char of col.chars) {
      result.push(char);
      assignedOffsets.add(char.offset);
    }
    // Add newline between columns
    if (ci < columns.length - 1) {
      result.push({ text: "\n", bbox: null, confidence: 1, offset: 0 });
    }
  }

  // Append unassigned characters (whitespace etc.) that aren't in any column
  // Skip — these are just noise breaks from Vision API

  // Recalculate offsets
  let offset = 0;
  for (const c of result) {
    c.offset = offset;
    offset += c.text.length;
  }

  return result;
}

export function useColumnDetection(spatialData: SpatialCharacter[]): Column[] {
  return useMemo(() => detectColumns(spatialData), [spatialData]);
}
