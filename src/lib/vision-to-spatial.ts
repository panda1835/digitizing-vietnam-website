import { SpatialCharacter } from "./ocr-store";

interface VisionVertex {
  x?: number;
  y?: number;
}

interface VisionBoundingPoly {
  vertices?: VisionVertex[];
  normalizedVertices?: VisionVertex[];
}

interface VisionSymbol {
  text?: string;
  confidence?: number;
  boundingBox?: VisionBoundingPoly;
  property?: {
    detectedBreak?: { type?: string };
  };
}

interface VisionWord {
  symbols?: VisionSymbol[];
  confidence?: number;
  boundingBox?: VisionBoundingPoly;
}

interface VisionParagraph {
  words?: VisionWord[];
}

interface VisionBlock {
  paragraphs?: VisionParagraph[];
}

interface VisionPage {
  blocks?: VisionBlock[];
  width?: number;
  height?: number;
}

interface VisionTextAnnotation {
  pages?: VisionPage[];
  text?: string;
}

/** Check if a character is CJK (Han-Nom). */
function isCJK(char: string): boolean {
  const cp = char.codePointAt(0) ?? 0;
  return (
    (cp >= 0x2e80 && cp <= 0x9fff) ||  // CJK Radicals, Unified Ideographs, etc.
    (cp >= 0x3400 && cp <= 0x4dbf) ||  // Extension A
    (cp >= 0xf900 && cp <= 0xfaff) ||  // Compatibility Ideographs
    (cp >= 0x20000 && cp <= 0x2fa1f)   // Extensions B-F + Compatibility Supplement
  );
}

/** Compute normalized bbox area (0-1 range). */
function bboxArea(bbox: Array<{ x: number; y: number }>): number {
  const xs = bbox.map((v) => v.x);
  const ys = bbox.map((v) => v.y);
  return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
}

/**
 * Convert a Google Cloud Vision full-text annotation to our SpatialCharacter[] format.
 * Bounding boxes are normalized to [0,1] range relative to page dimensions.
 *
 * Filters:
 * - Only CJK characters are kept (no Latin, Arabic numerals, punctuation)
 * - Whitespace/breaks are preserved for text structure
 * - Tiny symbols (< 8% of median character area) are discarded as noise
 *
 * Returns both accepted spatialData and candidateData (rejected CJK chars
 * that might still be real characters the user should review).
 */
export function visionToSpatialData(
  annotation: VisionTextAnnotation,
  pageWidth: number,
  pageHeight: number
): { spatialData: SpatialCharacter[]; candidateData: SpatialCharacter[] } {
  const raw: Array<{ text: string; bbox: Array<{ x: number; y: number }> | null; confidence: number; breakType?: string }> = [];

  const w = pageWidth || 1;
  const h = pageHeight || 1;

  // First pass: collect all symbols with normalized bboxes
  for (const page of annotation.pages ?? []) {
    for (const block of page.blocks ?? []) {
      for (const paragraph of block.paragraphs ?? []) {
        for (const word of paragraph.words ?? []) {
          for (const symbol of word.symbols ?? []) {
            const text = symbol.text ?? "";
            const verts = symbol.boundingBox?.vertices ?? [];

            let bbox: Array<{ x: number; y: number }> | null = null;
            if (verts.length === 4) {
              bbox = verts.map((v) => ({
                x: (v.x ?? 0) / w,
                y: (v.y ?? 0) / h,
              }));
            }

            raw.push({
              text,
              bbox,
              confidence: symbol.confidence ?? 0,
              breakType: symbol.property?.detectedBreak?.type,
            });
          }
        }
        // Mark end of paragraph
        raw.push({ text: "\n", bbox: null, confidence: 1, breakType: "__PARA__" });
      }
    }
  }

  // Compute median area of CJK characters for size filtering
  const cjkAreas = raw
    .filter((s) => s.bbox && isCJK(s.text))
    .map((s) => bboxArea(s.bbox!))
    .sort((a, b) => a - b);
  const medianArea = cjkAreas.length > 0 ? cjkAreas[Math.floor(cjkAreas.length / 2)] : 0;
  const minArea = medianArea * 0.08; // 8% of median — very conservative to avoid dropping real chars

  // Second pass: filter and build result
  const result: SpatialCharacter[] = [];
  const rejected: Array<{ text: string; bbox: Array<{ x: number; y: number }>; confidence: number }> = [];
  let offset = 0;

  for (const s of raw) {
    // Paragraph breaks
    if (s.breakType === "__PARA__") {
      result.push({ text: "\n", bbox: null, confidence: 1, offset });
      offset += 1;
      continue;
    }

    const text = s.text;

    // Only keep CJK characters and whitespace
    if (text.trim().length > 0 && !isCJK(text)) {
      const breakType = s.breakType;
      if (breakType === "LINE_BREAK" || breakType === "SURE_SPACE") {
        result.push({ text: "\n", bbox: null, confidence: 1, offset });
        offset += 1;
      }
      continue;
    }

    // Skip tiny symbols (noise) — but save CJK ones as candidates
    if (s.bbox && text.trim().length > 0 && minArea > 0 && bboxArea(s.bbox) < minArea) {
      rejected.push({ text, bbox: s.bbox, confidence: s.confidence });
      continue;
    }

    // Skip characters fully outside the page bounds — but save CJK ones as candidates
    if (s.bbox && text.trim().length > 0) {
      const xs = s.bbox.map((v) => v.x);
      const ys = s.bbox.map((v) => v.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      if (cx < 0 || cx > 1 || cy < 0 || cy > 1) {
        rejected.push({ text, bbox: s.bbox, confidence: s.confidence });
        continue;
      }
    }

    result.push({
      text,
      bbox: s.bbox,
      confidence: s.confidence,
      offset,
    });
    offset += text.length;

    const breakType = s.breakType;
    if (breakType === "SPACE" || breakType === "EOL_SURE_SPACE") {
      result.push({ text: " ", bbox: null, confidence: 1, offset });
      offset += 1;
    } else if (breakType === "LINE_BREAK" || breakType === "SURE_SPACE") {
      result.push({ text: "\n", bbox: null, confidence: 1, offset });
      offset += 1;
    }
  }

  // Deduplicate: Vision API sometimes returns the same character from overlapping
  // blocks/paragraphs. Remove chars whose bbox center is nearly identical to a
  // previous char with the same text.
  const deduped: SpatialCharacter[] = [];
  for (const c of result) {
    if (!c.bbox) {
      deduped.push(c);
      continue;
    }
    const cx = (c.bbox[0].x + c.bbox[2].x) / 2;
    const cy = (c.bbox[0].y + c.bbox[2].y) / 2;
    const isDupe = deduped.some((prev) => {
      if (!prev.bbox || prev.text !== c.text) return false;
      const px = (prev.bbox[0].x + prev.bbox[2].x) / 2;
      const py = (prev.bbox[0].y + prev.bbox[2].y) / 2;
      return Math.abs(cx - px) < 0.01 && Math.abs(cy - py) < 0.01;
    });
    if (!isDupe) deduped.push(c);
  }

  // Recalculate offsets after dedup
  let finalOffset = 0;
  for (const c of deduped) {
    c.offset = finalOffset;
    finalOffset += c.text.length;
  }

  // Build candidateData: rejected CJK chars, assigned dummy offsets
  let candOffset = 0;
  const candidateData: SpatialCharacter[] = rejected.map((r) => {
    const c: SpatialCharacter = { text: r.text, bbox: r.bbox, confidence: r.confidence, offset: candOffset };
    candOffset += r.text.length;
    return c;
  });

  return { spatialData: deduped, candidateData };
}

export function spatialDataToRawText(chars: SpatialCharacter[]): string {
  return chars.map((c) => c.text).join("");
}
