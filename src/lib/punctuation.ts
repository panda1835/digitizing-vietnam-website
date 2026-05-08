/**
 * CJK / Han-Nôm punctuation detector.
 *
 * Punctuation glyphs from kandi or NNV come back with bboxes that are
 * dramatically smaller than real chars (often 1/3 to 1/5 the width of a
 * normal main-text char). Including them in column auto-detection drags
 * the cluster's `avgCharW` and `avgH` down, which lowers downstream
 * X-match thresholds and Y-gap thresholds enough to fragment legit
 * columns. The simple fix is to drop them at OCR ingest and exclude
 * them from the column detector entirely.
 */

const PUNCT = new Set<string>([
  // Sentence-final and clause separators
  "。",
  "、",
  "，",
  "；",
  "：",
  "！",
  "？",
  "・",
  "·",
  "．",
  // Quote / bracket pairs
  "「",
  "」",
  "『",
  "』",
  "〈",
  "〉",
  "《",
  "》",
  "【",
  "】",
  "〔",
  "〕",
  "(",
  ")",
  // Misc
  "…",
  "—",
  "〃",
  "〆",
]);

// CJK Compatibility Forms (U+FE30–FE4F): vertical-text presentation
// variants of the standard CJK punctuation.
function isCjkCompatibilityFormsPunct(text: string): boolean {
  if (text.length !== 1) return false;
  const cp = text.charCodeAt(0);
  return cp >= 0xfe30 && cp <= 0xfe4f;
}

export function isPunctuation(text: string | undefined | null): boolean {
  if (!text) return false;
  if (text.length !== 1) return false;
  return PUNCT.has(text) || isCjkCompatibilityFormsPunct(text);
}

// CJK ideograph blocks. Excludes punctuation, kana, Latin, IDS operators.
// Coverage: Unified + Extensions A through I + Compatibility Ideographs.
const CJK_IDEOGRAPH_RANGES: Array<[number, number]> = [
  [0x3400, 0x4dbf], // Ext A
  [0x4e00, 0x9fff], // Unified
  [0xf900, 0xfaff], // Compatibility
  [0x20000, 0x2a6df], // Ext B
  [0x2a700, 0x2b73f], // Ext C
  [0x2b740, 0x2b81f], // Ext D
  [0x2b820, 0x2ceaf], // Ext E
  [0x2ceb0, 0x2ebef], // Ext F
  [0x2ebf0, 0x2ee5f], // Ext I
  [0x2f800, 0x2fa1f], // Compat Supplement
  [0x30000, 0x3134f], // Ext G
  [0x31350, 0x323af], // Ext H
];

/**
 * Whitelist for what's allowed to land in spatialData. Stricter than the
 * `isPunctuation` blacklist — accepts only single-char strings that are
 * a real Han ideograph, a Private Use Area glyph (used for unencoded
 * Han-Nôm chars), or 〇 (U+3007, Han numeric zero).
 */
export function isAllowedSpatialChar(
  text: string | undefined | null
): boolean {
  if (!text) return false;
  // Count code points, not UTF-16 units — Plane 15/16 PUA chars are
  // surrogate pairs (text.length === 2) but only one code point.
  const cps = Array.from(text);
  if (cps.length !== 1) return false;
  const cp = cps[0].codePointAt(0);
  if (cp === undefined) return false;
  if (cp === 0x3007) return true;
  // PUA: BMP + Plane 15 + Plane 16 (used for Nôm chars without a real CP)
  if (cp >= 0xe000 && cp <= 0xf8ff) return true;
  if (cp >= 0xf0000 && cp <= 0xffffd) return true;
  if (cp >= 0x100000 && cp <= 0x10fffd) return true;
  for (const [lo, hi] of CJK_IDEOGRAPH_RANGES) {
    if (cp >= lo && cp <= hi) return true;
  }
  return false;
}
