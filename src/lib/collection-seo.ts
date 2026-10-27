import { cache } from "react";
import { getCollectionLanguages } from "@/utils/seo";

export interface LocalizedCollectionRecord {
  documentId?: string;
  slug: string;
  locale: string;
  collections?: LocalizedCollectionRecord[];
  localizations?: LocalizedCollectionRecord[];
}

/** Strapi's public API returns published localizations by default. */
export const getLocalizedCollection = cache(
  async (
    slug: string,
    locale: string
  ): Promise<LocalizedCollectionRecord | null> => {
    const query = new URLSearchParams({
      "filters[slug][$eq]": slug,
      locale,
      "fields[0]": "slug",
      "fields[1]": "locale",
      "populate[localizations][fields][0]": "slug",
      "populate[localizations][fields][1]": "locale",
    });
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/collections?${query}`,
        { next: { revalidate: 3600 } }
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data.data?.[0] ?? null;
    } catch {
      // An unavailable CMS must not manufacture alternate language URLs.
      return null;
    }
  }
);

export function getLocalizedCollectionLanguages(
  collection: LocalizedCollectionRecord,
  page?: string
) {
  return getCollectionLanguages(
    [collection, ...(collection.localizations ?? [])].map((record) => ({
      locale: record.locale,
      collectionSlug: record.slug,
    })),
    page
  );
}

export function getLocalizedItemLanguages(
  item: LocalizedCollectionRecord,
  collection: LocalizedCollectionRecord
) {
  const collectionVersions = [collection, ...(collection.localizations ?? [])];
  const routes = [item, ...(item.localizations ?? [])].flatMap((record) => {
    const parent = collectionVersions.find(
      (version) => version.locale === record.locale
    );
    // Both the translated item and its translated parent must be published,
    // and the item must belong to that parent in the target language.
    if (
      !parent ||
      !record.collections?.some(
        (relation) =>
          relation.locale === parent.locale && relation.slug === parent.slug
      )
    ) {
      return [];
    }
    return [
      {
        locale: record.locale,
        collectionSlug: parent.slug,
        itemSlug: record.slug,
      },
    ];
  });
  return getCollectionLanguages(routes);
}
