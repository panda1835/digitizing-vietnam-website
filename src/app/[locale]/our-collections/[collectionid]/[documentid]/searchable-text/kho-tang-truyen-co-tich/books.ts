// The Books the Book Reader shows, one config each. A Book's content is
// published in public/data/<dataFolder>/ with a root table_of_contents.json;
// everything else about the Book comes from there.

export interface BookConfig {
  /** Prefix for the loader's console messages. */
  id: string;
  /** The Collection Item this reader replaces Mirador on. */
  collectionId: string;
  documentId: string;
  /** Folder under public/data/. */
  dataFolder: string;
  /**
   * "parts": Kho Tàng's Preface, Parts → Sections → Stories/Essays and the
   * Bibliography, one contents tab each. "flat": a Preface then numbered
   * Stories, one division and no tab bar.
   */
  tocShape: "parts" | "flat";
  /** The Preface's `?muc=` slug. */
  prefaceMuc: string;
  /**
   * "story-name-index": the Book's story_name_index.json, with name
   * highlighting and Footnote targeting (?ten=, ?chu-thich=). "story-titles":
   * Entry titles only; ?ten= and ?chu-thich= are ignored.
   */
  search: "story-name-index" | "story-titles";
  /** The Book's own labels: KhoTangTruyenCoTich.<messagesKey> in messages/*.json. */
  messagesKey: string;
}

export const KHO_TANG: BookConfig = {
  id: "kho-tang-truyen",
  collectionId: "vietnamese-folk-literature",
  documentId: "truyen-co-tich-viet-nam",
  dataFolder: "kho-tang-truyen-co-tich-viet-nam",
  tocShape: "parts",
  prefaceMuc: "loi-noi-dau",
  search: "story-name-index",
  messagesKey: "khoTang",
};

export const TRUYEN_CO_DAN_GIAN_CHAM: BookConfig = {
  id: "truyen-co-dan-gian-cham",
  collectionId: "vietnamese-folk-literature",
  documentId: "truyen-co-dan-gian-cham",
  dataFolder: "truyen-co-dan-gian-cham",
  tocShape: "flat",
  prefaceMuc: "loi-gioi-thieu",
  search: "story-titles",
  messagesKey: "cham",
};

const BOOKS = [KHO_TANG, TRUYEN_CO_DAN_GIAN_CHAM];

/** The Book shown on this Collection Item, if any. */
export const findBook = (
  collectionId: string,
  documentId: string
): BookConfig | undefined =>
  BOOKS.find(
    (book) =>
      book.collectionId === collectionId && book.documentId === documentId
  );
