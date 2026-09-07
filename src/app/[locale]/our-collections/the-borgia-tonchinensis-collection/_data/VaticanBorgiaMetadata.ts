// src/app/[locale]/our-collections/the-borgia-tonchinensis-collection/_data/VaticanBorgiaMetadata.ts
//
// GENERATED FILE — do not edit by hand.
// Run: node scripts/collections/fetch-vatican-borgia.mjs
//
// Snapshot of the Biblioteca Apostolica Vaticana's "Borgia Tonchinensis" fond
// (Borg.tonch) as published by the Vatican Digital Library — Vietnamese Catholic
// manuscripts and early printed works of the 17th–19th centuries.
//
// The Vatican catalogues these as shelfmark-only records, so there are no
// titles, dates or descriptions to snapshot. DVN supplies those by hand in
// descriptions.ts; this file holds only what the
// Vatican itself publishes.
//
// Rights: images are copyright Biblioteca Apostolica Vaticana and are NOT
// mirrored — item pages load the Vatican's IIIF directly, and DVN presents
// them by permission of the Vatican Digital Library.
//
// Snapshot taken: 2026-08-26

export interface VaticanBorgiaRecord {
  /** Slugified shelfmark, e.g. "borg-tonch-1" — the id used in DVN URLs. */
  itemId: string;
  /** The Vatican's own shelfmark, e.g. "Borg.tonch.1". */
  shelfmark: string;
  /** Numeric part of the shelfmark, for ordering. */
  sequence: number;
  /** Manifest label; the Vatican repeats the shelfmark here. */
  label: string;
  /** ISO codes as catalogued — "und" (undetermined) throughout this fond. */
  languageCodes: string[];
  /** Number of IIIF canvases, i.e. digitised pages including covers. */
  pageCount: number;
  /** Opening leaf labels, e.g. "piatto.anteriore", "1r", "1v". */
  firstPageLabels: string[];
  /** The Vatican's own attribution string, shown in the credit. */
  attribution: string;
  manifestUrl: string;
  /** The Vatican's curated cover where they publish one, else the first canvas. */
  thumbnailUrl: string;
  thumbnailIsCuratedCover: boolean;
  firstCanvasThumbnailUrl: string;
  /** The catalogue record on DigiVatLib. */
  permalinkUrl: string;
  /** The Vatican's own page-turner, offered alongside DVN's viewer. */
  viewerUrl: string;
}

export const VATICAN_BORGIA_ITEMS: ReadonlyArray<VaticanBorgiaRecord> = [
  {
    "itemId": "borg-tonch-1",
    "shelfmark": "Borg.tonch.1",
    "sequence": 1,
    "label": "Borg.tonch.1",
    "languageCodes": [
      "und"
    ],
    "pageCount": 794,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "IIr",
      "IIv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.1/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.1/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.1/Borg.tonch.1_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.1",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.1"
  },
  {
    "itemId": "borg-tonch-2",
    "shelfmark": "Borg.tonch.2",
    "sequence": 2,
    "label": "Borg.tonch.2",
    "languageCodes": [
      "und"
    ],
    "pageCount": 750,
    "firstPageLabels": [
      "piatto.anteriore",
      "controguardia.anteriore",
      "Ir",
      "Iv",
      "IIr",
      "IIv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.2/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.2/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.2/Borg.tonch.2_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.2",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.2"
  },
  {
    "itemId": "borg-tonch-3",
    "shelfmark": "Borg.tonch.3",
    "sequence": 3,
    "label": "Borg.tonch.3",
    "languageCodes": [
      "und"
    ],
    "pageCount": 658,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "1.[02.fn.0000]",
      "2.[02.fn.0000]"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.3/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.3/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.3/Borg.tonch.3_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.3",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.3"
  },
  {
    "itemId": "borg-tonch-4",
    "shelfmark": "Borg.tonch.4",
    "sequence": 4,
    "label": "Borg.tonch.4",
    "languageCodes": [
      "und"
    ],
    "pageCount": 650,
    "firstPageLabels": [
      "piatto.anteriore",
      "controguardia.anteriore",
      "Ir",
      "Iv",
      "1.[02.fn.0000]",
      "2.[02.fn.0000]"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.4/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.4/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.4/Borg.tonch.4_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.4",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.4"
  },
  {
    "itemId": "borg-tonch-5",
    "shelfmark": "Borg.tonch.5",
    "sequence": 5,
    "label": "Borg.tonch.5",
    "languageCodes": [
      "und"
    ],
    "pageCount": 745,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "I",
      "1.[02.fn.0000]",
      "2.[02.fn.0000]",
      "3.[02.fn.0000]"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.5/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.5/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.5/Borg.tonch.5_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.5",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.5"
  },
  {
    "itemId": "borg-tonch-6",
    "shelfmark": "Borg.tonch.6",
    "sequence": 6,
    "label": "Borg.tonch.6",
    "languageCodes": [
      "und"
    ],
    "pageCount": 622,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "I",
      "1.[02.fn.0000]",
      "2.[02.fn.0000]",
      "3.[02.fn.0000]"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.6/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.6/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.6/Borg.tonch.6_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.6",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.6"
  },
  {
    "itemId": "borg-tonch-7",
    "shelfmark": "Borg.tonch.7",
    "sequence": 7,
    "label": "Borg.tonch.7",
    "languageCodes": [
      "und"
    ],
    "pageCount": 610,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "1.[02.fn.0000]",
      "2.[02.fn.0000]",
      "3.[02.fn.0000]",
      "4.[02.fn.0000]"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.7/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.7/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.7/Borg.tonch.7_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.7",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.7"
  },
  {
    "itemId": "borg-tonch-8",
    "shelfmark": "Borg.tonch.8",
    "sequence": 8,
    "label": "Borg.tonch.8",
    "languageCodes": [
      "und"
    ],
    "pageCount": 624,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "IIr",
      "IIv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.8/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.8/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.8/Borg.tonch.8_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.8",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.8"
  },
  {
    "itemId": "borg-tonch-9",
    "shelfmark": "Borg.tonch.9",
    "sequence": 9,
    "label": "Borg.tonch.9",
    "languageCodes": [
      "und"
    ],
    "pageCount": 447,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore.[02.hx.0000]",
      "risguardia.anteriore.[02.hx.a000]",
      "1.[02.fn.0000]",
      "2.[02.fn.0000]",
      "3.[02.fn.0000]"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.9/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.9/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.9/Borg.tonch.9_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.9",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.9"
  },
  {
    "itemId": "borg-tonch-10",
    "shelfmark": "Borg.tonch.10",
    "sequence": 10,
    "label": "Borg.tonch.10",
    "languageCodes": [
      "und"
    ],
    "pageCount": 384,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "I.[02.fn.0000]",
      "II.[02.fn.0000]",
      "III.[02.fn.0000]",
      "IV.[02.fn.0000]"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.10/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.10/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.10/Borg.tonch.10_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.10",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.10"
  },
  {
    "itemId": "borg-tonch-11",
    "shelfmark": "Borg.tonch.11",
    "sequence": 11,
    "label": "Borg.tonch.11",
    "languageCodes": [
      "und"
    ],
    "pageCount": 323,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "IIr",
      "IIv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.11/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.11/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.11/Borg.tonch.11_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.11",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.11"
  },
  {
    "itemId": "borg-tonch-12",
    "shelfmark": "Borg.tonch.12",
    "sequence": 12,
    "label": "Borg.tonch.12",
    "languageCodes": [
      "und"
    ],
    "pageCount": 346,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "I",
      "313",
      "314.[02.fs.0000]",
      "315.[02.fs.0000]"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.12/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.12/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.12/Borg.tonch.12_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.12",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.12"
  },
  {
    "itemId": "borg-tonch-13",
    "shelfmark": "Borg.tonch.13",
    "sequence": 13,
    "label": "Borg.tonch.13",
    "languageCodes": [
      "und"
    ],
    "pageCount": 672,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir.[02.hx.0000]",
      "Ir.[02.hx.a000]",
      "Ir.[02.hx.b000]",
      "Iv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.13/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.13/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.13/Borg.tonch.13_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.13",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.13"
  },
  {
    "itemId": "borg-tonch-14",
    "shelfmark": "Borg.tonch.14",
    "sequence": 14,
    "label": "Borg.tonch.14",
    "languageCodes": [
      "und"
    ],
    "pageCount": 615,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore.[02.hx.0000]",
      "risguardia.anteriore.[02.hx.a000]",
      "Ir",
      "Iv",
      "IIr"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.14/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.14/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.14/Borg.tonch.14_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.14",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.14"
  },
  {
    "itemId": "borg-tonch-15",
    "shelfmark": "Borg.tonch.15",
    "sequence": 15,
    "label": "Borg.tonch.15",
    "languageCodes": [
      "und"
    ],
    "pageCount": 566,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "IIr",
      "IIv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.15/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.15/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.15/Borg.tonch.15_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.15",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.15"
  },
  {
    "itemId": "borg-tonch-16",
    "shelfmark": "Borg.tonch.16",
    "sequence": 16,
    "label": "Borg.tonch.16",
    "languageCodes": [
      "und"
    ],
    "pageCount": 542,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "IIr",
      "IIv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.16/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.16/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.16/Borg.tonch.16_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.16",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.16"
  },
  {
    "itemId": "borg-tonch-17",
    "shelfmark": "Borg.tonch.17",
    "sequence": 17,
    "label": "Borg.tonch.17",
    "languageCodes": [
      "und"
    ],
    "pageCount": 314,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "1r",
      "1v",
      "2r",
      "2v"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.17/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.17/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.17/Borg.tonch.17_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.17",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.17"
  },
  {
    "itemId": "borg-tonch-18",
    "shelfmark": "Borg.tonch.18",
    "sequence": 18,
    "label": "Borg.tonch.18",
    "languageCodes": [
      "und"
    ],
    "pageCount": 574,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "1r",
      "1v",
      "2r",
      "2v"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.18/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.18/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.18/Borg.tonch.18_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.18",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.18"
  },
  {
    "itemId": "borg-tonch-19",
    "shelfmark": "Borg.tonch.19",
    "sequence": 19,
    "label": "Borg.tonch.19",
    "languageCodes": [
      "und"
    ],
    "pageCount": 178,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "IIr",
      "IIv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.19/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.19/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.19/Borg.tonch.19_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.19",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.19"
  },
  {
    "itemId": "borg-tonch-20",
    "shelfmark": "Borg.tonch.20",
    "sequence": 20,
    "label": "Borg.tonch.20",
    "languageCodes": [
      "und"
    ],
    "pageCount": 218,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "IIr",
      "IIv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.20/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.20/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.20/Borg.tonch.20_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.20",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.20"
  },
  {
    "itemId": "borg-tonch-21",
    "shelfmark": "Borg.tonch.21",
    "sequence": 21,
    "label": "Borg.tonch.21",
    "languageCodes": [
      "und"
    ],
    "pageCount": 514,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "IIr",
      "IIv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.21/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.21/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.21/Borg.tonch.21_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.21",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.21"
  },
  {
    "itemId": "borg-tonch-22",
    "shelfmark": "Borg.tonch.22",
    "sequence": 22,
    "label": "Borg.tonch.22",
    "languageCodes": [
      "und"
    ],
    "pageCount": 162,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "IIr",
      "IIv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.22/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.22/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.22/Borg.tonch.22_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.22",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.22"
  },
  {
    "itemId": "borg-tonch-23",
    "shelfmark": "Borg.tonch.23",
    "sequence": 23,
    "label": "Borg.tonch.23",
    "languageCodes": [
      "und"
    ],
    "pageCount": 618,
    "firstPageLabels": [
      "piatto.anteriore",
      "controguardia.anteriore",
      "1r",
      "1v",
      "2r",
      "2v"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.23/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.23/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.23/Borg.tonch.23_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.23",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.23"
  },
  {
    "itemId": "borg-tonch-24",
    "shelfmark": "Borg.tonch.24",
    "sequence": 24,
    "label": "Borg.tonch.24",
    "languageCodes": [
      "und"
    ],
    "pageCount": 688,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore.[02.hx.0000]",
      "risguardia.anteriore.[02.hx.a000]",
      "risguardia.anteriore.[02.hx.b000]",
      "I.[02.fn.0000]",
      "II.[02.fn.0000]"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.24/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.24/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.24/Borg.tonch.24_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.24",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.24"
  },
  {
    "itemId": "borg-tonch-25",
    "shelfmark": "Borg.tonch.25",
    "sequence": 25,
    "label": "Borg.tonch.25",
    "languageCodes": [
      "und"
    ],
    "pageCount": 1392,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "IIr",
      "IIv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.25/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.25/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.25/Borg.tonch.25_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.25",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.25"
  },
  {
    "itemId": "borg-tonch-26",
    "shelfmark": "Borg.tonch.26",
    "sequence": 26,
    "label": "Borg.tonch.26",
    "languageCodes": [
      "und"
    ],
    "pageCount": 650,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "IIr",
      "IIv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.26/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.26/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.26/Borg.tonch.26_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.26",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.26"
  },
  {
    "itemId": "borg-tonch-27",
    "shelfmark": "Borg.tonch.27",
    "sequence": 27,
    "label": "Borg.tonch.27",
    "languageCodes": [
      "und"
    ],
    "pageCount": 410,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "1.[02.fn.0000]",
      "2.[02.fn.0000]"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.27/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.27/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.27/Borg.tonch.27_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.27",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.27"
  },
  {
    "itemId": "borg-tonch-28",
    "shelfmark": "Borg.tonch.28",
    "sequence": 28,
    "label": "Borg.tonch.28",
    "languageCodes": [
      "und"
    ],
    "pageCount": 225,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "1r.[02.fn.0000]",
      "1v.[02.fn.0000]",
      "2r.[02.fn.0000]",
      "2v.[02.fn.0000]"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.28/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.28/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.28/Borg.tonch.28_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.28",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.28"
  },
  {
    "itemId": "borg-tonch-29",
    "shelfmark": "Borg.tonch.29",
    "sequence": 29,
    "label": "Borg.tonch.29",
    "languageCodes": [
      "und"
    ],
    "pageCount": 32,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "1r",
      "1v"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.29/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.29/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.29/Borg.tonch.29_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.29",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.29"
  },
  {
    "itemId": "borg-tonch-30",
    "shelfmark": "Borg.tonch.30",
    "sequence": 30,
    "label": "Borg.tonch.30",
    "languageCodes": [
      "und"
    ],
    "pageCount": 70,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "1r.[02.fn.0000]",
      "1v.[02.fn.0000]",
      "1",
      "2"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.30/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.30/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.30/Borg.tonch.30_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.30",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.30"
  },
  {
    "itemId": "borg-tonch-31",
    "shelfmark": "Borg.tonch.31",
    "sequence": 31,
    "label": "Borg.tonch.31",
    "languageCodes": [
      "und"
    ],
    "pageCount": 74,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "1r",
      "1v",
      "2r",
      "2v"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.31/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.31/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.31/Borg.tonch.31_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.31",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.31"
  },
  {
    "itemId": "borg-tonch-32",
    "shelfmark": "Borg.tonch.32",
    "sequence": 32,
    "label": "Borg.tonch.32",
    "languageCodes": [
      "und"
    ],
    "pageCount": 149,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "IIr",
      "IIv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.32/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.32/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.32/Borg.tonch.32_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.32",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.32"
  },
  {
    "itemId": "borg-tonch-33",
    "shelfmark": "Borg.tonch.33",
    "sequence": 33,
    "label": "Borg.tonch.33",
    "languageCodes": [
      "und"
    ],
    "pageCount": 98,
    "firstPageLabels": [
      "piatto.anteriore",
      "controguardia.anteriore",
      "Ir",
      "Iv",
      "1r",
      "1v"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.33/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.33/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.33/Borg.tonch.33_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.33",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.33"
  },
  {
    "itemId": "borg-tonch-34",
    "shelfmark": "Borg.tonch.34",
    "sequence": 34,
    "label": "Borg.tonch.34",
    "languageCodes": [
      "und"
    ],
    "pageCount": 133,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "IIr",
      "IIv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.34/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.34/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.34/Borg.tonch.34_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.34",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.34"
  },
  {
    "itemId": "borg-tonch-35",
    "shelfmark": "Borg.tonch.35",
    "sequence": 35,
    "label": "Borg.tonch.35",
    "languageCodes": [
      "und"
    ],
    "pageCount": 373,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "Ir",
      "Iv",
      "IIr",
      "IIv"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.35/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.35/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.35/Borg.tonch.35_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.35",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.35"
  },
  {
    "itemId": "borg-tonch-36",
    "shelfmark": "Borg.tonch.36",
    "sequence": 36,
    "label": "Borg.tonch.36",
    "languageCodes": [
      "und"
    ],
    "pageCount": 42,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "1r",
      "1v",
      "2r",
      "2v"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.36/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.36/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.36/Borg.tonch.36_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.36",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.36"
  },
  {
    "itemId": "borg-tonch-37",
    "shelfmark": "Borg.tonch.37",
    "sequence": 37,
    "label": "Borg.tonch.37",
    "languageCodes": [
      "und"
    ],
    "pageCount": 40,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "1r",
      "1v",
      "1r",
      "1v"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.37/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.37/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.37/Borg.tonch.37_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.37",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.37"
  },
  {
    "itemId": "borg-tonch-38",
    "shelfmark": "Borg.tonch.38",
    "sequence": 38,
    "label": "Borg.tonch.38",
    "languageCodes": [
      "und"
    ],
    "pageCount": 38,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "1r",
      "1v",
      "1r",
      "1v"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.38/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.38/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.38/Borg.tonch.38_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.38",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.38"
  },
  {
    "itemId": "borg-tonch-39",
    "shelfmark": "Borg.tonch.39",
    "sequence": 39,
    "label": "Borg.tonch.39",
    "languageCodes": [
      "und"
    ],
    "pageCount": 164,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "1r",
      "1v",
      "1r",
      "1v"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.39/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.39/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.39/Borg.tonch.39_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.39",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.39"
  },
  {
    "itemId": "borg-tonch-40",
    "shelfmark": "Borg.tonch.40",
    "sequence": 40,
    "label": "Borg.tonch.40",
    "languageCodes": [
      "und"
    ],
    "pageCount": 16,
    "firstPageLabels": [
      "piatto.anteriore",
      "risguardia.anteriore",
      "1r.[01.fx.0000]",
      "1v.[01.fx.0000]",
      "1r.[01.fx.0000]",
      "1v.[01.fx.0000]"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.40/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.40/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.40/Borg.tonch.40_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.40",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.40"
  },
  {
    "itemId": "borg-tonch-41",
    "shelfmark": "Borg.tonch.41",
    "sequence": 41,
    "label": "Borg.tonch.41",
    "languageCodes": [
      "und"
    ],
    "pageCount": 160,
    "firstPageLabels": [
      "piatto.anteriore",
      "controguardia.anteriore",
      "1.[02.fn.0000]",
      "2.[02.fn.0000]",
      "1",
      "2"
    ],
    "attribution": "Images Copyright Biblioteca Apostolica Vaticana",
    "manifestUrl": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.41/manifest.json",
    "thumbnailUrl": "https://digi.vatlib.it/pub/digit/MSS_Borg.tonch.41/cover/cover.jpg",
    "thumbnailIsCuratedCover": true,
    "firstCanvasThumbnailUrl": "https://digi.vatlib.it/iiifimage/MSS_Borg.tonch.41/Borg.tonch.41_0001_al_piatto.anteriore.jp2/full/!400,400/0/default.jpg",
    "permalinkUrl": "https://digi.vatlib.it/mss/detail/Borg.tonch.41",
    "viewerUrl": "https://digi.vatlib.it/view/MSS_Borg.tonch.41"
  }
];
