// Splits the Từ điển nghề thủ công export (public/data/tu-dien-nghe-thu-cong/
// book.md) into its Entries. Pure and written in erasable TypeScript only, so
// parseBook.test.mjs runs it in Node with the types stripped.
//
// The export's shape: front matter (Trang tên sách, Biên mục, Mục lục) before
// `# LỜI NÓI ĐẦU`, then one `# PHẦN …` line per Phần with one `## …` heading
// per Entry beneath it.

export type EntryKind = "preface" | "overview-article" | "headword-entry";

export interface Entry {
  slug: string;
  /** As printed, capitals included. */
  title: string;
  kind: EntryKind;
  startPage: number;
  endPage: number;
  /** The body without its heading or page markers. */
  markdown: string;
}

export interface Phan {
  title: string;
  entries: Entry[];
}

export interface Book {
  preface: Entry;
  parts: Phan[];
  /** Book (Mục lục) order, the Preface first. */
  entries: Entry[];
}

const PREFACE_HEADING = "# LỜI NÓI ĐẦU";
const PHAN_HEADING = /^# (PHẦN .*)$/;
const ENTRY_HEADING = /^## (.*)$/;
/** Captures the page number, so split() interleaves it with the text. */
const PAGE_MARKER = /<!-- p\. (\d+) -->/;
/** A line wholly in single-asterisk italics. */
const VERSE_LINE = /^\*[^*]+\*$/;

export function parseBook(text: string): Book {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.trim() === PREFACE_HEADING);
  if (start === -1) throw new Error(`book.md has no "${PREFACE_HEADING}"`);

  const preface = newEntry("LỜI NÓI ĐẦU", "preface");
  const parts: Phan[] = [];
  const entries = [preface];
  let current: Entry | undefined = preface;
  let page = 0;
  let hasText = false;
  const bodies = new Map<Entry, string[]>([[preface, []]]);

  const open = (entry: Entry | undefined) => {
    current = entry;
    hasText = false;
    if (!entry) return;
    entry.startPage = entry.endPage = page;
    bodies.set(entry, []);
  };

  for (const line of lines.slice(start + 1)) {
    const phan = line.match(PHAN_HEADING);
    if (phan) {
      parts.push({ title: phan[1].trim(), entries: [] });
      open(undefined);
      continue;
    }
    const heading = line.match(ENTRY_HEADING);
    const part = parts[parts.length - 1];
    if (heading && part) {
      // Phần A holds the Overview Articles; Phần B the Headword Entries.
      const entry = newEntry(
        heading[1].trim(),
        parts.length === 1 ? "overview-article" : "headword-entry"
      );
      part.entries.push(entry);
      entries.push(entry);
      open(entry);
      continue;
    }

    if (current) bodies.get(current)!.push(line);

    // Markers may sit on their own line or mid-line; text before a marker is
    // on the earlier page.
    const segments = line.split(PAGE_MARKER);
    segments.forEach((segment, i) => {
      if (i % 2 === 1) {
        page = Number(segment);
        return;
      }
      if (!current || segment.trim() === "") return;
      if (!hasText) current.startPage = page;
      current.endPage = page;
      hasText = true;
    });
  }

  for (const [entry, body] of Array.from(bodies)) {
    entry.markdown = displayMarkdown(body);
  }

  const seen = new Map<string, number>();
  for (const entry of entries) {
    const base = slugify(entry.title);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    entry.slug = count === 1 ? base : `${base}-${count}`;
  }

  return { preface, parts, entries };
}

/** Body lines → markdown with no page markers and tidy whitespace. */
function displayMarkdown(body: string[]): string {
  const lines = body.map((line) =>
    line
      .split(PAGE_MARKER)
      .filter((_, i) => i % 2 === 0)
      .join(" ")
      .replace(/[ \t]+/g, " ")
      .trim()
  );
  // A hard break (CommonMark's trailing backslash) between two verse lines.
  const withBreaks = lines.map((line, i) =>
    VERSE_LINE.test(line) && VERSE_LINE.test(lines[i + 1] ?? "")
      ? `${line}\\`
      : line
  );
  return withBreaks.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** "Làng tương Cự Đà" → "lang-tuong-cu-da". */
function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function newEntry(title: string, kind: EntryKind): Entry {
  return { slug: "", title, kind, startPage: 0, endPage: 0, markdown: "" };
}
