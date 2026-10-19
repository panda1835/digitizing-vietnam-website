// Finds an Index Name in Story text, for the reader's yellow highlight. Mirrors
// the Story Name Index builder's exact match (vsc-tri-thuc-ban-dia,
// extractor/name_index.py): case-insensitive, diacritics exact, runs of
// whitespace and hyphens loosened, whole name only. Text and name are NFC.

const SEPARATOR_PATTERN = "[\\s\\-–—]+";
/** A run of whitespace and hyphens: one word gap in an Index Name. */
export const NAME_SEPARATOR = new RegExp(SEPARATOR_PATTERN, "g");
const WORD_CHAR = "[\\p{L}\\p{N}_]";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** [start, end) ranges of every whole-name match of `name` in `text`. */
export const findNameMatches = (
  text: string,
  name: string
): [number, number][] => {
  const words = name.normalize("NFC").split(NAME_SEPARATOR).filter(Boolean);
  if (words.length === 0) return [];
  const pattern = new RegExp(
    `(?<!${WORD_CHAR})${words
      .map(escapeRegExp)
      .join(SEPARATOR_PATTERN)}(?!${WORD_CHAR})`,
    "giu"
  );
  return Array.from(text.matchAll(pattern), (match) => [
    match.index!,
    match.index! + match[0].length,
  ]);
};
