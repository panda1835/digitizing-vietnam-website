// Server-only data accessors for "Kho tàng Truyện cổ tích Việt Nam".
//
// The content is the extraction pipeline's output, copied verbatim into
// public/data/kho-tang-truyen-co-tich-viet-nam/. The Book's whole structure
// comes from the root table_of_contents.json there: Parts, each with an
// optional Part Introduction and its Sections of Stories or Essays, then the
// Bibliography (not a Part) with its introduction and three Sections, each one
// markdown file. There is no hand-written manifest to keep in sync.
//
// Parts and the Bibliography are both "divisions": one contents tab each.

import { readFileSync } from "fs";
import { join } from "path";

import { parseStoryMarkdown, type ParsedStory } from "./parseStoryMarkdown";

/** The Collection Item this reader replaces Mirador on. */
export const KHO_TANG_COLLECTION_ID = "vietnamese-folk-literature";
export const KHO_TANG_DOCUMENT_ID = "truyen-co-tich-viet-nam";

const DATA_DIR = join(
  process.cwd(),
  "public/data/kho-tang-truyen-co-tich-viet-nam"
);

/** Division id of the Bibliography; a Part's is "phan-<n>". */
export const BIBLIOGRAPHY_DIVISION_ID = "thu-muc";

export type EntryKind =
  | "story"
  | "essay"
  /** A Part Introduction, or the Bibliography's opening prose. */
  | "introduction"
  /** One whole Bibliography Section. */
  | "bibliography-section";

export interface Entry {
  kind: EntryKind;
  /**
   * The `?muc=` slug, e.g. "truyen-62", "phan-1-muc-ii-bai-3",
   * "phan-3-loi-dan", "thu-muc-loi-dan", "thu-muc-ii".
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

/** A Part or the Bibliography: one contents tab. */
export interface BookDivision {
  id: string;
  /** Absent for the Bibliography, which is not a Part. */
  partNumber?: number;
  title: string;
  introduction?: Entry;
  /** Entries listed outside any Section heading: the Bibliography's Sections. */
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
  has_khao_di: boolean;
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
  /** Path relative to DATA_DIR, or null. */
  introduction: string | null;
  sections: TocSection[];
}

interface TocBibliographySection {
  section_id: string;
  section_title: string;
  /** Path relative to DATA_DIR. */
  markdown_file: string;
}

interface TocBibliography {
  title: string;
  introduction: string | null;
  sections: TocBibliographySection[];
}

interface Toc {
  parts: TocPart[];
  bibliography?: TocBibliography;
}

interface Book {
  divisions: BookDivision[];
  /** Every Entry in book order. */
  entries: Entry[];
  bySlug: Map<string, { index: number; mdPath: string }>;
}

let cachedBook: Book | null = null;

const partDivisionId = (part: TocPart) => `phan-${part.part_number}`;

const sectionEntries = (part: TocPart, section: TocSection) => {
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
    mdPath: join(DATA_DIR, section.folder, story.markdown_file),
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
    mdPath: join(DATA_DIR, section.folder, essay.markdown_file),
  }));
  return [...stories, ...essays].sort((a, b) => a.entry.number - b.entry.number);
};

const loadBook = (): Book => {
  if (cachedBook) return cachedBook;

  const toc: Toc = JSON.parse(
    readFileSync(join(DATA_DIR, "table_of_contents.json"), "utf-8")
  );

  const divisions: BookDivision[] = [];
  const entries: Entry[] = [];
  const bySlug: Book["bySlug"] = new Map();
  const add = (entry: Entry, mdPath: string) => {
    if (bySlug.has(entry.muc)) {
      throw new Error(`[kho-tang-truyen] duplicate muc slug "${entry.muc}"`);
    }
    bySlug.set(entry.muc, { index: entries.length, mdPath });
    entries.push(entry);
  };

  // The TOC carries no footnote count for introductions or the Bibliography.
  const addUncounted = (entry: Omit<Entry, "footnoteCount">, path: string) => {
    const mdPath = join(DATA_DIR, path);
    const full = { ...entry, footnoteCount: parseEntryFile(mdPath).footnotes.length };
    add(full, mdPath);
    return full;
  };

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
      const items = sectionEntries(part, section);
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
      entries: [],
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

  cachedBook = { divisions, entries, bySlug };
  warnFootnoteMismatches(cachedBook);
  return cachedBook;
};

const parseEntryFile = (mdPath: string) =>
  parseStoryMarkdown(readFileSync(mdPath, "utf-8"));

/** The Book's Parts in order, then the Bibliography: one contents tab each. */
export const getDivisions = (): BookDivision[] => loadBook().divisions;

/** The first Entry in book order. */
export const getDefaultEntry = (): Entry => loadBook().entries[0];

export const getEntryBySlug = (muc: string): Entry | undefined => {
  const { entries, bySlug } = loadBook();
  const found = bySlug.get(muc);
  return found && entries[found.index];
};

/** An Entry with its neighbours and parsed body; undefined for an unknown slug. */
export const lookupEntry = (muc: string): EntryLookup | undefined => {
  const { entries, bySlug } = loadBook();
  const found = bySlug.get(muc);
  if (!found) return undefined;
  return {
    entry: entries[found.index],
    previous: entries[found.index - 1],
    next: entries[found.index + 1],
    body: parseEntryFile(found.mdPath),
  };
};

/**
 * Logs, once per server process, every Entry whose footnote-marker count
 * differs from its footnote-definition count — extraction defects to be fixed
 * in the source data. Until then, position matching is off from the first
 * missing marker or merged definition onward in those Entries; markers past
 * the last definition render as plain text.
 */
const warnFootnoteMismatches = ({ entries, bySlug }: Book) => {
  const mismatched = entries.flatMap((entry) => {
    const { markerCount, footnotes } = parseEntryFile(bySlug.get(entry.muc)!.mdPath);
    return markerCount === footnotes.length
      ? []
      : [`${entry.muc} (${markerCount} markers / ${footnotes.length} definitions)`];
  });
  if (mismatched.length > 0) {
    console.warn(
      `[kho-tang-truyen] ${mismatched.length} entries have mismatched footnote counts: ${mismatched.join(", ")}`
    );
  }
};
