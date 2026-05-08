import { useMemo } from "react";
import type {
  SpatialCharacter,
  ColumnSection,
  ConfirmedColumn,
  ColumnKind,
} from "@/lib/ocr-store";
import { isPunctuation } from "@/lib/punctuation";

export type LayoutMode = "simple" | "commentary" | "auto";

export interface DetectColumnsOptions {
  /**
   * Surface commentary clusters as their own columns (kind: "commentary")
   * instead of folding them into their parent main column. Also enables
   * Y-gap splitting so sections separated by tall blank space become
   * separate columns even within a single X-band.
   *
   * Reading order under this mode: each column traces back to a "parent"
   * X-cluster — pieces from the same parent stay consecutive in the
   * sidebar, ordered top-to-bottom by Y-center. Across parents, RTL by
   * X-center as before.
   *
   * Default: false (preserves the legacy auto-detect used inside the
   * char editor).
   */
  surfaceCommentary?: boolean;
  /**
   * Y-gap splitting threshold expressed as a multiple of the cluster's
   * average char height, measured **edge-to-edge** (bottom of prev char
   * → top of next char). Default: 1.0 — i.e., one blank-char-height of
   * empty space between two adjacent chars triggers a split. Maps to the
   * same effective gap as the existing `detectSections` heuristic
   * (`2.0× center-to-center` ≈ `1.0× edge-to-edge`). Only honored when
   * `surfaceCommentary` is true.
   */
  yGapThreshold?: number;
}

/**
 * Decide whether a page should run "commentary" detection (k-means split
 * for main vs. interlinear annotation chars + cluster absorption pass) or
 * "simple" (no extra passes). Heuristic: if char-area k-means finds a clear
 * bimodal distribution (some chars are dramatically smaller than the rest)
 * it's a commentary page; otherwise it's plain main text.
 */
export function pickLayoutMode(
  chars: SpatialCharacter[]
): "simple" | "commentary" {
  return computeGlobalSizeThreshold(chars) !== null ? "commentary" : "simple";
}

export interface Column {
  index: number;
  chars: SpatialCharacter[];
  bbox: { minX: number; maxX: number; minY: number; maxY: number };
  isRow: boolean;
  sections: ColumnSection[];
  /**
   * Optional layout kind. Set when the auto-detector ran with
   * `surfaceCommentary: true`. Defaults to "text" semantically when
   * absent.
   */
  kind?: ColumnKind;
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

/**
 * Split a cluster's chars into vertical sub-pieces wherever a tall blank
 * gap separates them. Gap is measured edge-to-edge (bottom of one char
 * to top of the next), so a single tall outlier character doesn't inflate
 * the gap. Threshold is expressed as a multiple of the cluster's own
 * mean char height — same yardstick works for main and commentary
 * clusters.
 *
 * Returns the original chars in 1+ buckets (preserving char identity).
 * If no gap exceeds the threshold, returns a single bucket containing
 * everything.
 */
function splitClusterByYGaps(
  chars: SpatialCharacter[],
  thresholdMultiplier: number
): SpatialCharacter[][] {
  if (chars.length < 2) return [chars];

  const heights = chars.map((c) => getBBoxHeight(c.bbox!));
  const avgH = heights.reduce((a, b) => a + b, 0) / heights.length;
  if (avgH <= 0) return [chars];
  const gapThreshold = avgH * thresholdMultiplier;

  const sorted = [...chars].sort(
    (a, b) => getBBoxCenter(a.bbox!).y - getBBoxCenter(b.bbox!).y
  );

  const splitYs: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const prevBottom = Math.max(...prev.bbox!.map((p) => p.y));
    const curTop = Math.min(...cur.bbox!.map((p) => p.y));
    if (curTop - prevBottom > gapThreshold) {
      splitYs.push((prevBottom + curTop) / 2);
    }
  }

  if (splitYs.length === 0) return [chars];

  const buckets: SpatialCharacter[][] = Array.from(
    { length: splitYs.length + 1 },
    () => []
  );
  for (const c of chars) {
    const cy = getBBoxCenter(c.bbox!).y;
    let idx = splitYs.length;
    for (let i = 0; i < splitYs.length; i++) {
      if (cy < splitYs[i]) {
        idx = i;
        break;
      }
    }
    buckets[idx].push(c);
  }

  return buckets.filter((b) => b.length > 0);
}

/**
 * Manual split entry point for the Step 1 "Split" button. Given a
 * confirmed column's bbox and the page's spatialData, returns one
 * ConfirmedColumn per cluster of chars separated by Y-gaps exceeding
 * `threshold × avgCharHeight`. Default 0.3 — well below the auto-
 * detector's 1.0 baseline, so visually-clear gaps that the detector
 * merged because they're sub-threshold can be split with one click.
 *
 * Returns an empty array if the column contains no chars or all chars
 * fit in a single cluster (no gap exceeded threshold). Caller can
 * detect "no split happened" via `result.length < 2`.
 */
export function splitColumnByYGaps(
  columnBbox: { minX: number; maxX: number; minY: number; maxY: number },
  spatialData: SpatialCharacter[],
  threshold = 0.3
): ConfirmedColumn[] {
  // Bucket chars whose center falls inside the column. Mirrors the
  // center-in-bbox containment used by `detectColumns` to assign chars
  // to confirmed columns.
  const inside = spatialData.filter((c) => {
    if (!c.bbox) return false;
    const cx = getBBoxCenter(c.bbox).x;
    const cy = getBBoxCenter(c.bbox).y;
    return (
      cx >= columnBbox.minX &&
      cx <= columnBbox.maxX &&
      cy >= columnBbox.minY &&
      cy <= columnBbox.maxY
    );
  });
  if (inside.length < 2) return [];

  const buckets = splitClusterByYGaps(inside, threshold);
  if (buckets.length < 2) return [];

  // Small padding so the new columns don't sit flush against their chars.
  const PAD = 0.003;
  // Sort buckets top-to-bottom by their Y-center so the resulting
  // columns are returned in reading order (vertical Han-Nôm: top→bottom
  // within an X-band).
  const sorted = buckets
    .map((b) => ({
      bucket: b,
      cy:
        b.reduce((s, c) => s + getBBoxCenter(c.bbox!).y, 0) / Math.max(1, b.length),
    }))
    .sort((a, b) => a.cy - b.cy)
    .map((x) => x.bucket);

  return sorted.map((bucket) => {
    const grp = computeGroupBbox(bucket);
    return {
      bbox: {
        minX: Math.max(columnBbox.minX, grp.minX - PAD),
        maxX: Math.min(columnBbox.maxX, grp.maxX + PAD),
        minY: Math.max(columnBbox.minY, grp.minY - PAD),
        maxY: Math.min(columnBbox.maxY, grp.maxY + PAD),
      },
    };
  });
}

// ── Section detection ──

/**
 * Reorder characters that may form a dual-column layout.
 * If the X-range is wide enough, split into right/left sub-columns and
 * read right column top-to-bottom, then left column top-to-bottom.
 * Otherwise treat as a single column sorted top-to-bottom with RTL tiebreak.
 * Works for both main text and commentary — the logic is size-agnostic.
 *
 * A section may have unequal-length sub-columns (e.g. right has 3 chars,
 * left has 2). The split-by-xMid approach handles this naturally — leftover
 * chars on either side stay in their sub-column instead of being treated as
 * dividers.
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

  const xMid = (minX + maxX) / 2;
  const rightCol = chars.filter((c) => getBBoxCenter(c.bbox!).x >= xMid);
  const leftCol = chars.filter((c) => getBBoxCenter(c.bbox!).x < xMid);
  rightCol.sort(compareTopDownRTL);
  leftCol.sort(compareTopDownRTL);
  return [...rightCol, ...leftCol];
}

/**
 * Partition a commentary section's characters into right/left sub-columns
 * (双行夹注 / dual-line interlinear annotation) and pair Y-aligned chars
 * across the two sides for vertical alignment.
 *
 * Returns null when the section's X-spread is too narrow to be a real
 * dual sub-column — i.e. all chars sit in a single sub-stream. The xMid
 * + xRange ≥ avgW * 0.6 threshold matches `reorderDualColumn` and the
 * image-pane logic so all three places agree on what "is dual-column."
 *
 * `pairs` is ordered top-to-bottom by Y of whichever side is present;
 * orphan rows (uneven sub-column lengths) are kept with the empty side
 * left undefined so callers can render an alignment placeholder.
 */
export function splitCommentarySides(chars: SpatialCharacter[]): {
  side: Map<number, "right" | "left">;
  pairs: Array<{ right?: SpatialCharacter; left?: SpatialCharacter }>;
} | null {
  const withBbox = chars.filter((c) => c.bbox);
  if (withBbox.length < 2) return null;

  const xs = withBbox.map((c) => getBBoxCenter(c.bbox!).x);
  const xRange = Math.max(...xs) - Math.min(...xs);
  const avgW =
    withBbox.reduce((s, c) => s + getBBoxWidth(c.bbox!), 0) / withBbox.length;
  if (xRange < avgW * 0.6) return null;

  const xMid = (Math.min(...xs) + Math.max(...xs)) / 2;
  const side = new Map<number, "right" | "left">();
  const right: SpatialCharacter[] = [];
  const left: SpatialCharacter[] = [];
  for (const c of withBbox) {
    const cx = getBBoxCenter(c.bbox!).x;
    if (cx >= xMid) {
      side.set(c.offset, "right");
      right.push(c);
    } else {
      side.set(c.offset, "left");
      left.push(c);
    }
  }

  const byY = (a: SpatialCharacter, b: SpatialCharacter) =>
    getBBoxCenter(a.bbox!).y - getBBoxCenter(b.bbox!).y;
  right.sort(byY);
  left.sort(byY);

  // Greedy Y-pairing: walk both sub-columns top-to-bottom, advancing the
  // side whose next char is higher. Y-similar chars (within avgH * 0.5)
  // pair up; orphans become a single-sided pair.
  const avgH =
    withBbox.reduce((s, c) => s + getBBoxHeight(c.bbox!), 0) / withBbox.length;
  const pairs: Array<{ right?: SpatialCharacter; left?: SpatialCharacter }> = [];
  let ri = 0;
  let li = 0;
  while (ri < right.length || li < left.length) {
    const r = right[ri];
    const l = left[li];
    if (r && l) {
      const ry = getBBoxCenter(r.bbox!).y;
      const ly = getBBoxCenter(l.bbox!).y;
      if (Math.abs(ry - ly) < avgH * 0.5) {
        pairs.push({ right: r, left: l });
        ri++;
        li++;
      } else if (ry < ly) {
        pairs.push({ right: r });
        ri++;
      } else {
        pairs.push({ left: l });
        li++;
      }
    } else if (r) {
      pairs.push({ right: r });
      ri++;
    } else if (l) {
      pairs.push({ left: l });
      li++;
    }
  }

  return { side, pairs };
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

  // Column-level dual-column check. Compute now — it determines whether the
  // absorb rule below should skip this column (dual-line commentary that is
  // Y-interleaved with main chars gets fragmented into 1-char sections by
  // the pass above; absorbing them into main would destroy the commentary).
  const avgMainW =
    mainChars.length > 0
      ? mainChars.reduce((s, c) => s + getBBoxWidth(c.bbox!), 0) / mainChars.length
      : 0;
  const allCommCharsRaw = withBbox.filter(
    (c) => getBBoxArea(c.bbox!) < globalThreshold
  );
  let columnHasDualColCommentary = false;
  if (avgMainW > 0 && allCommCharsRaw.length >= 2) {
    const xs = allCommCharsRaw
      .map((c) => getBBoxCenter(c.bbox!).x)
      .sort((a, b) => a - b);
    const xRange = xs[xs.length - 1] - xs[0];
    let maxGap = 0;
    for (let j = 1; j < xs.length; j++) {
      const g = xs[j] - xs[j - 1];
      if (g > maxGap) maxGap = g;
    }
    if (xRange >= avgMainW * 0.6 && maxGap > avgMainW * 0.4) {
      columnHasDualColCommentary = true;
    }
  }

  // Absorb single-char commentary sections flanked by main — but only if
  // the char's area is close to main text size (not a true outlier).
  // Skipped when the column has dual-col commentary, so Y-interleaved
  // commentary chars don't get absorbed into main one by one.
  if (!columnHasDualColCommentary) {
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
  }

  // Merge consecutive same-label sections
  const mergeSections = (
    input: { label: "main" | "commentary"; chars: SpatialCharacter[] }[]
  ) => {
    const out: { label: "main" | "commentary"; chars: SpatialCharacter[] }[] = [];
    for (const sec of input) {
      if (out.length > 0 && out[out.length - 1].label === sec.label) {
        out[out.length - 1].chars.push(...sec.chars);
      } else {
        out.push({ label: sec.label, chars: [...sec.chars] });
      }
    }
    return out;
  };
  let merged = mergeSections(rawSections);

  // Spatial validation: reject "commentary" sections that lack a real
  // commentary signature. Handwritten manuscripts show natural size variance,
  // so chars with small area may be misclassified. A true commentary section
  // has either (A) a distinct Y-band separated from flanking main sections
  // or (B) a dual-column X arrangement. Sections that fail both are almost
  // always size-variance artifacts and get demoted to main. Columns whose
  // commentary chars collectively form a dual-column pattern
  // (columnHasDualColCommentary, computed earlier) skip this pass — all of
  // their commentary sections are considered legitimate even if individual
  // sections were fragmented to 1-char runs.
  let demoted = false;
  for (let i = 0; i < merged.length && !columnHasDualColCommentary; i++) {
    const sec = merged[i];
    if (sec.label !== "commentary") continue;
    const withBboxInSec = sec.chars.filter((c) => c.bbox);
    if (withBboxInSec.length === 0) continue;

    const secBbox = computeGroupBbox(withBboxInSec);
    const prev = merged[i - 1];
    const next = merged[i + 1];
    const prevBbox = prev && prev.chars.filter((c) => c.bbox).length > 0
      ? computeGroupBbox(prev.chars.filter((c) => c.bbox))
      : null;
    const nextBbox = next && next.chars.filter((c) => c.bbox).length > 0
      ? computeGroupBbox(next.chars.filter((c) => c.bbox))
      : null;

    // Predicate A — Y-band distinctness.
    // Require a visible Y gap (> avgMainH * 0.5) between this section and at
    // least one flanking main section. If there is no flanking main on either
    // side, the column is essentially all commentary — treat as banded.
    const prevIsMain = prev?.label === "main" && !!prevBbox;
    const nextIsMain = next?.label === "main" && !!nextBbox;
    let hasYBand = false;
    if (prevIsMain && secBbox.minY - prevBbox!.maxY > avgMainH * 0.5) {
      hasYBand = true;
    }
    if (!hasYBand && nextIsMain && nextBbox!.minY - secBbox.maxY > avgMainH * 0.5) {
      hasYBand = true;
    }
    if (!hasYBand && !prevIsMain && !nextIsMain) {
      hasYBand = true;
    }

    // Predicate B — dual-column X signature.
    // Real double-line commentary has chars spread across a wide X range
    // with a clear gap between the two sub-columns. Handles asymmetric
    // layouts (e.g. 7 right-sub-col chars with only 1 left-sub-col char).
    // Pure size-noise misclassifications sit on a single X line → no gap.
    let hasDualColumn = false;
    if (avgMainW > 0 && withBboxInSec.length >= 2) {
      const xs = withBboxInSec.map((c) => getBBoxCenter(c.bbox!).x).sort((a, b) => a - b);
      const xRange = xs[xs.length - 1] - xs[0];
      let maxGap = 0;
      for (let j = 1; j < xs.length; j++) {
        const g = xs[j] - xs[j - 1];
        if (g > maxGap) maxGap = g;
      }
      if (xRange >= avgMainW * 0.6 && maxGap > avgMainW * 0.4) {
        hasDualColumn = true;
      }
    }

    // Single-char "commentary" sections are virtually always false
    // positives — naturally small main-text glyphs (口, 又, 入, 心, 丿,
    // SIP forms with sparse strokes) whose bboxes are smaller than
    // their full-stroke neighbors. Real interlinear annotations are
    // basically always 2+ chars in a row; demote lone smalls back to
    // main so they don't get wrapped in 【】 in the export.
    const isLoneSmall = withBboxInSec.length < 2;
    if ((!hasYBand && !hasDualColumn) || isLoneSmall) {
      sec.label = "main";
      demoted = true;
    }
  }

  if (demoted) merged = mergeSections(merged);

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
  layoutMode: LayoutMode = "auto",
  /**
   * When provided, skip the auto X-clustering pass and bucket chars into
   * the supplied columns by center-containment. Reading order is the
   * supplied array's order. Each column still runs section detection
   * (commentary etc.) over its members.
   */
  confirmedColumns?: ConfirmedColumn[],
  options?: DetectColumnsOptions
): Column[] {
  const surfaceCommentary = options?.surfaceCommentary === true;
  const yGapThreshold = options?.yGapThreshold ?? 1.0;
  // Filter out CJK punctuation. Their bboxes are an order of magnitude
  // smaller than real chars and warp the cluster's avgCharW / avgH,
  // which lowers downstream X-match and Y-gap thresholds enough to
  // fragment legit columns. New OCR runs already drop punctuation at
  // ingest (kandi-ocr.ts), but existing pages may still contain them —
  // exclude them here so auto-detect on saved data is still clean.
  // Punctuation chars are placed back into the matching column at the
  // very end so the editor still renders them as cells.
  const allBboxChars = spatialData.filter(
    (c) => c.bbox && c.bbox.length === 4
  );
  const punctuationChars = allBboxChars.filter((c) => isPunctuation(c.text));
  const chars = allBboxChars.filter((c) => !isPunctuation(c.text));
  if (!chars.length) {
    // Even with no chars, surface confirmed columns so the user can see them.
    if (confirmedColumns && confirmedColumns.length > 0) {
      return confirmedColumns.map((cc, i) => ({
        index: i,
        chars: [],
        bbox: { ...cc.bbox },
        isRow: false,
        sections: [],
      }));
    }
    return [];
  }

  // Resolve "auto" once up-front so the rest of the function only deals with
  // the two concrete modes.
  const resolvedLayoutMode: "simple" | "commentary" =
    layoutMode === "auto" ? pickLayoutMode(chars) : layoutMode;

  if (confirmedColumns && confirmedColumns.length > 0) {
    // Bucket chars by which confirmed column contains the char's center.
    // Chars whose center falls outside every column become orphans and are
    // excluded from columns (the toolbox surfaces them separately).
    const buckets: SpatialCharacter[][] = confirmedColumns.map(() => []);
    for (const c of chars) {
      const cx = getBBoxCenter(c.bbox!).x;
      const cy = getBBoxCenter(c.bbox!).y;
      let best = -1;
      for (let i = 0; i < confirmedColumns.length; i++) {
        const b = confirmedColumns[i].bbox;
        if (cx >= b.minX && cx <= b.maxX && cy >= b.minY && cy <= b.maxY) {
          best = i;
          break;
        }
      }
      if (best >= 0) buckets[best].push(c);
    }

    const globalThreshold =
      resolvedLayoutMode === "commentary"
        ? computeGlobalSizeThreshold(chars)
        : null;

    return confirmedColumns.map((cc, i) => {
      const bucket = buckets[i];
      let sections: ColumnSection[];
      if (bucket.length === 0) {
        sections = [];
      } else if (resolvedLayoutMode === "simple") {
        sections = [makeSingleSection("main", bucket, 0)];
      } else {
        sections = detectSections(bucket, globalThreshold);
      }
      const flatChars = sections.flatMap((s) => s.chars);
      return {
        index: i,
        chars: flatChars,
        bbox: { ...cc.bbox },
        isRow: false,
        sections,
        kind: cc.kind,
      };
    });
  }

  const avgH = chars.reduce((sum, c) => sum + getBBoxHeight(c.bbox!), 0) / chars.length;
  const yThreshold = Math.max(avgH * 0.8, 0.005);

  // Cap on how wide any single column may grow. A real Han-Nôm column is
  // about one large-char wide; even with dual-line interlinear commentary
  // the combined width rarely exceeds ~1.6× a main char. Beyond that, a
  // cluster has chained across an actual column boundary. Using p90 of
  // char widths gives a robust "typical large-char width" reference that
  // ignores commentary outliers but isn't skewed by a single rogue max.
  const _allWidthsForCap = chars
    .map((c) => getBBoxWidth(c.bbox!))
    .sort((a, b) => a - b);
  const typicalLargeCharW =
    _allWidthsForCap.length > 0
      ? _allWidthsForCap[Math.floor(_allWidthsForCap.length * 0.9)]
      : 0;
  const maxColW = typicalLargeCharW * 1.6;

  // Per-cluster effective cap. Body-only clusters get the page-wide cap.
  // Clusters that already contain an outlier-large char (title/header) get
  // a roomier cap derived from THAT char's width, so we don't split a
  // legitimate title-containing column at the midpoint.
  const clusterMaxW = (cl: { chars: SpatialCharacter[] }) =>
    cl.chars.reduce((m, c) => (c.bbox ? Math.max(m, getBBoxWidth(c.bbox)) : m), 0);
  const capForChars = (charsIn: SpatialCharacter[]) => {
    let cmax = 0;
    for (const c of charsIn) {
      if (c.bbox) {
        const w = getBBoxWidth(c.bbox);
        if (w > cmax) cmax = w;
      }
    }
    return Math.max(maxColW, cmax * 1.6);
  };
  const capFor = (cl: { chars: SpatialCharacter[] }) =>
    Math.max(maxColW, clusterMaxW(cl) * 1.6);

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

      // For the "withinBounds" path, require the new char to have a
      // similar width to the cluster's avgCharW. Without this guard,
      // a tiny marginalia char (w≈0.016) gets pulled into a commentary
      // cluster (avgCharW≈0.030) once the cluster's maxX bound extends
      // far enough — even though they're different size classes and
      // belong to separate columns.
      const widthRatio = cl.avgCharW > 0 ? charW / cl.avgCharW : 1;
      const widthSimilar = widthRatio >= 0.6 && widthRatio <= 1.7;
      const matchByBounds = withinBounds && widthSimilar;

      if ((dist < threshold || matchByBounds) && dist < bestDist) {
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

  // Step 1a2: Split clusters that grew too wide past real column boundaries.
  // The "within bounds + pad" match in Step 1 can chain-absorb adjacent columns
  // once a cluster's bbox extends. Within a single Han-Nôm column, X-centers
  // are tightly packed (variance ~0.005); between columns there is a clear
  // gap (≥ ~0.02). We split wide clusters at those gaps.
  //
  // Gap detection uses only "structural" chars (width ≥ cluster-median) so
  // that commentary-sized outliers (the right sub-column of a double-line
  // commentary block sits a fraction of a char-width off from its parent
  // main column) don't trigger spurious splits. Once split points are
  // found via structural chars, boundaries are placed at the midpoint of
  // each gap and ALL chars (including the small ones) are bucketed across
  // those boundaries, so commentary chars stay with their parent column.
  {
    type Cluster = typeof clusters[number];
    const splitOne = (cl: Cluster): Cluster[] => {
      const clusterWidth = cl.maxX - cl.minX;
      const localCap = capFor(cl);
      // Trigger split when EITHER (a) cluster grew past 1.3× its own avg
      // width (catches main+commentary chains in narrow-char columns) OR
      // (b) cluster exceeded its effective cap (catches chain-absorption
      // that pulled in an entire neighbouring column). Per-cluster cap
      // floors at the page-wide maxColW but expands when the cluster
      // contains a title-sized outlier so we don't split title columns.
      if (
        clusterWidth <= cl.avgCharW * 1.3 &&
        (localCap <= 0 || clusterWidth <= localCap)
      ) {
        return [cl];
      }

      // "Structural" = clearly main-sized chars (≥ 65% of the cluster's max
      // char width). Using the max-scaled threshold rather than the median
      // ensures commentary chars that happen to be as wide as the smallest
      // main char don't slip into the set and create spurious gap splits.
      const maxW = cl.chars.reduce((m, c) => Math.max(m, getBBoxWidth(c.bbox!)), 0);
      const structuralThreshold = maxW * 0.65;
      const structural = [...cl.chars]
        .filter((c) => getBBoxWidth(c.bbox!) >= structuralThreshold)
        .sort((a, b) => getBBoxCenter(a.bbox!).x - getBBoxCenter(b.bbox!).x);

      const gapThreshold = cl.avgCharW * 0.3;
      const boundaries: number[] = [];
      if (structural.length >= 2) {
        for (let i = 1; i < structural.length; i++) {
          const prevCx = getBBoxCenter(structural[i - 1].bbox!).x;
          const curCx = getBBoxCenter(structural[i].bbox!).x;
          if (curCx - prevCx > gapThreshold) {
            boundaries.push((prevCx + curCx) / 2);
          }
        }
      }

      // Last-resort fallback: if the cluster is wider than its effective
      // cap (which expands for title-bearing clusters) and the structural-
      // gap pass found nothing to split on, drop a boundary at the
      // cluster's X-midpoint. A title char's own width raises localCap, so
      // a column legitimately holding a title is not chopped here.
      if (
        boundaries.length === 0 &&
        localCap > 0 &&
        clusterWidth > localCap
      ) {
        boundaries.push((cl.minX + cl.maxX) / 2);
      }

      if (boundaries.length === 0) return [cl];

      // Bucket ALL chars (structural + non-structural) by boundaries.
      const buckets: SpatialCharacter[][] = Array.from(
        { length: boundaries.length + 1 },
        () => []
      );
      for (const c of cl.chars) {
        const cx = getBBoxCenter(c.bbox!).x;
        let idx = boundaries.length;
        for (let i = 0; i < boundaries.length; i++) {
          if (cx < boundaries[i]) { idx = i; break; }
        }
        buckets[idx].push(c);
      }

      const subClusters: Cluster[] = [];
      for (const bucket of buckets) {
        if (bucket.length === 0) continue;
        const allX = bucket.flatMap((c) => c.bbox!.map((v) => v.x));
        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);
        const centerX =
          bucket.reduce((s, c) => s + getBBoxCenter(c.bbox!).x, 0) / bucket.length;
        const avgCharW =
          bucket.reduce((s, c) => s + getBBoxWidth(c.bbox!), 0) / bucket.length;
        subClusters.push({ centerX, minX, maxX, avgCharW, chars: bucket });
      }
      return subClusters;
    };

    const split: Cluster[] = [];
    for (const cl of clusters) split.push(...splitOne(cl));
    clusters.length = 0;
    clusters.push(...split);
  }

  // Step 1b₀: Absorb narrow small-char clusters into the nearest main cluster.
  // Dual-line commentary (双行夹注) puts small annotation chars in one or two
  // narrow X-bands flanking — or directly between — main characters in the
  // same woodblock column. Pure X-clustering (and Step 1a2's structural-gap
  // split) treats those bands as separate columns, fragmenting one column
  // into 2–3 spurious columns. Folding narrow small-char clusters back into
  // the nearest main cluster lets detectSections classify them as a
  // "commentary" section inside the single parent column (where
  // splitCommentarySides can then render them as a proper dual sub-column).
  //
  // The "small" predicate keys on each cluster's *max* char width relative
  // to the page's p95 width, not the cluster's avg width. A mixed cluster
  // (col 1 main + one commentary sub-col) has a low avg but contains a
  // main-sized char, so it must NOT be flagged as small — otherwise we'd
  // dissolve real main columns. Conversely a pure-commentary cluster has a
  // small max width and is correctly flagged.
  if (
    !surfaceCommentary &&
    resolvedLayoutMode === "commentary" &&
    clusters.length > 1
  ) {
    // Median rather than p95 — see the matching comment in the
    // surfaceCommentary path below for why.
    const allWidths = chars
      .map((c) => getBBoxWidth(c.bbox!))
      .sort((a, b) => a - b);
    const typicalMainW =
      allWidths.length > 0
        ? allWidths[Math.floor(allWidths.length * 0.5)]
        : 0;

    if (typicalMainW > 0) {
      const clusterMaxW = (cl: (typeof clusters)[number]) =>
        cl.chars.reduce(
          (m, c) => Math.max(m, getBBoxWidth(c.bbox!)),
          0
        );
      const isSmall = (cl: (typeof clusters)[number]) =>
        clusterMaxW(cl) < typicalMainW * 0.7;
      const isMainSized = (cl: (typeof clusters)[number]) =>
        clusterMaxW(cl) >= typicalMainW * 0.7;

      // Snapshot the main clusters' ORIGINAL bounds before any absorption.
      // We use these snapshots for distance lookups so that absorbing the
      // first small cluster into a main doesn't expand that main's bounds
      // and pull in unrelated small clusters that actually belong to the
      // next main column over.
      type MainSnapshot = {
        cluster: (typeof clusters)[number];
        minX: number;
        maxX: number;
      };
      const mainSnapshots: MainSnapshot[] = clusters
        .filter(isMainSized)
        .map((cl) => ({ cluster: cl, minX: cl.minX, maxX: cl.maxX }));
      if (mainSnapshots.length === 0) {
        // no mains on this page — leave clusters untouched
      } else {
        const smalls = clusters.filter(isSmall);
        for (const sc of smalls) {
          let best: MainSnapshot | null = null;
          let bestDist = Infinity;
          for (const ms of mainSnapshots) {
            const cx = sc.centerX;
            const dist =
              cx >= ms.minX && cx <= ms.maxX
                ? 0
                : Math.min(Math.abs(cx - ms.minX), Math.abs(cx - ms.maxX));
            if (dist < bestDist) {
              bestDist = dist;
              best = ms;
            }
          }

          // Tolerate up to 1.5× a main-char-width offset between the small
          // cluster and its parent main column. Dual-line sub-cols typically
          // sit about half a main-char-width off the column edge. AND skip
          // the merge if the resulting cluster would exceed the page-wide
          // column-width cap — that's a sign we're trying to absorb across
          // a real column boundary.
          if (best && bestDist <= typicalMainW * 1.5) {
            const target = best.cluster;
            const mergedMinX = Math.min(target.minX, sc.minX);
            const mergedMaxX = Math.max(target.maxX, sc.maxX);
            // Compute the effective cap against the union of both clusters'
            // chars so a title char on either side widens the cap.
            const mergedCap = capForChars([...target.chars, ...sc.chars]);
            if (mergedCap > 0 && mergedMaxX - mergedMinX > mergedCap) {
              continue; // would overflow cap → leave the small cluster alone
            }
            target.chars.push(...sc.chars);
            target.minX = mergedMinX;
            target.maxX = mergedMaxX;
            target.avgCharW =
              target.chars.reduce((s, c) => s + getBBoxWidth(c.bbox!), 0) /
              target.chars.length;
            target.centerX =
              target.chars.reduce(
                (s, c) => s + getBBoxCenter(c.bbox!).x,
                0
              ) / target.chars.length;
            const idx = clusters.indexOf(sc);
            if (idx !== -1) clusters.splice(idx, 1);
          }
        }
      }
    }
  }

  // Step 1b: Merge adjacent narrow commentary sub-columns
  // Skipped in surfaceCommentary mode — we want each sub-column kept
  // separate so it can be labeled independently for segmentation training.
  if (
    !surfaceCommentary &&
    resolvedLayoutMode === "commentary" &&
    clusters.length > 1
  ) {
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

  // ── Surface-commentary path ────────────────────────────────────────────
  // When the caller asked for kinded auto-detect (Step 1 of the labeling
  // workflow), tag each X-cluster as "text" or "commentary" by char-width
  // distribution, split each cluster vertically on tall blank gaps, then
  // emit the sub-pieces in (parent X-center desc, sub-piece Y-center asc)
  // order. Pieces inheriting the same parent X-center stay consecutive in
  // the sidebar — preserves the previous reading order's RTL sweep while
  // expanding tall columns into the multiple sections they really contain.
  if (surfaceCommentary && resolvedLayoutMode === "commentary") {
    // Step 1a3 (surfaceCommentary only): extract commentary-sized chars
    // from any cluster that still mixes them with main-sized chars.
    //
    // Why this is needed: Step 1's `withinBounds + pad` match in
    // X-clustering absorbs commentary chars into nearby main clusters,
    // and Step 1a2 then re-buckets ALL chars (including commentary) into
    // structural-gap-defined main bands. By the time we get here we have
    // mixed clusters whose `clusterMaxW` is the main-char width — so the
    // tagging below would label them "text" and the dual-line commentary
    // never surfaces as its own column.
    //
    // We split each mixed cluster into: (a) one main cluster with the
    // main-sized chars, plus (b) 1–N narrow commentary clusters formed
    // by X-band-grouping the commentary chars. Two paired sub-columns
    // of dual-line commentary sit ~0.5 main-char-widths apart on X, so
    // a tight grouping threshold splits them while keeping a single-line
    // commentary band as one cluster.
    //
    // Reference width: p90 of char widths, not the median. On commentary-
    // heavy pages where dual-line commentary chars outnumber mains, the
    // page-wide median is biased toward commentary width, dragging the
    // 0.7× threshold below most commentary chars and breaking extraction.
    // p90 is robust to that imbalance — it still hits the main-char width
    // as long as there's some main text on the page.
    const _allW = chars
      .map((c) => getBBoxWidth(c.bbox!))
      .sort((a, b) => a - b);
    const _typMainW = _allW.length
      ? _allW[Math.floor(_allW.length * 0.9)]
      : 0;
    const COMM_RATIO = 0.7;
    if (_typMainW > 0) {
      type Cluster = (typeof clusters)[number];
      const buildCluster = (charsIn: SpatialCharacter[]): Cluster => {
        const allXs = charsIn.flatMap((c) => c.bbox!.map((p) => p.x));
        return {
          chars: charsIn,
          minX: Math.min(...allXs),
          maxX: Math.max(...allXs),
          centerX:
            charsIn.reduce((s, c) => s + getBBoxCenter(c.bbox!).x, 0) /
            charsIn.length,
          avgCharW:
            charsIn.reduce((s, c) => s + getBBoxWidth(c.bbox!), 0) /
            charsIn.length,
        };
      };
      const next: Cluster[] = [];
      for (const cl of clusters) {
        const mainByWidth = cl.chars.filter(
          (c) => getBBoxWidth(c.bbox!) >= _typMainW * COMM_RATIO
        );
        const narrowByWidth = cl.chars.filter(
          (c) => getBBoxWidth(c.bbox!) < _typMainW * COMM_RATIO
        );
        // Pure-main or pure-narrow clusters need no surgery.
        if (narrowByWidth.length === 0 || mainByWidth.length === 0) {
          next.push(cl);
          continue;
        }
        // Width alone misclassifies small main chars (e.g. punctuation,
        // a trailing radical-only OCR fragment) as commentary. Refine
        // with the X-axis check the user pointed out: real commentary in
        // a mixed column sits OFFSET from the main-text axis (often as
        // paired sub-cols flanking the main center). A narrow char whose
        // X-center sits AT the main axis is a small main, not commentary.
        // Use the median X-center of main chars so a single off-axis
        // outlier doesn't drag the reference axis. Tolerance must be
        // tight: paired dual-line commentary sits ~0.013–0.020 off the
        // main axis (about 1/4 of a main-char width), so anything looser
        // than ~0.1×typMainW would absorb real commentary back into the
        // main cluster. With typMainW ≈ 0.05 this is a tolerance of 0.005.
        const _mainXs = mainByWidth
          .map((c) => getBBoxCenter(c.bbox!).x)
          .sort((a, b) => a - b);
        const mainAxisX = _mainXs[Math.floor(_mainXs.length / 2)];
        const AXIS_TOL = Math.max(_typMainW * 0.1, 0.003);
        const mainSized: SpatialCharacter[] = [...mainByWidth];
        const commSized: SpatialCharacter[] = [];
        for (const c of narrowByWidth) {
          const dx = Math.abs(getBBoxCenter(c.bbox!).x - mainAxisX);
          if (dx <= AXIS_TOL) {
            mainSized.push(c); // small main, not commentary
          } else {
            commSized.push(c);
          }
        }
        // After axis refinement, no real commentary left → leave the
        // cluster intact (mixed widths but all aligned with the main axis).
        if (commSized.length === 0) {
          next.push(cl);
          continue;
        }
        // Main cluster keeps mains + axis-aligned narrow chars (rebox).
        next.push(buildCluster(mainSized));
        // Group commentary chars into X-bands. Sort by X-center so
        // adjacent-X chars cluster greedily; threshold at ~0.6× the
        // commentary char's own width — paired sub-cols are typically
        // ≥ 1× a main-char-width apart in X, well above this floor.
        const commSorted = [...commSized].sort(
          (a, b) => getBBoxCenter(a.bbox!).x - getBBoxCenter(b.bbox!).x
        );
        const bandThreshold = Math.max(
          (commSorted[0] ? getBBoxWidth(commSorted[0].bbox!) : 0) * 0.6,
          0.003
        );
        const bands: SpatialCharacter[][] = [];
        for (const c of commSorted) {
          const cx = getBBoxCenter(c.bbox!).x;
          let placed = false;
          for (const band of bands) {
            const bandCx =
              band.reduce((s, b) => s + getBBoxCenter(b.bbox!).x, 0) /
              band.length;
            if (Math.abs(cx - bandCx) < bandThreshold) {
              band.push(c);
              placed = true;
              break;
            }
          }
          if (!placed) bands.push([c]);
        }
        for (const band of bands) {
          next.push(buildCluster(band));
        }
      }
      clusters.length = 0;
      clusters.push(...next);

      // Step 1a4 (surfaceCommentary only): fragment absorption.
      //
      // Step 1a3 sometimes leaves orphan ≤2-char clusters at slightly off
      // X-centers from a neighboring main column — usually one OCR'd char
      // whose bbox center sat just outside the main cluster's bounds in
      // Step 1's X-grouping. The user's confirmed columns merge those
      // chars into the adjacent main. Replicate that: any ≤2-char cluster
      // gets absorbed into the nearest cluster within ~1.5 main-char-widths
      // on X that overlaps it (or sits within ~1 main-char-height) on Y.
      const FRAG_MAX = 4;
      const ABSORB_X_DIST = _typMainW * 1.5;
      const yRange = (cl: (typeof clusters)[number]) => {
        let lo = Infinity,
          hi = -Infinity;
        for (const c of cl.chars) {
          for (const p of c.bbox!) {
            if (p.y < lo) lo = p.y;
            if (p.y > hi) hi = p.y;
          }
        }
        return [lo, hi] as [number, number];
      };
      const _allHForAbsorb = chars
        .map((c) => getBBoxHeight(c.bbox!))
        .sort((a, b) => a - b);
      const _typMainH = _allHForAbsorb.length
        ? _allHForAbsorb[Math.floor(_allHForAbsorb.length * 0.9)]
        : 0;
      // Run absorption to a fixed point. Each iteration may make a fragment
      // a viable target for another fragment, so repeat until stable.
      //
      // Criterion: a small (≤FRAG_MAX-char) fragment is absorbed into the
      // nearest non-fragment cluster whose bbox engulfs the fragment's
      // chars (with a small Y-tolerance for boundary cases). Engulfment
      // is checked at the bbox level — fragment X-range fits inside the
      // target's X-range plus a half-char pad, and fragment Y-range is
      // inside the target's Y-range. The target's `kind` (main vs
      // commentary) is irrelevant: when a fragment sits visually inside
      // another column the user merges it regardless of kind.
      void _typMainH;
      // Width-class predicates: a "narrow" cluster has all chars below the
      // commentary-width threshold. Absorption must NOT merge a narrow
      // fragment into a main-sized target — that's exactly how paired
      // commentary halves get folded into a bigger main column at the
      // same X-band. Same-class merges only.
      const COMM_RATIO_ABS = 0.7;
      const isNarrowCluster = (cl: (typeof clusters)[number]) => {
        for (const c of cl.chars) {
          if (getBBoxWidth(c.bbox!) >= _typMainW * COMM_RATIO_ABS) return false;
        }
        return true;
      };
      let absorbed = true;
      while (absorbed) {
        absorbed = false;
        for (let i = 0; i < clusters.length; i++) {
          const small = clusters[i];
          if (small.chars.length > FRAG_MAX) continue;
          const [sLo, sHi] = yRange(small);
          const smallNarrow = isNarrowCluster(small);
          let bestIdx = -1;
          let bestDist = Infinity;
          for (let j = 0; j < clusters.length; j++) {
            if (i === j) continue;
            const target = clusters[j];
            // Target must be strictly larger than the fragment (so we
            // don't merge a fragment into another fragment) and have at
            // least 3 chars (so we don't pull noise into other noise).
            if (target.chars.length <= small.chars.length) continue;
            if (target.chars.length < 3) continue;
            // Don't merge narrow (commentary) fragments into main targets.
            if (smallNarrow && !isNarrowCluster(target)) continue;
            const xDist = Math.abs(small.centerX - target.centerX);
            if (xDist > ABSORB_X_DIST) continue;
            // X-engulfment: small's X-range sits inside target's X-range,
            // with a half-main-char-width pad to tolerate slight misalign.
            // Additionally require small's CENTER to be inside target's
            // RAW bounds (no pad) — without this, marginalia at the page
            // edge (cx clearly outside the target) gets pulled in via the
            // pad and merged into adjacent commentary clusters.
            const xPad = _typMainW * 0.5;
            if (small.minX < target.minX - xPad) continue;
            if (small.maxX > target.maxX + xPad) continue;
            if (small.centerX < target.minX || small.centerX > target.maxX)
              continue;
            const [tLo, tHi] = yRange(target);
            // Y proximity: either strictly contained, OR within one main-
            // char-height of either edge AND the fragment is sandwiched
            // between clusters at the same X-band (something above, some-
            // thing below). The sandwich guard prevents page-edge frag-
            // ments (marginalia, top/bottom paired commentary at column
            // ends) from being absorbed into adjacent columns.
            const yInside = sLo >= tLo && sHi <= tHi;
            const yGap = Math.max(0, Math.max(sLo, tLo) - Math.min(sHi, tHi));
            if (!yInside) {
              if (yGap > _typMainH) continue;
              let hasAbove = false,
                hasBelow = false;
              for (let k = 0; k < clusters.length; k++) {
                if (k === i) continue;
                const c2 = clusters[k];
                if (small.minX < c2.minX - xPad) continue;
                if (small.maxX > c2.maxX + xPad) continue;
                const [cLo, cHi] = yRange(c2);
                if (cHi < sLo) hasAbove = true;
                if (cLo > sHi) hasBelow = true;
                if (hasAbove && hasBelow) break;
              }
              if (!(hasAbove && hasBelow)) continue;
            }
            // Cost: prefer Y-inside matches, then by smallest Y gap, then
            // by closest X. Keeps the ranking stable when multiple
            // candidates qualify.
            const cost = (yInside ? 0 : yGap) * 1000 + xDist;
            if (cost < bestDist) {
              bestDist = cost;
              bestIdx = j;
            }
          }
          if (bestIdx !== -1) {
            const tgt = clusters[bestIdx];
            tgt.chars.push(...small.chars);
            const allXs = tgt.chars.flatMap((c) => c.bbox!.map((p) => p.x));
            tgt.minX = Math.min(...allXs);
            tgt.maxX = Math.max(...allXs);
            tgt.centerX =
              tgt.chars.reduce((s, c) => s + getBBoxCenter(c.bbox!).x, 0) /
              tgt.chars.length;
            tgt.avgCharW =
              tgt.chars.reduce((s, c) => s + getBBoxWidth(c.bbox!), 0) /
              tgt.chars.length;
            clusters.splice(i, 1);
            absorbed = true;
            break;
          }
        }
      }

      // Step 1a5 (surfaceCommentary only): chain-merge stacked narrow
      // clusters at the same cx. When auto fragments one user-confirmed
      // commentary column into 2–3 pieces stacked vertically (e.g. top
      // half + middle 1-char fragment + bottom half all at cx≈0.93),
      // none of the pieces individually contains the others by Y, so the
      // earlier absorption passes can't merge them. But because they all
      // share an X-axis, they're really one column.
      //
      // Criterion: pair of NARROW clusters whose centerX values are
      // within ~0.3 commentary-char-widths (a much tighter X tolerance
      // than the absorption pass — only same-X-axis stacks qualify).
      // This deliberately excludes paired commentary halves, which sit
      // ≥1 main-char-width apart on X.
      const _commWFor1a5 = _typMainW * 0.6; // typical commentary char width
      const CHAIN_X_TOL = Math.max(_commWFor1a5 * 0.3, 0.003);
      // Cluster-level narrowness (X-extent of the whole cluster bbox).
      // The per-char isNarrowCluster used above is too strict for chain
      // merging — a cluster like "梗。" may have one char above the
      // per-char threshold even though the cluster's X-extent is clearly
      // commentary-width. Use cluster width as the chain-merge filter.
      const isClusterNarrow = (cl: (typeof clusters)[number]) =>
        cl.maxX - cl.minX < _typMainW * COMM_RATIO_ABS;
      let chainMerged = true;
      while (chainMerged) {
        chainMerged = false;
        for (let i = 0; i < clusters.length && !chainMerged; i++) {
          for (let j = i + 1; j < clusters.length && !chainMerged; j++) {
            const a = clusters[i];
            const b = clusters[j];
            if (!isClusterNarrow(a) || !isClusterNarrow(b)) continue;
            if (Math.abs(a.centerX - b.centerX) > CHAIN_X_TOL) continue;
            // Merge smaller into larger (preserves the dominant cluster's
            // identity for downstream sort / kind tagging).
            const [keep, drop] =
              a.chars.length >= b.chars.length ? [a, b] : [b, a];
            const dropIdx = clusters.indexOf(drop);
            keep.chars.push(...drop.chars);
            const allXs = keep.chars.flatMap((c) => c.bbox!.map((p) => p.x));
            keep.minX = Math.min(...allXs);
            keep.maxX = Math.max(...allXs);
            keep.centerX =
              keep.chars.reduce((s, c) => s + getBBoxCenter(c.bbox!).x, 0) /
              keep.chars.length;
            keep.avgCharW =
              keep.chars.reduce((s, c) => s + getBBoxWidth(c.bbox!), 0) /
              keep.chars.length;
            clusters.splice(dropIdx, 1);
            chainMerged = true;
          }
        }
      }
    }
  }
  if (surfaceCommentary) {
    // p90 of char widths: matches the reference used by the Step 1a3
    // commentary-extraction pass above. p50 (median) was originally chosen
    // for robustness against a single oversized title char inflating p95,
    // but it breaks on commentary-heavy pages where dual-line commentary
    // chars outnumber mains and drag the median below body width — the
    // 0.7× threshold then sits under most commentary char widths and
    // mis-tags them as `text`. p90 picks up the main-char mode cleanly
    // even when commentary dominates by count.
    const allWidthsSC = chars
      .map((c) => getBBoxWidth(c.bbox!))
      .sort((a, b) => a - b);
    const typicalMainWSC =
      allWidthsSC.length > 0
        ? allWidthsSC[Math.floor(allWidthsSC.length * 0.9)]
        : 0;
    const clusterMaxWSC = (cl: (typeof clusters)[number]) =>
      cl.chars.reduce((m, c) => Math.max(m, getBBoxWidth(c.bbox!)), 0);
    const isCommentaryCluster = (cl: (typeof clusters)[number]) =>
      resolvedLayoutMode === "commentary" &&
      typicalMainWSC > 0 &&
      clusterMaxWSC(cl) < typicalMainWSC * 0.7;

    const clusterKind: ColumnKind[] = clusters.map((cl) =>
      isCommentaryCluster(cl) ? "commentary" : "text"
    );
    // Marginalia retag: a commentary-tagged cluster sitting at the page
    // edge IS likely a margin annotation rather than interlinear commentary,
    // BUT only if it has no commentary sibling at roughly the same Y (a
    // sibling indicates paired dual-line commentary — those pairs sometimes
    // sit very close to the page edge and shouldn't be misclassified).
    // Threshold tightened from 0.05 to 0.03 since real marginalia run
    // flush against the edge while commentary sub-cols typically have a
    // small inset.
    const MARGIN_FRAC = 0.03;
    const _yRangeMK = (cl: (typeof clusters)[number]) => {
      let lo = Infinity,
        hi = -Infinity;
      for (const c of cl.chars) {
        for (const p of c.bbox!) {
          if (p.y < lo) lo = p.y;
          if (p.y > hi) hi = p.y;
        }
      }
      return [lo, hi] as [number, number];
    };
    for (let i = 0; i < clusters.length; i++) {
      if (clusterKind[i] !== "commentary") continue;
      const cl = clusters[i];
      const atEdge =
        cl.maxX > 1 - MARGIN_FRAC || cl.minX < MARGIN_FRAC;
      if (!atEdge) continue;
      const [aLo, aHi] = _yRangeMK(cl);
      let hasSibling = false;
      for (let j = 0; j < clusters.length; j++) {
        if (i === j) continue;
        if (clusterKind[j] !== "commentary") continue;
        const sib = clusters[j];
        if (Math.abs(sib.centerX - cl.centerX) > typicalMainWSC) continue;
        const [sLo, sHi] = _yRangeMK(sib);
        const yOverlap = Math.min(aHi, sHi) - Math.max(aLo, sLo);
        if (yOverlap > (aHi - aLo) * 0.3) {
          hasSibling = true;
          break;
        }
      }
      if (!hasSibling) clusterKind[i] = "marginalia";
    }
    // For each cluster, the X-center used as the primary sort key.
    // - text: own centerX
    // - commentary: nearest text cluster's centerX (so paired sub-cols sort
    //   adjacent to their parent main column in the RTL sweep)
    // - marginalia: OWN centerX. Marginalia at the page edge isn't paired
    //   with a main column — far-right marginalia should sort first
    //   (highest parentX), far-left should sort last (lowest parentX).
    //   Mapping it to the nearest text cluster's parentX puts it adjacent
    //   to that main, which is wrong for the user's reading-order
    //   convention.
    const clusterParentX: number[] = clusters.map((cl, i) => {
      if (clusterKind[i] === "text") return cl.centerX;
      if (clusterKind[i] === "marginalia") return cl.centerX;
      // Commentary: only inherit a text cluster's parentX when this
      // commentary's centerX actually sits inside that text cluster's X
      // range (true interlinear annotation). When commentary falls in
      // the GAP between two mains (i.e., it's a separate column band
      // visually), use its own centerX so simple RTL by parentX puts it
      // in the correct position relative to neighbors.
      const cx = cl.centerX;
      for (let j = 0; j < clusters.length; j++) {
        if (clusterKind[j] !== "text") continue;
        const m = clusters[j];
        if (cx >= m.minX && cx <= m.maxX) {
          return m.centerX;
        }
      }
      return cl.centerX;
    });

    type SubCluster = {
      chars: SpatialCharacter[];
      bbox: { minX: number; maxX: number; minY: number; maxY: number };
      parentX: number;
      kind: ColumnKind;
    };

    const subs: SubCluster[] = [];
    for (let ci = 0; ci < clusters.length; ci++) {
      const cl = clusters[ci];
      const pieces = splitClusterByYGaps(cl.chars, yGapThreshold);
      for (const p of pieces) {
        if (p.length === 0) continue;
        subs.push({
          chars: p,
          bbox: computeGroupBbox(p),
          parentX: clusterParentX[ci],
          kind: clusterKind[ci],
        });
      }
    }

    // Sort: parent X-center descending (RTL across bands), then top-to-
    // bottom by Y within a band, then RTL by own X-center for paired
    // dual-line commentary halves (which share parentX AND yCenter — without
    // an X tiebreaker the right/left sub-col order is arbitrary, but
    // Han-Nôm reading goes right before left).
    const Y_TIE_TOL = 0.04;
    subs.sort((a, b) => {
      if (a.parentX !== b.parentX) return b.parentX - a.parentX;
      const ay = (a.bbox.minY + a.bbox.maxY) / 2;
      const by = (b.bbox.minY + b.bbox.maxY) / 2;
      if (Math.abs(ay - by) > Y_TIE_TOL) return ay - by;
      const ax = (a.bbox.minX + a.bbox.maxX) / 2;
      const bx = (b.bbox.minX + b.bbox.maxX) / 2;
      return bx - ax;
    });

    const globalThresholdSC =
      resolvedLayoutMode === "commentary"
        ? computeGlobalSizeThreshold(chars)
        : null;

    const builtColumns = subs.map((s, i) => {
      const sectionChars = [...s.chars].sort(compareTopDownRTL);
      // Commentary sub-clusters are already a single semantic unit — no
      // need to run section detection inside them. Text sub-clusters
      // still get section detection so any leftover small chars get
      // flagged as commentary sections (rare in surfaceCommentary mode
      // since the commentary clusters were already pulled out).
      const sections: ColumnSection[] =
        s.kind === "commentary" || resolvedLayoutMode === "simple"
          ? [makeSingleSection("main", sectionChars, 0)]
          : detectSections(sectionChars, globalThresholdSC);
      const flatChars = sections.flatMap((sec) => sec.chars);
      return {
        index: i,
        chars: flatChars,
        bbox: s.bbox,
        isRow: false,
        sections,
        kind: s.kind,
      } as Column;
    });
    return placePunctuationIntoColumns(builtColumns, punctuationChars);
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
  const globalThreshold = resolvedLayoutMode === "commentary"
    ? computeGlobalSizeThreshold(chars)
    : null;

  // Step 5: Build columns with sections
  const builtCols = allGroups.map((g, i) => {
    let sections: ColumnSection[];
    if (g.isRow || resolvedLayoutMode === "simple") {
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
    } as Column;
  });
  return placePunctuationIntoColumns(builtCols, punctuationChars);
}

/**
 * Place punctuation chars (excluded from cluster geometry) into the
 * matching column by bbox-containment of the char's center, or nearest
 * column by Euclidean distance to bbox if no column contains it. Each
 * column's `chars` array gets the placed punctuation appended and is
 * re-sorted by Han-Nôm reading order. Bbox of the column is left
 * untouched — punctuation shouldn't grow the column's visible footprint.
 */
function placePunctuationIntoColumns(
  cols: Column[],
  punct: SpatialCharacter[]
): Column[] {
  if (punct.length === 0 || cols.length === 0) return cols;
  for (const p of punct) {
    if (!p.bbox) continue;
    const pc = getBBoxCenter(p.bbox);
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < cols.length; i++) {
      const b = cols[i].bbox;
      // Prefer a column that geometrically contains the punctuation center.
      const inside =
        pc.x >= b.minX && pc.x <= b.maxX && pc.y >= b.minY && pc.y <= b.maxY;
      const dx =
        pc.x < b.minX ? b.minX - pc.x : pc.x > b.maxX ? pc.x - b.maxX : 0;
      const dy =
        pc.y < b.minY ? b.minY - pc.y : pc.y > b.maxY ? pc.y - b.maxY : 0;
      const dist = inside ? 0 : Math.hypot(dx, dy);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      cols[bestIdx].chars.push(p);
    }
  }
  // Re-sort each touched column's chars by reading order.
  for (const c of cols) {
    c.chars.sort(compareTopDownRTL);
  }
  return cols;
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
 *
 * When `confirmedColumns` is provided, chars are bucketed by spatial
 * containment into the supplied columns (skipping auto-detection); the
 * reading order is the supplied array's order. Chars whose center lies
 * outside every confirmed column are appended at the end, separated by a
 * newline so they're visually flagged as orphans.
 */
export function reorderByColumns(
  spatialData: SpatialCharacter[],
  layoutMode: LayoutMode = "auto",
  confirmedColumns?: ConfirmedColumn[]
): SpatialCharacter[] {
  const columns = detectColumns(spatialData, layoutMode, confirmedColumns);
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

  // Orphan chars (have a bbox but didn't land in any confirmed column).
  // Keep them so user data isn't lost; surfaced in the toolbox so the user
  // can either widen a column or delete them.
  if (confirmedColumns && confirmedColumns.length > 0) {
    const orphans = spatialData.filter(
      (c) => c.bbox && c.bbox.length === 4 && !inColumn.has(c)
    );
    if (orphans.length > 0) {
      if (result.length > 0) {
        result.push({ text: "\n", bbox: null, confidence: 1, offset: 0 });
      }
      for (const o of orphans) result.push(o);
    }
  }

  let offset = 0;
  for (const c of result) {
    c.offset = offset;
    // Use max(1, text.length) so blank-text cells still advance the offset.
    // Otherwise consecutive blanks collide on the same offset, breaking
    // identification (focus targets two cells, Tab can't proceed, etc.).
    offset += Math.max(1, c.text.length);
  }

  return result;
}

/**
 * Export text with 【】markers around commentary sections.
 */
/**
 * Concatenate every char in every section, joining columns with newlines.
 * No 【】 markers around commentary sections — those were a
 * decoration meant to preserve structural info in the rawText, but they
 * pollute training data by introducing characters the OCR model would
 * have to learn to emit. Commentary structure is now preserved at the
 * metadata level instead (see `extractCommentaryRanges`).
 */
export function exportWithCommentaryMarkers(columns: Column[]): string {
  return columns
    .map((col) => col.sections.map((s) => s.chars.map((c) => c.text).join("")).join(""))
    .join("\n");
}

/**
 * Char-index ranges (within the joined text of a single column) that
 * correspond to commentary sub-sections. Lets line-level dataset rows
 * preserve interlinear-annotation structure without polluting the
 * primary `text` label with bracket characters.
 *
 * Each range is `[start, end)` — half-open, like Array.prototype.slice.
 * Empty array when the column has no commentary sub-sections.
 */
export function extractCommentaryRanges(
  column: Column
): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let pos = 0;
  for (const s of column.sections) {
    const text = s.chars.map((c) => c.text).join("");
    if (s.type === "commentary" && text.length > 0) {
      ranges.push([pos, pos + text.length]);
    }
    pos += text.length;
  }
  return ranges;
}

export function useColumnDetection(
  spatialData: SpatialCharacter[],
  layoutMode: LayoutMode = "auto",
  confirmedColumns?: ConfirmedColumn[]
): Column[] {
  return useMemo(
    () => detectColumns(spatialData, layoutMode, confirmedColumns),
    [spatialData, layoutMode, confirmedColumns]
  );
}
