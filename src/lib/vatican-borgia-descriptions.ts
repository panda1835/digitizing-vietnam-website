// src/lib/vatican-borgia-descriptions.ts
//
// DVN's descriptive layer for the Borgia Tonchinensis manuscripts.
//
// HAND-MAINTAINED — unlike VaticanBorgiaMetadata.ts, which the fetch script
// regenerates. The Vatican catalogues this whole fond as shelfmark-only
// records: no titles, no dates, no summaries. Everything a reader needs in
// order to tell one volume from another therefore has to be written here.
//
// Entries are keyed by shelfmark and every field is optional, so the collection
// ships browsable today and improves one record at a time. An item with no
// entry falls back to its shelfmark, which is exactly what the Vatican shows.
//
// genre, scripts and century are the fields the browse sidebar will filter on
// once enough records carry them; until then the grid offers search only.
//
// House style for whoever fills these in:
//   - title: what the volume is, not a catalogue heading. Both locales.
//   - summary: two or three sentences — what it contains, who wrote or copied
//     it, and why a researcher would open it.
//   - scripts: as written on the page — "Quốc ngữ", "Nôm", "Latin",
//     "Portuguese", "Chinese". A volume may mix several.

export interface BorgiaDescription {
  title?: { en: string; vi: string };
  summary?: { en: string; vi: string };
  /** chronicle | catechism | prayer book | dictionary | correspondence | … */
  genre?: string;
  /** Scripts and languages present in the volume. */
  scripts?: string[];
  /** "17th" | "18th" | "19th" */
  century?: string;
}

/** Keyed by Vatican shelfmark. An empty object means "not yet catalogued". */
export const BORGIA_DESCRIPTIONS: Record<string, BorgiaDescription> = {
  "Borg.tonch.1": {},
  "Borg.tonch.2": {},
  "Borg.tonch.3": {},
  "Borg.tonch.4": {},
  "Borg.tonch.5": {},
  "Borg.tonch.6": {},
  "Borg.tonch.7": {},
  "Borg.tonch.8": {},
  "Borg.tonch.9": {},
  "Borg.tonch.10": {},
  "Borg.tonch.11": {},
  "Borg.tonch.12": {},
  "Borg.tonch.13": {},
  "Borg.tonch.14": {},
  "Borg.tonch.15": {},
  "Borg.tonch.16": {},
  "Borg.tonch.17": {},
  "Borg.tonch.18": {},
  "Borg.tonch.19": {},
  "Borg.tonch.20": {},
  "Borg.tonch.21": {},
  "Borg.tonch.22": {},
  "Borg.tonch.23": {},
  "Borg.tonch.24": {},
  "Borg.tonch.25": {},
  "Borg.tonch.26": {},
  "Borg.tonch.27": {},
  "Borg.tonch.28": {},
  "Borg.tonch.29": {},
  "Borg.tonch.30": {},
  "Borg.tonch.31": {},
  "Borg.tonch.32": {},
  "Borg.tonch.33": {},
  "Borg.tonch.34": {},
  "Borg.tonch.35": {},
  "Borg.tonch.36": {},
  "Borg.tonch.37": {},
  "Borg.tonch.38": {},
  "Borg.tonch.39": {},
  "Borg.tonch.40": {},
  "Borg.tonch.41": {},
};
