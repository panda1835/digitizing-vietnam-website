// Item Viewer for the "Kho tàng Truyện cổ tích Việt Nam" Collection Item:
// resolves ?muc= to an Entry (a missing or unknown slug opens the first Entry
// of the Book, with no redirect) and hands it to the client reader.

import {
  BIBLIOGRAPHY_DIVISION_ID,
  getDefaultEntry,
  getDivisions,
  lookupEntry,
} from "./data";
import KhoTangTruyenReader from "./KhoTangTruyenReader";

export default function KhoTangTruyen({ muc }: { muc?: string }) {
  const { entry, previous, next, body } =
    (muc && lookupEntry(muc)) || lookupEntry(getDefaultEntry().muc)!;

  return (
    <KhoTangTruyenReader
      divisions={getDivisions()}
      entry={entry}
      previous={previous}
      next={next}
      body={body}
      bulletLists={entry.divisionId === BIBLIOGRAPHY_DIVISION_ID}
    />
  );
}
