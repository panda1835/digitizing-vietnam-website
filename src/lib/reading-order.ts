import type { SpatialCharacter, ConfirmedColumn } from "./ocr-store";
import { isPunctuation } from "./punctuation";

/**
 * Han-Nôm reading-order utilities.
 *
 * Three responsibilities:
 *   1. Strip punctuation cells from spatialData. Punctuation glyphs are
 *      not allowed in the corpus — they get filtered out at every save.
 *   2. Build rawText from spatialData.
 *   3. Sort spatialData by Han-Nôm reading order (top→bottom within a
 *      column, right→left across columns).
 */

/**
 * Build the rawText string from spatialData. Skips punctuation cells
 * and whitespace-only cells.
 */
export function buildRawText(chars: SpatialCharacter[]): string {
  let out = "";
  for (const c of chars) {
    if (typeof c.text !== "string") continue;
    if (isPunctuation(c.text)) continue;
    if (c.text.trim().length === 0) continue;
    out += c.text;
  }
  return out;
}

/**
 * True iff a char is a legacy formatting sentinel that should be dropped:
 * whitespace text AND no bbox.
 */
function isLegacyFormattingSentinel(c: SpatialCharacter): boolean {
  const hasBbox = Array.isArray(c.bbox) && c.bbox.length >= 4;
  if (hasBbox) return false;
  const t = c.text;
  if (!t) return true;
  return /^\s+$/.test(t);
}

/**
 * Filter spatialData to drop disallowed chars: punctuation (regardless
 * of bbox) and legacy formatting sentinels (whitespace with no bbox).
 */
export function stripPunctuation(chars: SpatialCharacter[]): SpatialCharacter[] {
  return chars.filter(
    (c) => !isPunctuation(c.text) && !isLegacyFormattingSentinel(c)
  );
}

function bboxCenter(bbox: SpatialCharacter["bbox"]) {
  if (!bbox || bbox.length === 0) return { x: 0, y: 0 };
  return {
    x: (bbox[0].x + bbox[1].x) / 2,
    y: (bbox[0].y + bbox[2].y) / 2,
  };
}
function bboxHeight(bbox: SpatialCharacter["bbox"]) {
  if (!bbox || bbox.length < 4) return 0;
  return Math.abs(bbox[3].y - bbox[0].y);
}

/**
 * Top-down reading-order comparator with RTL tiebreak when two chars sit
 * on the same horizontal line (within half the average char height).
 */
function compareWithinColumn(a: SpatialCharacter, b: SpatialCharacter): number {
  if (!a.bbox || !b.bbox) return 0;
  const ay = bboxCenter(a.bbox).y;
  const by = bboxCenter(b.bbox).y;
  const avgH = (bboxHeight(a.bbox) + bboxHeight(b.bbox)) / 2;
  if (Math.abs(ay - by) < avgH * 0.5) {
    return bboxCenter(b.bbox).x - bboxCenter(a.bbox).x;
  }
  return ay - by;
}

/**
 * Reorder spatialData into Han-Nôm reading order.
 *
 * If `columns` is provided, chars are grouped by which column's bbox they
 * fall inside, sorted within each column, and emitted in column order.
 * If `columns` is missing or empty, falls back to a single-column sort.
 *
 * Offsets are intentionally NOT renumbered — they are stable IDs that the
 * editor's React inputs key on.
 */
export function reflowSpatialData(
  chars: SpatialCharacter[],
  columns?: ConfirmedColumn[] | null
): SpatialCharacter[] {
  if (chars.length === 0) return chars;
  const allowed = stripPunctuation(chars);
  const withBbox = allowed.filter((c) => Array.isArray(c.bbox) && c.bbox.length >= 4);
  const noBbox = allowed.filter((c) => !(Array.isArray(c.bbox) && c.bbox.length >= 4));

  if (!columns || columns.length === 0) {
    const sorted = [...withBbox].sort(compareWithinColumn);
    return [...sorted, ...noBbox];
  }

  const grouped: SpatialCharacter[][] = columns.map(() => []);
  const orphans: SpatialCharacter[] = [];
  for (const c of withBbox) {
    const ctr = bboxCenter(c.bbox!);
    let idx = -1;
    for (let i = 0; i < columns.length; i++) {
      const b = columns[i].bbox;
      if (
        ctr.x >= b.minX &&
        ctr.x <= b.maxX &&
        ctr.y >= b.minY &&
        ctr.y <= b.maxY
      ) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) grouped[idx].push(c);
    else orphans.push(c);
  }
  for (const g of grouped) g.sort(compareWithinColumn);
  orphans.sort(compareWithinColumn);

  return [...grouped.flat(), ...orphans, ...noBbox];
}
