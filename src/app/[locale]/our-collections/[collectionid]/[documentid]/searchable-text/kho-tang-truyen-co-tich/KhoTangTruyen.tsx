// Item Viewer for the "Kho tàng Truyện cổ tích Việt Nam" Collection Item:
// resolves ?muc= to an Entry (a missing or unknown slug opens the first Entry
// of the Book, with no redirect) and hands it to the client reader.
//
// An Index Name search result adds ?ten= (the name to highlight, in the Story
// text's spelling) and, for a Chú thích target, ?chu-thich= (the 1-based
// ordinal of the Footnote to open). Both are ignored for an unknown slug.

import {
  BIBLIOGRAPHY_DIVISION_ID,
  getDefaultEntry,
  getDivisions,
  getIndexNameRows,
  lookupEntry,
} from "./data";
import KhoTangTruyenReader from "./KhoTangTruyenReader";

export default function KhoTangTruyen({
  muc,
  highlightName,
  targetFootnote,
}: {
  muc?: string;
  highlightName?: string;
  targetFootnote?: string;
}) {
  const found = muc ? lookupEntry(muc) : undefined;
  const { entry, previous, next, body } =
    found || lookupEntry(getDefaultEntry().muc)!;
  const footnoteOrdinal = Number(targetFootnote);
  const footnoteIndex =
    found && Number.isInteger(footnoteOrdinal) && footnoteOrdinal >= 1
      ? footnoteOrdinal - 1
      : undefined;

  return (
    <KhoTangTruyenReader
      divisions={getDivisions()}
      indexNames={getIndexNameRows()}
      entry={entry}
      previous={previous}
      next={next}
      body={body}
      bulletLists={entry.divisionId === BIBLIOGRAPHY_DIVISION_ID}
      highlightName={(found && highlightName?.trim()) || undefined}
      targetFootnoteIndex={footnoteIndex}
    />
  );
}
