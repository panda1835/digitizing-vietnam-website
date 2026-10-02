// Display casing for the Book's titles, which the TOC prints in ALL CAPS.
// Every word (each hyphen-joined syllable too) gets a capital first letter,
// so proper nouns like "Hồ Gươm" and "Việt-Nam" read right without a list.
// A Section's Roman numeral prefix ("II. ") stays uppercase.

const ROMAN_PREFIX = /^[IVXLCDM]+\.\s/;
const WORD = /[^\s-]+/g;

const isCased = (char: string) =>
  char.toLocaleUpperCase("vi") !== char.toLocaleLowerCase("vi");

/** Uppercases a lowercased word's first letter, past any leading punctuation. */
const capitalize = (word: string) => {
  const i = word.split("").findIndex(isCased);
  return i === -1
    ? word
    : word.slice(0, i) + word[i].toLocaleUpperCase("vi") + word.slice(i + 1);
};

export const toTitleCase = (title: string): string => {
  const prefix = title.match(ROMAN_PREFIX)?.[0] ?? "";
  return (
    prefix +
    title.slice(prefix.length).toLocaleLowerCase("vi").replace(WORD, capitalize)
  );
};
