import { useMemo } from "react";
import type { SpatialCharacter, ColumnSection } from "@/lib/ocr-store";

export type LayoutMode = "simple" | "commentary";

export interface Column {
  index: number;
  chars: SpatialCharacter[];
  bbox: { minX: number; maxX: number; minY: number; maxY: number };
  isRow: boolean;
  sections: ColumnSection[];
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

function getBBoxArea(bbox: Array<{ x: number; y: number }>) {
  return getBBoxWidth(bbox) * getBBoxHeight(bbox);
}

/**
 * Sort comparator: top-to-bottom by Y, with RTL (right-to-left) tiebreak
 * for characters at the same vertical level. This matches the reading order
 * of traditional Chinese/Han-Nôm vertical text.
 */
function compareTopDownRTL(a: SpatialCharacter, b: SpatialCharacter): number {
  const ay = getBBoxCenter(a.bbox!).y;
  const by = getBBoxCenter(b.bbox!).y;
  const avgH = (getBBoxHeight(a.bbox!) + getBBoxHeight(b.bbox!)) / 2;
  if (Math.abs(ay - by) < avgH * 0.5) {
    return getBBoxCenter(b.bbox!).x - getBBoxCenter(a.bbox!).x;
  }
  return ay - by;
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

// ── Section detection ──

/**
 * Reorder characters that may form a dual-column layout.
 * If the X-range is wide enough, split into right/left sub-columns and
 * read right column top-to-bottom, then left column top-to-bottom.
 * Otherwise treat as a single column sorted top-to-bottom with RTL tiebreak.
 * Works for both main text and commentary — the logic is size-agnostic.
 */
function reorderDualColumn(chars: SpatialCharacter[]): SpatialCharacter[] {
  if (chars.length <= 1) return chars;

  const xs = chars.map((c) => getBBoxCenter(c.bbox!).x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const xRange = maxX - minX;

  const avgW = chars.reduce((s, c) => s + getBBoxWidth(c.bbox!), 0) / chars.length;
  if (xRange < avgW * 0.6) {
    return [...chars].sort(compareTopDownRTL);
  }

  // Split into rows by Y-proximity
  const avgH = chars.reduce((s, c) => s + getBBoxHeight(c.bbox!), 0) / chars.length;
  const rowThreshold = avgH * 0.5;
  const ySorted = [...chars].sort((a, b) => getBBoxCenter(a.bbox!).y - getBBoxCenter(b.bbox!).y);
  const rows: SpatialCharacter[][] = [[ySorted[0]]];
  for (let i = 1; i < ySorted.length; i++) {
    const prevY = getBBoxCenter(rows[rows.length - 1][rows[rows.length - 1].length - 1].bbox!).y;
    const curY = getBBoxCenter(ySorted[i].bbox!).y;
    if (Math.abs(curY - prevY) < rowThreshold) {
      rows[rows.length - 1].push(ySorted[i]);
    } else {
      rows.push([ySorted[i]]);
    }
  }

  // Process rows in order. Accumulate consecutive multi-char rows into
  // dual-column blocks (read right-col-then-left-col). Single-char rows
  // are output directly.
  const result: SpatialCharacter[] = [];
  let blockStart = -1;

  function flushBlock(endExclusive: number) {
    if (blockStart < 0) return;
    // Collect all chars in the block
    const blockChars: SpatialCharacter[] = [];
    for (let i = blockStart; i < endExclusive; i++) {
      blockChars.push(...rows[i]);
    }
    if (blockChars.length === 0) {
      blockStart = -1;
      return;
    }
    // Split block into right/left sub-columns by xMid
    const blockXs = blockChars.map((c) => getBBoxCenter(c.bbox!).x);
    const blockXMid = (Math.min(...blockXs) + Math.max(...blockXs)) / 2;
    const rightCol = blockChars.filter((c) => getBBoxCenter(c.bbox!).x >= blockXMid);
    const leftCol = blockChars.filter((c) => getBBoxCenter(c.bbox!).x < blockXMid);
    rightCol.sort(compareTopDownRTL);
    leftCol.sort(compareTopDownRTL);
    result.push(...rightCol, ...leftCol);
    blockStart = -1;
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.length >= 2) {
      // Multi-char row — start or extend a dual-column block
      if (blockStart < 0) blockStart = i;
    } else {
      // Single-char row — flush any pending block, then output the char
      flushBlock(i);
      result.push(row[0]);
    }
  }
  flushBlock(rows.length);

  return result;
}

/**
 * K-means (k=2) clustering on character areas to find a global size threshold
 * separating main text from commentary. Returns null if no clear bimodal distribution.
 */
function computeGlobalSizeThreshold(allChars: SpatialCharacter[]): number | null {
  const withBbox = allChars.filter((c) => c.bbox);
  if (withBbox.length < 6) return null;

  const areas = withBbox.map((c) => getBBoxArea(c.bbox!));
  const sorted = [...areas].sort((a, b) => a - b);

  let c1 = sorted[Math.floor(sorted.length * 0.25)];
  let c2 = sorted[Math.floor(sorted.length * 0.75)];

  for (let iter = 0; iter < 20; iter++) {
    const group1: number[] = [];
    const group2: number[] = [];

    for (const a of areas) {
      if (Math.abs(a - c1) <= Math.abs(a - c2)) group1.push(a);
      else group2.push(a);
    }

    if (group1.length === 0 || group2.length === 0) return null;

    const newC1 = group1.reduce((s, v) => s + v, 0) / group1.length;
    const newC2 = group2.reduce((s, v) => s + v, 0) / group2.length;

    if (Math.abs(newC1 - c1) < 1e-10 && Math.abs(newC2 - c2) < 1e-10) break;
    c1 = newC1;
    c2 = newC2;
  }

  const smallCenter = Math.min(c1, c2);
  const largeCenter = Math.max(c1, c2);

  if (largeCenter < smallCenter * 1.8) {
    // K-means didn't find a clear bimodal distribution, but there may be
    // individual outlier chars that are much smaller than the rest.
    // Use median * 0.5 as a fallback threshold for extreme outliers.
    const median = sorted[Math.floor(sorted.length / 2)];
    const outliers = areas.filter((a) => a < median * 0.5);
    if (outliers.length > 0) return median * 0.5;
    return null;
  }

  return (smallCenter + largeCenter) / 2;
}

function detectSections(
  chars: SpatialCharacter[],
  globalThreshold: number | null
): ColumnSection[] {
  const withBbox = chars.filter((c) => c.bbox);
  if (withBbox.length < 3) {
    return [makeSingleSection("main", chars, 0)];
  }
  if (globalThreshold === null) {
    return [makeSingleSection("main", chars, 0)];
  }

  const mainChars = withBbox.filter((c) => getBBoxArea(c.bbox!) >= globalThreshold);
  const avgMainH =
    mainChars.length > 0
      ? mainChars.reduce((s, c) => s + getBBoxHeight(c.bbox!), 0) / mainChars.length
      : 0.05;

  const ySorted = [...withBbox].sort(compareTopDownRTL);

  type LabeledChar = { char: SpatialCharacter; label: "main" | "commentary" };
  const labeled: LabeledChar[] = ySorted.map((c) => ({
    char: c,
    label: getBBoxArea(c.bbox!) < globalThreshold ? "commentary" : "main",
  }));

  const rawSections: { label: "main" | "commentary"; chars: SpatialCharacter[] }[] = [];
  let curLabel = labeled[0].label;
  let curChars: SpatialCharacter[] = [labeled[0].char];

  for (let i = 1; i < labeled.length; i++) {
    const prevY = getBBoxCenter(labeled[i - 1].char.bbox!).y;
    const curY = getBBoxCenter(labeled[i].char.bbox!).y;
    const hasGap = curY - prevY > avgMainH * 2.0;

    if (labeled[i].label !== curLabel || hasGap) {
      rawSections.push({ label: curLabel, chars: curChars });
      curLabel = labeled[i].label;
      curChars = [labeled[i].char];
    } else {
      curChars.push(labeled[i].char);
    }
  }
  rawSections.push({ label: curLabel, chars: curChars });

  // Absorb single-char commentary sections flanked by main — but only if
  // the char's area is close to main text size (not a true outlier)
  for (let i = 1; i < rawSections.length - 1; i++) {
    const sec = rawSections[i];
    if (
      sec.label === "commentary" &&
      sec.chars.length === 1 &&
      rawSections[i - 1].label === "main" &&
      rawSections[i + 1].label === "main"
    ) {
      // Only absorb if the char is NOT dramatically smaller than main text
      const charArea = sec.chars[0].bbox ? getBBoxArea(sec.chars[0].bbox) : 0;
      if (charArea >= globalThreshold * 0.8) {
        sec.label = "main";
      }
      // Otherwise keep as commentary — it's a genuine small char like 臣
    }
  }

  // Merge consecutive same-label sections
  const merged: { label: "main" | "commentary"; chars: SpatialCharacter[] }[] = [];
  for (const sec of rawSections) {
    if (merged.length > 0 && merged[merged.length - 1].label === sec.label) {
      merged[merged.length - 1].chars.push(...sec.chars);
    } else {
      merged.push({ label: sec.label, chars: [...sec.chars] });
    }
  }

  return merged.map((sec, i) => {
    const sectionChars = reorderDualColumn(sec.chars);
    return {
      type: sec.label,
      chars: sectionChars,
      bbox: computeGroupBbox(sectionChars),
      sectionIndex: i,
    };
  });
}

function makeSingleSection(
  type: "main" | "commentary",
  chars: SpatialCharacter[],
  index: number
): ColumnSection {
  const withBbox = chars.filter((c) => c.bbox);
  return {
    type,
    chars,
    bbox: withBbox.length > 0
      ? computeGroupBbox(withBbox)
      : { minX: 0, maxX: 0, minY: 0, maxY: 0 },
    sectionIndex: index,
  };
}

// ── Column detection ──

export function detectColumns(
  spatialData: SpatialCharacter[],
  layoutMode: LayoutMode = "simple"
): Column[] {
  const chars = spatialData.filter(
    (c) => c.bbox && c.bbox.length === 4
  );
  if (!chars.length) return [];

  const avgH = chars.reduce((sum, c) => sum + getBBoxHeight(c.bbox!), 0) / chars.length;
  const yThreshold = Math.max(avgH * 0.8, 0.005);

  // Step 1: Group by X-proximity
  const sorted = [...chars].sort(
    (a, b) => getBBoxCenter(a.bbox!).x - getBBoxCenter(b.bbox!).x
  );

  const clusters: { centerX: number; minX: number; maxX: number; avgCharW: number; chars: SpatialCharacter[] }[] = [];
  for (const char of sorted) {
    const cx = getBBoxCenter(char.bbox!).x;
    const charW = getBBoxWidth(char.bbox!);
    const charMinX = Math.min(...char.bbox!.map((v) => v.x));
    const charMaxX = Math.max(...char.bbox!.map((v) => v.x));
    const charThreshold = Math.max(charW * 0.6, 0.003);

    let bestCluster: typeof clusters[0] | null = null;
    let bestDist = Infinity;

    for (const cl of clusters) {
      const clThreshold = Math.max(cl.avgCharW * 0.6, 0.003);
      const threshold = Math.max(charThreshold, clThreshold);
      const dist = Math.abs(cx - cl.centerX);

      const pad = cl.avgCharW * 0.3;
      const withinBounds = cx >= cl.minX - pad && cx <= cl.maxX + pad;

      if ((dist < threshold || withinBounds) && dist < bestDist) {
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
      bestCluster.minX = Math.min(bestCluster.minX, charMinX);
      bestCluster.maxX = Math.max(bestCluster.maxX, charMaxX);
    } else {
      clusters.push({ centerX: cx, minX: charMinX, maxX: charMaxX, avgCharW: charW, chars: [char] });
    }
  }

  // Step 1b: Merge adjacent narrow commentary sub-columns
  if (layoutMode === "commentary" && clusters.length > 1) {
    const allCharWidths = chars.map((c) => getBBoxWidth(c.bbox!)).sort((a, b) => a - b);
    const mainCharWidth = allCharWidths[Math.floor(allCharWidths.length * 0.75)];

    clusters.sort((a, b) => a.centerX - b.centerX);
    let i = 0;
    while (i < clusters.length - 1) {
      const left = clusters[i];
      const right = clusters[i + 1];
      const leftWidth = left.maxX - left.minX;
      const rightWidth = right.maxX - right.minX;
      const combinedWidth = right.maxX - left.minX;
      const gap = right.minX - left.maxX;

      const bothNarrow = leftWidth < mainCharWidth * 1.0 && rightWidth < mainCharWidth * 1.0;
      const smallGap = gap < mainCharWidth * 0.5;
      const combinedFits = combinedWidth < mainCharWidth * 2.0;

      if (bothNarrow && smallGap && combinedFits) {
        left.chars.push(...right.chars);
        left.centerX =
          left.chars.reduce((s, c) => s + getBBoxCenter(c.bbox!).x, 0) / left.chars.length;
        left.avgCharW =
          left.chars.reduce((s, c) => s + getBBoxWidth(c.bbox!), 0) / left.chars.length;
        left.minX = Math.min(left.minX, right.minX);
        left.maxX = Math.max(left.maxX, right.maxX);
        clusters.splice(i + 1, 1);
      } else {
        i++;
      }
    }
  }

  // Step 2: Classify clusters as rows or columns
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
    const bbox = computeGroupBbox(cl.chars);
    const clusterWidth = bbox.maxX - bbox.minX;
    const clusterHeight = bbox.maxY - bbox.minY;

    if (cl.chars.length >= 2 && clusterWidth > rowWidthThreshold && clusterWidth > clusterHeight * 1.5) {
      const subRows = splitIntoRows(cl.chars, yThreshold);
      for (const row of subRows) {
        row.sort((a, b) => getBBoxCenter(a.bbox!).x - getBBoxCenter(b.bbox!).x);
        groups.push({ chars: row, isRow: true, bbox: computeGroupBbox(row) });
      }
    } else {
      cl.chars.sort(compareTopDownRTL);
      groups.push({ chars: cl.chars, isRow: false, bbox });
    }
  }

  // Step 3: Order RIGHT-TO-LEFT
  const allGroups = [...groups];
  allGroups.sort((a, b) => {
    const aCx = (a.bbox.minX + a.bbox.maxX) / 2;
    const bCx = (b.bbox.minX + b.bbox.maxX) / 2;
    return bCx - aCx;
  });

  // Step 4: Compute global size threshold
  const globalThreshold = layoutMode === "commentary"
    ? computeGlobalSizeThreshold(chars)
    : null;

  // Step 5: Build columns with sections
  return allGroups.map((g, i) => {
    let sections: ColumnSection[];
    if (g.isRow || layoutMode === "simple") {
      sections = [makeSingleSection("main", g.chars, 0)];
    } else {
      sections = detectSections(g.chars, globalThreshold);
    }

    const flatChars = sections.flatMap((s) => s.chars);

    return {
      index: i,
      chars: flatChars,
      bbox: g.bbox,
      isRow: g.isRow,
      sections,
    };
  });
}

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
 */
export function reorderByColumns(
  spatialData: SpatialCharacter[],
  layoutMode: LayoutMode = "simple"
): SpatialCharacter[] {
  const columns = detectColumns(spatialData, layoutMode);
  if (columns.length === 0) return spatialData;

  const inColumn = new Set<SpatialCharacter>();
  for (const col of columns) {
    for (const char of col.chars) inColumn.add(char);
  }

  const result: SpatialCharacter[] = [];

  for (let ci = 0; ci < columns.length; ci++) {
    const col = columns[ci];
    for (const char of col.chars) result.push(char);
    if (ci < columns.length - 1) {
      result.push({ text: "\n", bbox: null, confidence: 1, offset: 0 });
    }
  }

  let offset = 0;
  for (const c of result) {
    c.offset = offset;
    offset += c.text.length;
  }

  return result;
}

/**
 * Export text with 【】markers around commentary sections.
 */
export function exportWithCommentaryMarkers(columns: Column[]): string {
  return columns
    .map((col) =>
      col.sections
        .map((s) => {
          const text = s.chars.map((c) => c.text).join("");
          return s.type === "commentary" ? `【${text}】` : text;
        })
        .join("")
    )
    .join("\n");
}

export function useColumnDetection(
  spatialData: SpatialCharacter[],
  layoutMode: LayoutMode = "simple"
): Column[] {
  return useMemo(
    () => detectColumns(spatialData, layoutMode),
    [spatialData, layoutMode]
  );
}
