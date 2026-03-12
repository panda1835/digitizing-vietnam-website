import { hanNomColumbiaDlcMetadata } from "@/app/[locale]/our-collections/HanNomColumbiaDLCMetadata";

const IIIF_MANIFEST_BASE =
  "https://dlc.library.columbia.edu/iiif/3/presentation";

export interface HanNomManifestEntry {
  itemId: string;
  pid: string;
  doi: string;
  title: string;
  otherTitles: string[];
  thumbnailUrl: string;
  manifestUrl: string;
  names: string[];
  formats: string[];
  languages: string[];
  yearStart: number | null;
  yearEnd: number | null;
}

const normalizeDoi = (doi: string) => doi.replace(/^doi:/i, "").trim();

export const getItemIdFromDoi = (doi: string) => {
  const normalizedDoi = normalizeDoi(doi);
  return normalizedDoi.split("/").pop() || normalizedDoi;
};

export const getManifestUrlFromDoi = (doi: string) => {
  const normalizedDoi = normalizeDoi(doi);
  return `${IIIF_MANIFEST_BASE}/${normalizedDoi}/manifest`;
};

const getTitleFromMetadata = (item: Record<string, string>) =>
  item["title-1:title_sort_portion"] ||
  item["alternative_title-1:alternative_title_value"] ||
  item._doi ||
  "Untitled";

const getValuesByPattern = (item: Record<string, string>, pattern: RegExp) =>
  Object.entries(item)
    .filter(([key, value]) => pattern.test(key) && Boolean(value?.trim()))
    .map(([, value]) => value.trim());

const parseYear = (value: string | undefined): number | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Treat wildcard years (e.g. 16XX, 19XX) as unknown.
  if (/[xX]/.test(trimmed)) return null;

  const match = trimmed.match(/\d{4}/);
  if (!match) return null;
  return Number.parseInt(match[0], 10);
};

const HAN_NOM_MANIFEST_ENTRIES: HanNomManifestEntry[] =
  hanNomColumbiaDlcMetadata
    .filter((item) => Boolean(item._doi))
    .map((item) => {
      const title = getTitleFromMetadata(item);
      const otherTitles = getValuesByPattern(
        item,
        /^alternative_title-\d+:alternative_title_value$/,
      ).filter((alternativeTitle) => alternativeTitle !== title);

      return {
        itemId: getItemIdFromDoi(item._doi),
        pid: item._pid,
        doi: normalizeDoi(item._doi),
        title,
        otherTitles,
        thumbnailUrl: item._thumbnail_url,
        manifestUrl: getManifestUrlFromDoi(item._doi),
        names: getValuesByPattern(item, /^name-\d+:name_term\.value$/),
        formats: getValuesByPattern(item, /^form-\d+:form_term\.value$/),
        languages: getValuesByPattern(item, /^language-\d+:language_term\.value$/),
        yearStart: parseYear(item["date_issued-1:date_issued_start_value"]),
        yearEnd: parseYear(item["date_issued-1:date_issued_end_value"]),
      };
    });

export const getHanNomManifestEntries = (): HanNomManifestEntry[] =>
  HAN_NOM_MANIFEST_ENTRIES;

export const getHanNomManifestEntryByItemId = (itemId: string) =>
  getHanNomManifestEntries().find((entry) => entry.itemId === itemId);
