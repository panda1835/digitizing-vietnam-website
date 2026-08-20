// src/lib/corpus/fold.ts
//
// The single text-folding implementation for the research corpus. Imported by
// the app AND by scripts/corpus/*.mjs (Node strips the types natively), so the
// normalization used at ingest time and at query time can never drift apart.
//
// THE LENGTH-PRESERVATION CONTRACT
// --------------------------------
// fold() returns a string with EXACTLY the same number of UTF-16 code units as
// its input, and the unit at index i in the output corresponds to the unit at
// index i in the input. That is what lets a match found in `pages.text_norm` be
// reported as a character offset into `pages.text` with no remapping table.
//
// Every transformation below is therefore 1 code point -> 1 code point. Any
// rule that would change the length is skipped and the original kept, because a
// correct offset matters more than folding one exotic character.
//
// Why not Postgres unaccent(): it is STABLE rather than IMMUTABLE (so it cannot
// be used in a generated column without a wrapper), its Vietnamese coverage
// varies by install, and it does not fold đ -> d at all — which appears on
// nearly every page of these books.

/** Combining marks removed when decomposing a precomposed letter. */
const COMBINING = /[̀-ͯ᪰-᫿᷀-᷿⃐-⃰]/g;

/**
 * Vietnamese đ/Đ decompose to nothing under NFD, so they need an explicit rule.
 * Đ is handled by the lowercase pass that follows.
 */
const EXPLICIT: Record<string, string> = {
  "đ": "d", // đ
  "Đ": "d", // Đ
  "’": "'", // right single quote, common in OCR of Latin text
  "‘": "'",
  "“": '"',
  "”": '"',
  "–": "-", // en dash
  "—": "-", // em dash
  " ": " ", // nbsp
};

const foldCharCache = new Map<string, string>();

/**
 * Fold one code point. Returns the input unchanged whenever folding would
 * change its UTF-16 length, which keeps the offset contract intact.
 */
function foldCodePoint(ch: string): string {
  const cached = foldCharCache.get(ch);
  if (cached !== undefined) return cached;

  let out = EXPLICIT[ch];

  if (out === undefined) {
    // Strip diacritics from precomposed Latin letters (ế -> e, ữ -> u, …).
    // CJK, Nôm and other unified ideographs decompose to themselves, so this is
    // a no-op for them rather than something to special-case.
    const stripped = ch.normalize("NFD").replace(COMBINING, "");
    out = stripped.length > 0 ? stripped : ch;
  }

  const lowered = out.toLowerCase();
  if (lowered.length === out.length) out = lowered;

  // The contract: never change length.
  if (out.length !== ch.length) out = ch;

  foldCharCache.set(ch, out);
  return out;
}

/**
 * Normalize text for search matching, preserving UTF-16 offsets exactly.
 *
 * Folds: diacritics (Vietnamese tone + vowel marks), đ -> d, case, curly quotes
 * and dashes. Leaves CJK/Nôm ideographs, whitespace and structure untouched.
 */
export function fold(input: string): string {
  if (!input) return "";

  // NFC first so that already-decomposed input folds the same way precomposed
  // input does. NFC can change length, so the contract is measured against the
  // NFC form — which is also what `corpus.pages.text` stores.
  const nfc = input.normalize("NFC");

  let out = "";
  for (const ch of nfc) out += foldCodePoint(ch);

  return out;
}

/**
 * The canonical storage form for page and chunk text. Every offset in the
 * corpus indexes into the NFC form, so text is normalized once on the way in
 * and never again.
 */
export function toStorageForm(input: string): string {
  return (input ?? "").normalize("NFC");
}

/**
 * True when fold() held its offset contract for this input. Used by the
 * ingestion verifier; cheap enough to assert on every page.
 */
export function foldPreservesLength(input: string): boolean {
  const nfc = toStorageForm(input);
  return fold(nfc).length === nfc.length;
}

const CJK =
  /[㐀-䶿一-鿿豈-﫿]|[\ud840-\ud87f][\udc00-\udfff]|\ud86d[\udc00-\udf3f]|[\ud880-\ud8bf][\udc00-\udfff]/;

/** True if the code point is a Han/Nôm ideograph, including Ext-B and beyond. */
export function isIdeograph(ch: string): boolean {
  return CJK.test(ch);
}

export interface ScriptProfile {
  /** Fraction of non-whitespace characters that are Han/Nôm ideographs, 0..1. */
  ideographRatio: number;
  /** True if any character lies outside the BMP (Ext-B Nôm and friends). */
  hasAstral: boolean;
  /** True if any Vietnamese-specific letter or tone mark is present. */
  hasVietnamese: boolean;
}

const VIETNAMESE = /[đĐ]|[̀-̣̃̉]|[àáâãèéêìíòóôõùúýăĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

/**
 * Cheap script detection used to weight the search legs: a mostly-ideograph
 * query should lean on exact matching, a Vietnamese one on full-text.
 */
export function scriptProfile(input: string): ScriptProfile {
  const text = input ?? "";
  let ideographs = 0;
  let counted = 0;
  let hasAstral = false;

  for (const ch of text) {
    if (ch.length > 1) hasAstral = true;
    if (/\s/.test(ch)) continue;
    counted++;
    if (isIdeograph(ch)) ideographs++;
  }

  return {
    ideographRatio: counted === 0 ? 0 : ideographs / counted,
    hasAstral,
    hasVietnamese: VIETNAMESE.test(text),
  };
}
