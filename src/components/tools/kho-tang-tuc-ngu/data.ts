// The website's side of the Kho tàng tục ngữ người Việt export. Every file
// under public/data/kho-tang-tuc-ngu/ is copied by hand from the export of
// resume-scanning's khotangtucngu pipeline; nothing here writes to it.
// Vocabulary: resume-scanning/vsc-project/khoTangTucNguoiNguoiViet/GLOSSARY.md

const DATA_BASE = "/data/kho-tang-tuc-ngu";

/** The intro (Front Matter) and list routes, without the locale. */
export const INTRO_PATH = "/research/ca-dao-tuc-ngu/kho-tang-tuc-ngu";
export const LIST_PATH = `${INTRO_PATH}/tra-cuu`;

// Entry Images live beside the data for the demo (the first 10 entries of
// each letter only). Moving them to IIIF changes this one constant.
const ENTRY_IMAGE_BASE = `${DATA_BASE}/entry_images`;

/** The 29 letters of the book, in its order. */
export const ALPHABET = [
  "A", "Ă", "Â", "B", "C", "D", "Đ", "E", "Ê", "G", "H", "I", "K", "L", "M",
  "N", "O", "Ô", "Ơ", "P", "Q", "R", "S", "T", "U", "Ư", "V", "X", "Y",
];

/**
 * The letters whose Proverb Entries are exported, one file each under
 * letters/. Update it by hand when a new PDF Part's export is copied in.
 */
export const AVAILABLE_LETTERS = ["A", "Ă", "Â", "B", "C"];

/** PDF Parts exported so far, of the 4 the work is uploaded as. */
export const EXPORTED_PARTS = 1;
export const TOTAL_PARTS = 4;

/**
 * A stretch of text with its markup. `general` marks an Expansion (the
 * General Abbreviation it replaced), `source` a Source Abbreviation.
 */
export interface Run {
  text: string;
  em?: boolean;
  strong?: boolean;
  general?: string;
  source?: string;
}

export interface Citation {
  abbreviation: string;
  pages: string;
}

export interface Variant {
  label: string;
  text: Run[];
  citations: Citation[];
}

export interface Correction {
  wrong: string;
  sources: string[];
  right: Run[];
  sentence: Run[];
}

/** A resolved See-also has an anchor and preview; an Unresolved one has neither. */
export interface SeeAlso {
  name: string;
  anchor?: string;
  preview?: string;
}

export interface ProverbEntry {
  name: string;
  anchor: string;
  letter: string;
  number: number;
  proverb: string;
  citations: Citation[];
  variants: Variant[];
  notes: Run[][];
  corrections: Correction[];
  see_also: SeeAlso[];
  first_syllable: string;
  sources: string[];
  has_notes: boolean;
  has_variants: boolean;
  has_correction: boolean;
  earliest_year: number | null;
  book_pages: string[];
  pdf_pages: number[];
  fixed: boolean;
  image: string;
}

export interface Source {
  abbreviation: string;
  title: string;
  author: string | null;
  kind: string;
  year: number | null;
  /** Shared by every volume of a multi-volume Source, e.g. NASL I–IV. */
  note_id: string;
  note: string;
}

export type Sources = Record<string, Source>;

export function entryImageUrl(entry: ProverbEntry): string {
  return `${ENTRY_IMAGE_BASE}/${encodeURIComponent(entry.image)}`;
}

/** The id of a Source Note's heading on the intro page. */
export function sourceNoteId(noteId: string): string {
  return `nguon-${noteId}`;
}

/** "C-484" → "C"; anchors are `<letter>-<number>`. */
export function letterOfAnchor(anchor: string): string {
  return anchor.slice(0, anchor.lastIndexOf("-"));
}

/** Lowercase, with tone marks and diacritics removed: "Đầu" → "dau". */
export function foldDiacritics(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

// Module-level caches so the list, the search and the modal share each
// fetch, and a letter is downloaded once per visit.
const letterCache: Record<string, Promise<ProverbEntry[]>> = {};
let sourcesCache: Promise<Sources> | null = null;

export function fetchLetter(letter: string): Promise<ProverbEntry[]> {
  if (!AVAILABLE_LETTERS.includes(letter)) return Promise.resolve([]);
  if (!letterCache[letter]) {
    letterCache[letter] = fetch(`${DATA_BASE}/letters/${encodeURIComponent(letter)}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Letter ${letter}: HTTP ${res.status}`);
        return res.json();
      })
      .catch((e) => {
        delete letterCache[letter];
        throw e;
      });
  }
  return letterCache[letter];
}

export function fetchAllLetters(): Promise<ProverbEntry[]> {
  return Promise.all(AVAILABLE_LETTERS.map(fetchLetter)).then((lists) => lists.flat());
}

export function fetchSources(): Promise<Sources> {
  if (!sourcesCache) {
    sourcesCache = fetch(`${DATA_BASE}/sources.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`sources.json: HTTP ${res.status}`);
        return res.json();
      })
      .catch((e) => {
        sourcesCache = null;
        throw e;
      });
  }
  return sourcesCache;
}

/** The entry an anchor names, or null when it isn't exported. */
export async function findEntry(anchor: string): Promise<ProverbEntry | null> {
  const entries = await fetchLetter(letterOfAnchor(anchor));
  return entries.find((e) => e.anchor === anchor) ?? null;
}
