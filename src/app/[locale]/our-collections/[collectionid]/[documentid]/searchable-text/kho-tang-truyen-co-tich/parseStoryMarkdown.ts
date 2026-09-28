// Splits one Entry's markdown (Story, Essay or Part Introduction) into its
// readable body and its footnote list.
//
// The source numbers footnotes per printed page, so a label like [^1] recurs
// many times within one story. Matching is therefore by position, never by
// label: the k-th marker in reading order (main narrative, then the KHẢO DỊ
// section, which precedes the definitions) pairs with the k-th definition
// under "### Chú thích".

export interface ParsedStory {
  /**
   * The story's markdown up to the footnote section, with every [^N] marker
   * rewritten to `[k](#fn-i)` — k is the 1-based display number, i the 0-based
   * index into `footnotes`. `i` can exceed the last definition when the source
   * has more markers than definitions; renderers show those as plain text.
   */
  bodyMarkdown: string;
  /** Footnote definitions in source order, each as its own markdown. */
  footnotes: string[];
  /** Number of footnote markers found in the body. */
  markerCount: number;
}

/** "---" rule followed by the "Chú thích" heading, tolerant of blank lines. */
const FOOTNOTE_SECTION_DELIMITER = /\n-{3,}[ \t]*\n\s*#{2,3}[ \t]*Chú thích[ \t]*\n/;
const FOOTNOTE_DEFINITION = /^\[\^\d+\]:[ \t]?(.*)$/;
const FOOTNOTE_MARKER = /\[\^\d+\]/g;
/** Definition continuation lines (verse) are indented four spaces. */
const CONTINUATION_INDENT = /^ {4}/;

const parseFootnoteSection = (section: string): string[] => {
  const entries: string[][] = [];
  for (const line of section.split("\n")) {
    const definition = line.match(FOOTNOTE_DEFINITION);
    if (definition) {
      entries.push([definition[1]]);
    } else if (entries.length > 0) {
      entries[entries.length - 1].push(line.replace(CONTINUATION_INDENT, ""));
    }
  }
  return entries.map((lines) => lines.join("\n").trim());
};

export const parseStoryMarkdown = (raw: string): ParsedStory => {
  const text = raw.replace(/\r\n/g, "\n");
  const delimiter = text.match(FOOTNOTE_SECTION_DELIMITER);
  const body = delimiter ? text.slice(0, delimiter.index) : text;
  const footnotes = delimiter
    ? parseFootnoteSection(text.slice(delimiter.index! + delimiter[0].length))
    : [];

  let markerCount = 0;
  const bodyMarkdown = body
    .replace(FOOTNOTE_MARKER, () => {
      const index = markerCount++;
      return `[${index + 1}](#fn-${index})`;
    })
    .trim();

  return { bodyMarkdown, footnotes, markerCount };
};
