/**
 * Helpers shared by corpus-walk admin pages (the OCR labels page) and the
 * APIs that feed them. Kept here so any viewer computes column number and
 * document title identically. Ported from nom-ocr-training so the labels
 * UX stays consistent across the sibling tools.
 */

export function findColumnIndex(
  bbox: Array<{ x: number; y: number }> | null | undefined,
  columns:
    | Array<{ bbox: { minX: number; maxX: number; minY: number; maxY: number } }>
    | undefined
): number | null {
  if (!bbox || !columns || columns.length === 0) return null;
  const xs = bbox.map((p) => p.x);
  const ys = bbox.map((p) => p.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  for (let i = 0; i < columns.length; i++) {
    const b = columns[i].bbox;
    if (cx >= b.minX && cx <= b.maxX && cy >= b.minY && cy <= b.maxY) {
      return i + 1;
    }
  }
  return null;
}

export function docTitle(
  index: Record<string, { title?: string }>,
  slug: string
): string {
  return index[slug]?.title ?? slug;
}
