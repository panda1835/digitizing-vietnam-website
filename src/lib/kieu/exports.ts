import { z } from "zod";
import { exportSchema } from "./schemas";
import { getCorpus } from "./corpus";
import {
  compare,
  concordance,
  frequencies,
  getVerses,
  ResearchError,
} from "./research";

function csvCell(value: unknown) {
  let text =
    value == null
      ? ""
      : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
  // Spreadsheet clients otherwise execute source text beginning with a formula marker.
  if (/^[\s\uFEFF]*[=+@-]/.test(text)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
}
function csv(
  rows: Record<string, unknown>[],
  meta: Record<string, unknown>,
  columns: string[]
) {
  const keys = [...Object.keys(meta), ...columns];
  return (
    "\uFEFF" +
    [
      keys.map(csvCell).join(","),
      ...(rows.length ? rows : [{}]).map((row) =>
        keys.map((key) => csvCell(key in meta ? meta[key] : row[key])).join(",")
      ),
    ].join("\r\n")
  );
}
const verseColumns = [
  "id",
  "edition",
  "number",
  "page",
  "pageLabel",
  "nom",
  "quocNgu",
  "sourceUrl",
  "scanUrl",
  "notes",
  "annotations",
];
export async function exportResearch(input: z.infer<typeof exportSchema>) {
  let content: string, mime: string, extension: string;
  if (input.kind === "edition" && input.format === "tei") {
    content = (await getCorpus(input.edition)).xml;
    mime = "application/tei+xml; charset=utf-8";
    extension = "xml";
  } else {
    // Exports always contain the complete result, independently of UI pagination.
    if (
      "input" in input &&
      "cursor" in input.input &&
      input.input.cursor !== null
    )
      throw new ResearchError("export-cursor-not-supported");
    const data =
      input.kind === "edition"
        ? await getVerses(input.edition, { from: 1, to: 10000 })
        : input.kind === "verses"
        ? await getVerses(input.edition, input.input)
        : input.kind === "concordance"
        ? await concordance(input.input, true)
        : input.kind === "frequencies"
        ? await frequencies(input.edition, input.input, true)
        : await compare(input.input);
    if (input.format === "json") {
      content = JSON.stringify(data, null, 2);
      mime = "application/json; charset=utf-8";
      extension = "json";
    } else {
      let rows: Record<string, unknown>[], columns: string[];
      if ("verses" in data) {
        rows = data.verses.map((verse) => ({
          ...verse,
          pageNotes:
            data.pageNotes.find((page) => page.page === verse.page)?.notes ??
            [],
        }));
        columns = [...verseColumns, "pageNotes"];
      } else if ("totalOccurrences" in data) {
        rows = data.results;
        columns = [...verseColumns, "match", "kwic", "context"];
      } else if ("totalUnits" in data) {
        rows = data.results;
        columns = ["form", "count", "matchingVerses", "originals"];
      } else {
        rows = data.rows.flatMap((row) =>
          row.readings.map((r) => ({
            number: row.number,
            edition: r.edition,
            status: r.status,
            verse: r.verse,
            diff: r.diff,
          }))
        );
        columns = ["number", "edition", "status", "verse", "diff"];
      }
      const metadata = Object.fromEntries(
        Object.entries(data).filter(
          ([key]) =>
            !["verses", "results", "rows", "nextCursor", "pageNotes"].includes(
              key
            )
        )
      );
      content = csv(
        rows,
        {
          ...metadata,
          csvPolicy:
            "Formula-leading cells are prefixed with an apostrophe; JSON/TEI retain original text.",
        },
        columns
      );
      mime = "text/csv; charset=utf-8";
      extension = "csv";
    }
  }
  if (Buffer.byteLength(content) > 20 * 1024 * 1024)
    throw new ResearchError("export-too-large-narrow-query", 413);
  return new Response(content, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="truyen-kieu-${input.kind}${
        "edition" in input ? "-" + input.edition : ""
      }.${extension}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
