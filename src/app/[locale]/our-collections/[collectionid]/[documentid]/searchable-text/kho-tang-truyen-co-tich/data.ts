// Server-only data accessors for the Book Reader, one Book per BookConfig.
//
// A Book's whole structure comes from the root table_of_contents.json in its
// public data folder. There is no hand-written manifest to keep in sync. Two
// TOC shapes are read into the same divisions → sections → entries model:
//
// - "parts" (Kho tàng Truyện cổ tích Việt Nam: the extraction pipeline's
//   output plus the hand-written Preface): the Preface, then Parts, each with
//   an optional Part Introduction and its Sections of Stories or Essays, then
//   the Bibliography (not a Part) with its introduction and three Sections,
//   each one markdown file. Parts and the Bibliography are both "divisions":
//   one contents tab each.
// - "flat" (Truyện cổ dân gian Chăm's Web Edition): the Preface, then numbered
//   Stories. One division holds them all, with no Sections.

import { readFileSync } from "fs";
import { join } from "path";

import type { BookConfig } from "./books";
import { parseStoryMarkdown, type ParsedStory } from "./parseStoryMarkdown";

const dataDir = (book: BookConfig) =>
  join(process.cwd(), "public/data", book.dataFolder);

/** Division id of the Bibliography; a Part's is "phan-<n>". */
export const BIBLIOGRAPHY_DIVISION_ID = "thu-muc";

/** Division id of a flat Book's only division. */
const FLAT_DIVISION_ID = "muc-luc";

export type EntryKind =
  /**
   * The Book's Preface (Kho Tàng's Lời nói đầu, listed in Phần thứ nhất's tab;
   * the Chăm book's Lời giới thiệu).
   */
  | "preface"
  | "story"
  | "essay"
  /** A Part Introduction, or the Bibliography's opening prose. */
  | "introduction"
  /** One whole Bibliography Section. */
  | "bibliography-section";

export interface Entry {
  kind: EntryKind;
  /**
   * The `?muc=` slug, e.g. "loi-noi-dau", "truyen-62", "phan-1-muc-ii-bai-3",
   * "phan-3-loi-dan", "thu-muc-loi-dan", "thu-muc-ii", "loi-gioi-thieu".
   */
  muc: string;
  divisionId: string;
  /** Absent for an introduction. */
  sectionId?: string;
  sectionTitle?: string;
  /** Story or Essay number as printed; absent otherwise. */
  number?: number;
  /**
   * For an introduction (untitled in the TOC), its division's title; for a
   * Bibliography Section, the Section's title.
   */
  title: string;
  /** Stories only. */
  hasKhaoDi?: boolean;
  footnoteCount: number;
}

export interface BookSection {
  id: string;
  title: string;
  entries: Entry[];
}

/** A Part, the Bibliography, or a flat Book's whole list: one contents tab. */
export interface BookDivision {
  id: string;
  /** Absent for the Bibliography (not a Part) and a flat Book's division. */
  partNumber?: number;
  title: string;
  introduction?: Entry;
  /**
   * Entries listed outside any Section heading: the Preface (in Phần thứ
   * nhất), the Bibliography's Sections, and a flat Book's every Entry.
   */
  entries: Entry[];
  sections: BookSection[];
}

export interface EntryLookup {
  entry: Entry;
  previous?: Entry;
  next?: Entry;
  body: ParsedStory;
}

interface TocStory {
  story_number: number;
  title: string;
  markdown_file: string;
  /** Absent in a flat Book, which has no Khảo dị. */
  has_khao_di?: boolean;
  footnote_count: number;
}

interface TocEssay {
  essay_number: number;
  title: string;
  markdown_file: string;
  footnote_count: number;
}

interface TocSection {
  section_id: string;
  section_title: string;
  folder: string;
  stories?: TocStory[];
  essays?: TocEssay[];
}

interface TocPart {
  part_number: number;
  part_title: string;
  /** Path relative to the data folder, or null. */
  introduction: string | null;
  sections: TocSection[];
}

interface TocBibliographySection {
  section_id: string;
  section_title: string;
  /** Path relative to the data folder. */
  markdown_file: string;
}

interface TocBibliography {
  title: string;
  introduction: string | null;
  sections: TocBibliographySection[];
}

interface TocPreface {
  title: string;
  /** Path relative to the data folder. */
  markdown_file: string;
  footnote_count: number;
}

interface PartsToc {
  preface?: TocPreface;
  parts: TocPart[];
  bibliography?: TocBibliography;
}

interface FlatToc {
  book_title: string;
  preface: TocPreface;
  /** In book order; markdown_file is relative to the data folder. */
  stories: TocStory[];
}

interface Book {
  divisions: BookDivision[];
  /** Every Entry in book order. */
  entries: Entry[];
  bySlug: Map<string, { index: number; mdPath: string }>;
}

/** Loaded Books by BookConfig id. */
const cachedBooks = new Map<string, Book>();

const partDivisionId = (part: TocPart) => `phan-${part.part_number}`;

const sectionEntries = (dir: string, part: TocPart, section: TocSection) => {
  const base = {
    divisionId: partDivisionId(part),
    sectionId: section.section_id,
    sectionTitle: section.section_title,
  };
  const stories = (section.stories ?? []).map((story) => ({
    entry: {
      ...base,
      kind: "story" as const,
      muc: `truyen-${story.story_number}`,
      number: story.story_number,
      title: story.title,
      hasKhaoDi: story.has_khao_di,
      footnoteCount: story.footnote_count,
    },
    mdPath: join(dir, section.folder, story.markdown_file),
  }));
  const essays = (section.essays ?? []).map((essay) => ({
    entry: {
      ...base,
      kind: "essay" as const,
      muc: `phan-${part.part_number}-muc-${section.section_id.toLowerCase()}-bai-${essay.essay_number}`,
      number: essay.essay_number,
      title: essay.title,
      footnoteCount: essay.footnote_count,
    },
    mdPath: join(dir, section.folder, essay.markdown_file),
  }));
  return [...stories, ...essays].sort((a, b) => a.entry.number - b.entry.number);
};

const loadBook = (book: BookConfig): Book => {
  const cached = cachedBooks.get(book.id);
  if (cached) return cached;

  const dir = dataDir(book);
  const toc = JSON.parse(
    readFileSync(join(dir, "table_of_contents.json"), "utf-8")
  );

  const entries: Entry[] = [];
  const bySlug: Book["bySlug"] = new Map();
  const add = (entry: Entry, mdPath: string) => {
    if (bySlug.has(entry.muc)) {
      throw new Error(`[${book.id}] duplicate muc slug "${entry.muc}"`);
    }
    bySlug.set(entry.muc, { index: entries.length, mdPath });
    entries.push(entry);
  };

  const divisions =
    book.tocShape === "flat"
      ? buildFlatDivisions(book, dir, toc as FlatToc, add)
      : buildPartsDivisions(book, dir, toc as PartsToc, add);

  const loaded = { divisions, entries, bySlug };
  cachedBooks.set(book.id, loaded);
  warnFootnoteMismatches(book, loaded);
  return loaded;
};

type AddEntry = (entry: Entry, mdPath: string) => void;

/** One division: the Preface, then the Stories in book order. */
const buildFlatDivisions = (
  book: BookConfig,
  dir: string,
  toc: FlatToc,
  add: AddEntry
): BookDivision[] => {
  const divisionId = FLAT_DIVISION_ID;
  const preface: Entry = {
    kind: "preface",
    muc: book.prefaceMuc,
    divisionId,
    title: toc.preface.title,
    footnoteCount: toc.preface.footnote_count,
  };
  add(preface, join(dir, toc.preface.markdown_file));

  const stories = toc.stories.map((story) => {
    const entry: Entry = {
      kind: "story",
      muc: `truyen-${story.story_number}`,
      divisionId,
      number: story.story_number,
      title: story.title,
      footnoteCount: story.footnote_count,
    };
    add(entry, join(dir, story.markdown_file));
    return entry;
  });

  return [
    {
      id: divisionId,
      title: toc.book_title,
      entries: [preface, ...stories],
      sections: [],
    },
  ];
};

const buildPartsDivisions = (
  book: BookConfig,
  dir: string,
  toc: PartsToc,
  add: AddEntry
): BookDivision[] => {
  const divisions: BookDivision[] = [];

  // The TOC carries no footnote count for introductions or the Bibliography.
  const addUncounted = (entry: Omit<Entry, "footnoteCount">, path: string) => {
    const mdPath = join(dir, path);
    const full = { ...entry, footnoteCount: parseEntryFile(mdPath).footnotes.length };
    add(full, mdPath);
    return full;
  };

  // The Preface opens the Book and is listed under the first Part's tab.
  let preface: Entry | undefined;
  if (toc.preface) {
    preface = {
      kind: "preface",
      muc: book.prefaceMuc,
      divisionId: partDivisionId(toc.parts[0]),
      title: toc.preface.title,
      footnoteCount: toc.preface.footnote_count,
    };
    add(preface, join(dir, toc.preface.markdown_file));
  }

  for (const part of toc.parts) {
    const divisionId = partDivisionId(part);
    const introduction = part.introduction
      ? addUncounted(
          {
            kind: "introduction",
            muc: `${divisionId}-loi-dan`,
            divisionId,
            title: part.part_title,
          },
          part.introduction
        )
      : undefined;

    const sections = part.sections.map((section) => {
      const items = sectionEntries(dir, part, section);
      items.forEach(({ entry, mdPath }) => add(entry, mdPath));
      return {
        id: section.section_id,
        title: section.section_title,
        entries: items.map(({ entry }) => entry),
      };
    });

    divisions.push({
      id: divisionId,
      partNumber: part.part_number,
      title: part.part_title,
      introduction,
      entries: preface?.divisionId === divisionId ? [preface] : [],
      sections,
    });
  }

  const bibliography = toc.bibliography;
  if (bibliography) {
    const divisionId = BIBLIOGRAPHY_DIVISION_ID;
    const introduction = bibliography.introduction
      ? addUncounted(
          {
            kind: "introduction",
            muc: `${divisionId}-loi-dan`,
            divisionId,
            title: bibliography.title,
          },
          bibliography.introduction
        )
      : undefined;
    const sectionsAsEntries = bibliography.sections.map((section) =>
      addUncounted(
        {
          kind: "bibliography-section",
          muc: `${divisionId}-${section.section_id.toLowerCase()}`,
          divisionId,
          sectionId: section.section_id,
          sectionTitle: section.section_title,
          title: section.section_title,
        },
        section.markdown_file
      )
    );
    divisions.push({
      id: divisionId,
      title: bibliography.title,
      introduction,
      entries: sectionsAsEntries,
      sections: [],
    });
  }

  return divisions;
};

const parseEntryFile = (mdPath: string) =>
  parseStoryMarkdown(readFileSync(mdPath, "utf-8"));

/**
 * The Book's contents tabs: Kho Tàng's Parts in order, then the Bibliography;
 * a flat Book's one division.
 */
export const getDivisions = (book: BookConfig): BookDivision[] =>
  loadBook(book).divisions;

/** The first Entry in book order: the Preface. */
export const getDefaultEntry = (book: BookConfig): Entry =>
  loadBook(book).entries[0];

export const getEntryBySlug = (
  book: BookConfig,
  muc: string
): Entry | undefined => {
  const { entries, bySlug } = loadBook(book);
  const found = bySlug.get(muc);
  return found && entries[found.index];
};

/** An Entry with its neighbours and parsed body; undefined for an unknown slug. */
export const lookupEntry = (
  book: BookConfig,
  muc: string
): EntryLookup | undefined => {
  const { entries, bySlug } = loadBook(book);
  const found = bySlug.get(muc);
  if (!found) return undefined;
  return {
    entry: entries[found.index],
    previous: entries[found.index - 1],
    next: entries[found.index + 1],
    body: parseEntryFile(found.mdPath),
  };
};

// --- Story Name Index ---------------------------------------------------------
//
// Kho Tàng's story_name_index.json is the printed Bảng tra cứu tên truyện,
// resolved against the Story text by a one-off builder and hand-corrected
// since; see IndexNameRecord. It is the source of truth: never regenerated by
// the build. Only Books whose search is "story-name-index" have one.

export type IndexNameLocation = "story" | "khao-di" | "chu-thich";

interface IndexNameRecord {
  /** As printed, qualifier stripped. */
  printed: string;
  qualifier?: string;
  /** Set for "Xem X" cross-references; targets are X's. */
  aliasOf?: string;
  targets: {
    story: number;
    tap: string;
    location: IndexNameLocation;
    /** In-text spelling; absent when unresolved. */
    textName?: string;
    /** chu-thich only: 1-based ordinal of the Footnote holding the name. */
    footnote?: string;
  }[];
}

/** One search result: an Index Name × one of its target Stories. */
export interface IndexNameRow {
  name: string;
  qualifier?: string;
  textName?: string;
  location: IndexNameLocation;
  footnote?: string;
  /** The target Story's `?muc=` slug, number and title. */
  muc: string;
  storyNumber: number;
  storyTitle: string;
}

/** Index rows by BookConfig id. */
const cachedIndexRows = new Map<string, IndexNameRow[]>();

/** Every (Index Name, target Story) pair whose Story is in the Book, in index order. */
export const getIndexNameRows = (book: BookConfig): IndexNameRow[] => {
  const cached = cachedIndexRows.get(book.id);
  if (cached) return cached;
  const records: IndexNameRecord[] = JSON.parse(
    readFileSync(join(dataDir(book), "story_name_index.json"), "utf-8")
  );
  const rows = records.flatMap((record) =>
    record.targets.flatMap((target) => {
      const story = getEntryBySlug(book, `truyen-${target.story}`);
      if (!story) {
        console.warn(
          `[${book.id}] Index Name "${record.printed}" points to unknown Story ${target.story}`
        );
        return [];
      }
      return [
        {
          name: record.printed,
          qualifier: record.qualifier,
          textName: target.textName,
          location: target.location,
          footnote: target.footnote,
          muc: story.muc,
          storyNumber: target.story,
          storyTitle: story.title,
        },
      ];
    })
  );
  cachedIndexRows.set(book.id, rows);
  return rows;
};

/**
 * Logs, once per server process, every Entry whose footnote-marker count
 * differs from its footnote-definition count — extraction defects to be fixed
 * in the source data. Until then, position matching is off from the first
 * missing marker or merged definition onward in those Entries; markers past
 * the last definition render as plain text.
 */
const warnFootnoteMismatches = (book: BookConfig, { entries, bySlug }: Book) => {
  const mismatched = entries.flatMap((entry) => {
    const { markerCount, footnotes } = parseEntryFile(bySlug.get(entry.muc)!.mdPath);
    return markerCount === footnotes.length
      ? []
      : [`${entry.muc} (${markerCount} markers / ${footnotes.length} definitions)`];
  });
  if (mismatched.length > 0) {
    console.warn(
      `[${book.id}] ${mismatched.length} entries have mismatched footnote counts: ${mismatched.join(", ")}`
    );
  }
};
