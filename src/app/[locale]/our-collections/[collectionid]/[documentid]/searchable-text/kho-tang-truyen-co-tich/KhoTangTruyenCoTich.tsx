// Book Reader: the Item Viewer for a digitized Book (see books.ts). Resolves
// ?muc= to an Entry (a missing or unknown slug opens the first Entry of the
// Book, with no redirect) and hands it to the client reader.
//
// For a Book searched by its Story Name Index, an Index Name search result
// adds ?ten= (the name to highlight, in the Story text's spelling) and, for a
// Chú thích target, ?chu-thich= (the 1-based ordinal of the Footnote to open).
// Both are ignored for an unknown slug, and for a Book searched by titles.

import type { BookConfig } from "./books";
import {
  BIBLIOGRAPHY_DIVISION_ID,
  getDefaultEntry,
  getDivisions,
  getIndexNameRows,
  lookupEntry,
} from "./data";
import KhoTangTruyenCoTichReader, {
  type BookSearch,
} from "./KhoTangTruyenCoTichReader";

export default function KhoTangTruyenCoTich({
  book,
  muc,
  highlightName,
  targetFootnote,
}: {
  book: BookConfig;
  muc?: string;
  highlightName?: string;
  targetFootnote?: string;
}) {
  const found = muc ? lookupEntry(book, muc) : undefined;
  const { entry, previous, next, body } =
    found || lookupEntry(book, getDefaultEntry(book).muc)!;
  const byIndexNames = book.search === "story-name-index";
  const highlighting = !!found && byIndexNames;
  const footnoteOrdinal = Number(targetFootnote);
  const footnoteIndex =
    highlighting && Number.isInteger(footnoteOrdinal) && footnoteOrdinal >= 1
      ? footnoteOrdinal - 1
      : undefined;
  const search: BookSearch = byIndexNames
    ? { source: "story-name-index", indexNames: getIndexNameRows(book) }
    : { source: "story-titles" };

  return (
    <KhoTangTruyenCoTichReader
      messagesKey={book.messagesKey}
      divisions={getDivisions(book)}
      search={search}
      entry={entry}
      previous={previous}
      next={next}
      body={body}
      bulletLists={entry.divisionId === BIBLIOGRAPHY_DIVISION_ID}
      highlightName={(highlighting && highlightName?.trim()) || undefined}
      targetFootnoteIndex={footnoteIndex}
    />
  );
}
