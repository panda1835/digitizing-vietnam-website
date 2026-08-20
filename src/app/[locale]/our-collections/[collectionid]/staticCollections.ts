// src/app/[locale]/our-collections/[collectionid]/staticCollections.ts
//
// Registry of collections whose ITEMS come from local data rather than Strapi.
//
// Most collections are entirely Strapi-driven. A few mirror an external
// repository, where the item records live in a committed snapshot and the scans
// are loaded from the holding institution's IIIF. `han-nom-collection` was the
// first; this registry exists so the second one doesn't turn the render branch
// into a ternary chain that grows with every collection.
//
// Note what stays in Strapi even for these: the page header, breadcrumb and
// featured articles. A static collection still wants a Strapi `collections`
// record so it appears on /our-collections and under a category tab — the index
// page builds its tabs purely from `collection_categories`, with no code path
// that injects a locally-defined collection.
//
// `fallbackHeader` covers the window before that record exists, and doubles as
// resilience if Strapi is ever unreachable.

import { EDICTS_COLLECTION_SLUG } from "@/lib/pennstate-edicts";

export interface StaticCollectionHeader {
  title: string;
  abstract: string;
}

export interface StaticCollectionConfig {
  slug: string;
  /** Used only when Strapi has no record for this slug. */
  fallbackHeader: Record<"en" | "vi", StaticCollectionHeader>;
}

export const STATIC_COLLECTIONS: Record<string, StaticCollectionConfig> = {
  "han-nom-collection": {
    slug: "han-nom-collection",
    fallbackHeader: {
      en: {
        title: "Hán-Nôm Collection",
        abstract:
          "The world's first digital library dedicated to Hán-Nôm studies.",
      },
      vi: {
        title: "Bộ sưu tập Hán-Nôm",
        abstract:
          "Thư viện số đầu tiên trên thế giới dành riêng cho nghiên cứu Hán-Nôm.",
      },
    },
  },
  [EDICTS_COLLECTION_SLUG]: {
    slug: EDICTS_COLLECTION_SLUG,
    fallbackHeader: {
      en: {
        title: "Vietnamese Edicts and Official Documents",
        abstract:
          "Thirty-two imperial edicts and official documents of the Lê and Nguyễn dynasties, dating from 1638 to 1944 and handwritten in chữ Nho. Held by the Eberly Family Special Collections Library at Penn State University Libraries, and presented here with their full Hán transcripts, which are searchable.",
      },
      vi: {
        title: "Sắc phong và Văn bản Hành chính Việt Nam",
        abstract:
          "Ba mươi hai sắc phong và văn bản hành chính thời Lê và Nguyễn, niên đại từ 1638 đến 1944, viết tay bằng chữ Nho. Hiện lưu giữ tại Eberly Family Special Collections Library, Đại học Penn State, và được giới thiệu tại đây kèm toàn văn phiên bản chữ Hán có thể tìm kiếm.",
      },
    },
  },
};

export const isStaticCollection = (slug: string) => slug in STATIC_COLLECTIONS;

export const getStaticCollection = (slug: string): StaticCollectionConfig | undefined =>
  STATIC_COLLECTIONS[slug];

/**
 * Header for a static collection: Strapi's values win when present, so editors
 * keep control of the copy, and the local text fills any gap.
 */
export const resolveStaticHeader = (
  slug: string,
  locale: string,
  fromStrapi: { title?: string; abstract?: string }
): StaticCollectionHeader | null => {
  const config = getStaticCollection(slug);
  if (!config) return null;

  const fallback =
    config.fallbackHeader[locale === "vi" ? "vi" : "en"] ?? config.fallbackHeader.en;

  return {
    title: fromStrapi.title?.trim() || fallback.title,
    abstract: fromStrapi.abstract?.trim() || fallback.abstract,
  };
};
