// src/lib/pennstate-edicts.ts
//
// Accessors for the Penn State Vietnamese edicts collection, mirroring
// src/lib/han-nom-collection.ts.
//
// The snapshot in PennStateEdictsMetadata.ts is already normalized by the fetch
// script — dynasty, era and document type are derived at snapshot time so the
// browse facets filter on real fields rather than re-parsing titles on every
// render. This module therefore adds only lookup, search-text preparation and
// the collection-level constants.

import {
  PENN_STATE_EDICTS,
  type PennStateEdictRecord,
} from "@/app/[locale]/our-collections/PennStateEdictsMetadata";
import {
  EDICT_VI_LABELS,
  EDICT_VI_TEXT,
  type EdictLabelKind,
} from "@/lib/pennstate-edicts-vi";

/** Slug this collection lives at, and the slug its Strapi record must use. */
export const EDICTS_COLLECTION_SLUG = "vietnamese-edicts";

/**
 * Provenance for the collection. Values follow Penn State's own finding aid so
 * the credit on DVN matches how the holding institution describes itself.
 */
export const EDICTS_REPOSITORY = {
  label: "Penn State University Libraries",
  library: "Eberly Family Special Collections Library",
  institution: "The Pennsylvania State University",
  address: "104 Paterno Library, University Park, PA 16802",
  email: "spcollections@psu.edu",
  url: "https://libraries.psu.edu/about/collections/collection-vietnamese-edicts-and-official-documents",
  collectionUrl: "https://digital.libraries.psu.edu/digital/collection/vietscrolls",
  findingAidUrl: "https://archives.libraries.psu.edu/repositories/3/resources/11298",
  findingAidTitle:
    "Guide to the Collection of Vietnamese edicts and official documents",
  findingAidAuthor: "Mae Casey",
  findingAidYear: "2025",
  /** Extent and dates as stated in the finding aid. */
  extent: "32 items",
  dateRange: "1638–1944",
  /** How the collection came to Penn State. */
  acquisition:
    "Jointly purchased in September 2025 by Penn State's Special Collections Library, Asian Studies Department, and History Department.",
  rightsUrl: "http://rightsstatements.org/vocab/NoC-US/1.0/",
  rightsLabel: "No Copyright – United States",
} as const;

export type EdictEntry = PennStateEdictRecord;

export const getEdictEntries = (): EdictEntry[] => [...PENN_STATE_EDICTS];

/**
 * Title and description in the reader's language.
 *
 * Penn State catalogues the collection in English only, so DVN carries its own
 * Vietnamese translations in pennstate-edicts-vi.ts. Anything not translated
 * yet — and every locale other than Vietnamese — falls back to PSU's text.
 */
export const getEdictText = (entry: EdictEntry, locale: string) => {
  const translated = locale === "vi" ? EDICT_VI_TEXT[entry.dmrecord] : undefined;
  return {
    title: translated?.title || entry.title,
    description: translated?.description || entry.description,
    /** True when the reader is seeing DVN's translation rather than PSU's text. */
    isTranslated: Boolean(translated),
  };
};

/**
 * A catalogue value in the reader's language — document type, language, place
 * or container.
 *
 * Translation is display-only: pass the English value straight through as the
 * filter value and hand the result of this to the label, so filtered URLs stay
 * identical across locales.
 */
export const localizeEdictValue = (
  kind: EdictLabelKind,
  value: string,
  locale: string
) => {
  if (locale !== "vi") return value;
  const labels: Record<string, string> = EDICT_VI_LABELS[kind];
  return labels[value] ?? value;
};

/** "Triều Nguyễn" / "Nguyễn dynasty" — the dynasty names need no translation. */
export const formatEdictDynasty = (dynasty: string, locale: string) =>
  dynasty ? (locale === "vi" ? `Triều ${dynasty}` : `${dynasty} dynasty`) : "";

/**
 * The short heading a card carries in the browse grid: document type and era,
 * e.g. "Sắc phong, Cảnh Hưng" or "Edict, Cảnh Hưng".
 */
export const getEdictCardTitle = (entry: EdictEntry, locale: string) => {
  const type = localizeEdictValue("documentType", entry.documentType, locale);
  return entry.era ? `${type}, ${entry.era}` : type;
};

export const getEdictByRecord = (dmrecord: string | number): EdictEntry | undefined => {
  const id = Number(dmrecord);
  if (!Number.isFinite(id)) return undefined;
  return PENN_STATE_EDICTS.find((entry) => entry.dmrecord === id);
};

/**
 * Folds Latin text for accent-insensitive matching, so "Tu Duc" finds "Tự Đức".
 * Matches the approach used by HanNomCollectionItemView's normalizeSearchText.
 * Hán characters pass through untouched and are matched as plain substrings —
 * they need no folding.
 */
export const normalizeSearchText = (value: string) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

/**
 * The haystack a free-text query is matched against.
 *
 * Includes the transcript, which is the point of hosting this collection on
 * DVN: PSU's own interface cannot find an edict by the Hán text written on it.
 */
export const getSearchHaystack = (entry: EdictEntry) => ({
  latin: normalizeSearchText(
    [
      entry.title,
      entry.documentType,
      entry.era,
      entry.dynasty,
      entry.creator,
      entry.description,
      entry.subjects.join(" "),
      entry.identifier,
      // DVN's Vietnamese wording is indexed in both locales, so "sắc phong"
      // finds an edict even though PSU's own record says only "Edict".
      EDICT_VI_TEXT[entry.dmrecord]?.title ?? "",
      EDICT_VI_TEXT[entry.dmrecord]?.description ?? "",
    ]
      .filter(Boolean)
      .join(" ")
  ),
  /** Kept unfolded — folding would destroy Hán characters' identity. */
  han: `${entry.transcript} ${entry.title}`,
});

export const edictMatchesQuery = (entry: EdictEntry, query: string) => {
  const trimmed = (query ?? "").trim();
  if (!trimmed) return true;

  const { latin, han } = getSearchHaystack(entry);
  return latin.includes(normalizeSearchText(trimmed)) || han.includes(trimmed);
};

/** Distinct values for a facet, with counts, ordered by frequency then name. */
export const getFacetValues = (
  entries: EdictEntry[],
  key: "dynasty" | "era" | "documentType" | "language"
) => {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const value = (entry[key] ?? "").toString().trim();
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
};

export const getEdictYearRange = () => {
  const years = PENN_STATE_EDICTS.map((entry) => entry.year).filter(
    (year): year is number => typeof year === "number"
  );
  return years.length
    ? { min: Math.min(...years), max: Math.max(...years) }
    : { min: null, max: null };
};
