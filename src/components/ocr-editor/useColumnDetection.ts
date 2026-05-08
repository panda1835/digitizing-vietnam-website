import { useMemo } from "react";
import type { SpatialCharacter, ColumnSection } from "@/lib/ocr-store";

export type LayoutMode = "simple" | "commentary" | "auto";

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

    if (!hasYBand && !hasDualColumn) {
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
  layoutMode: LayoutMode = "auto"
): Column[] {
  const chars = spatialData.filter(
    (c) => c.bbox && c.bbox.length === 4
  );
  if (!chars.length) return [];

  // Resolve "auto" once up-front so the rest of the function only deals with
  // the two concrete modes.
  const resolvedLayoutMode: "simple" | "commentary" =
    layoutMode === "auto" ? pickLayoutMode(chars) : layoutMode;

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
  if (resolvedLayoutMode === "commentary" && clusters.length > 1) {
    const allWidths = chars
      .map((c) => getBBoxWidth(c.bbox!))
      .sort((a, b) => a - b);
    const typicalMainW =
      allWidths.length > 0
        ? allWidths[Math.floor(allWidths.length * 0.95)]
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
  if (resolvedLayoutMode === "commentary" && clusters.length > 1) {
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
  const globalThreshold = resolvedLayoutMode === "commentary"
    ? computeGlobalSizeThreshold(chars)
    : null;

  // Step 5: Build columns with sections
  return allGroups.map((g, i) => {
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
  layoutMode: LayoutMode = "auto"
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
  layoutMode: LayoutMode = "auto"
): Column[] {
  return useMemo(
    () => detectColumns(spatialData, layoutMode),
    [spatialData, layoutMode]
  );
}
