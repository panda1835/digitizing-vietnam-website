import type { MetadataRoute } from "next";
import {
  getLocalizedCollectionLanguages,
  getLocalizedItemLanguages,
  type LocalizedCollectionRecord,
} from "@/lib/collection-seo";

import { SITE_URL as BASE_URL } from "@/utils/seo";

// Static pages that exist for all locales
const staticPages = [
  "",
  "/about-us",
  "/our-collections",
  "/pedagogy",
  "/outreach",
  "/highlights",
  "/online-resources",
  "/tools",
  "/tools/han-nom-dictionaries",
  "/tools/kieu-tools",
  "/tools/han-nom-tools",
  "/tools/digital-humanities-tools",
];

type SitemapCollectionRecord = LocalizedCollectionRecord & {
  updatedAt: string;
};

async function getCollections(): Promise<SitemapCollectionRecord[]> {
  try {
    const queryParams = new URLSearchParams({
      "fields[0]": "slug",
      "fields[1]": "updatedAt",
      "fields[2]": "locale",
      "populate[localizations][fields][0]": "slug",
      "populate[localizations][fields][1]": "locale",
      "pagination[pageSize]": "1000",
    });
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/collections?${queryParams}`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) return [];
    return (await response.json()).data ?? [];
  } catch (error) {
    console.error("Error fetching collections for sitemap:", error);
    return [];
  }
}

async function getCollectionItems(): Promise<SitemapCollectionRecord[]> {
  try {
    const queryParams = new URLSearchParams({
      "fields[0]": "slug",
      "fields[1]": "updatedAt",
      "fields[2]": "locale",
      "populate[collections][fields][0]": "slug",
      "populate[collections][fields][1]": "locale",
      "populate[collections][populate][localizations][fields][0]": "slug",
      "populate[collections][populate][localizations][fields][1]": "locale",
      "populate[localizations][fields][0]": "slug",
      "populate[localizations][fields][1]": "locale",
      "populate[localizations][populate][collections][fields][0]": "slug",
      "populate[localizations][populate][collections][fields][1]": "locale",
      "pagination[pageSize]": "1000",
    });
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/collection-items?${queryParams}`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) return [];
    return (await response.json()).data ?? [];
  } catch (error) {
    console.error("Error fetching collection items for sitemap:", error);
    return [];
  }
}

async function getPedagogyCollections(): Promise<
  { slug: string; updatedAt: string }[]
> {
  try {
    const queryParams = new URLSearchParams({
      fields: "slug,updatedAt",
      "pagination[pageSize]": "1000",
    });

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/pedagogy-collections?${queryParams}`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    const data = await response.json();

    return (
      data.data?.map((item: any) => ({
        slug: item.slug,
        updatedAt: item.updatedAt,
      })) || []
    );
  } catch (error) {
    console.error("Error fetching pedagogy collections for sitemap:", error);
    return [];
  }
}

async function getPedagogyItems(): Promise<
  { slug: string; collectionSlug: string; updatedAt: string }[]
> {
  try {
    const queryParams = new URLSearchParams({
      fields: "slug,updatedAt",
      "populate[0]": "pedagogy_collection",
      "pagination[pageSize]": "1000",
    });

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/pedagogy-items?${queryParams}`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    const data = await response.json();

    return (
      data.data?.map((item: any) => ({
        slug: item.slug,
        collectionSlug: item.pedagogy_collection?.slug || "",
        updatedAt: item.updatedAt,
      })) || []
    );
  } catch (error) {
    console.error("Error fetching pedagogy items for sitemap:", error);
    return [];
  }
}

async function getBlogs(): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    const queryParams = new URLSearchParams({
      fields: "slug,updatedAt",
      "pagination[pageSize]": "1000",
    });

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/blogs?${queryParams}`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    const data = await response.json();

    return (
      data.data?.map((item: any) => ({
        slug: item.slug,
        updatedAt: item.updatedAt,
      })) || []
    );
  } catch (error) {
    console.error("Error fetching blogs for sitemap:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ["en", "vi"];

  // Fetch all dynamic content
  const [
    collections,
    collectionItems,
    pedagogyCollections,
    pedagogyItems,
    blogs,
  ] = await Promise.all([
    getCollections(),
    getCollectionItems(),
    getPedagogyCollections(),
    getPedagogyItems(),
    getBlogs(),
  ]);

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add static pages for each locale
  for (const locale of locales) {
    for (const page of staticPages) {
      sitemapEntries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "daily" : "weekly",
        priority: page === "" ? 1.0 : 0.8,
        alternates: {
          languages: {
            en: `${BASE_URL}/en${page}`,
            vi: `${BASE_URL}/vi${page}`,
          },
        },
      });
    }
  }

  // Use the same published localization relationships as the page metadata.
  // Do not manufacture same-slug translations for CMS records.
  for (const collection of collections) {
    const languages = getLocalizedCollectionLanguages(collection);
    for (const url of Object.values(languages)) {
      sitemapEntries.push({
        url,
        lastModified: new Date(collection.updatedAt),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }

  for (const item of collectionItems) {
    const collection = item.collections?.[0];
    if (!collection) continue;
    const languages = getLocalizedItemLanguages(item, collection);
    for (const url of Object.values(languages)) {
      sitemapEntries.push({
        url,
        lastModified: new Date(item.updatedAt),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages },
      });
    }
  }

  // Add pedagogy collection pages
  for (const locale of locales) {
    for (const collection of pedagogyCollections) {
      sitemapEntries.push({
        url: `${BASE_URL}/${locale}/pedagogy/${collection.slug}`,
        lastModified: new Date(collection.updatedAt),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: {
          languages: {
            en: `${BASE_URL}/en/pedagogy/${collection.slug}`,
            vi: `${BASE_URL}/vi/pedagogy/${collection.slug}`,
          },
        },
      });
    }
  }

  // Add pedagogy item pages
  for (const locale of locales) {
    for (const item of pedagogyItems) {
      if (item.collectionSlug) {
        sitemapEntries.push({
          url: `${BASE_URL}/${locale}/pedagogy/${item.collectionSlug}/${item.slug}`,
          lastModified: new Date(item.updatedAt),
          changeFrequency: "monthly",
          priority: 0.6,
          alternates: {
            languages: {
              en: `${BASE_URL}/en/pedagogy/${item.collectionSlug}/${item.slug}`,
              vi: `${BASE_URL}/vi/pedagogy/${item.collectionSlug}/${item.slug}`,
            },
          },
        });
      }
    }
  }

  // Add blog/highlights pages
  for (const locale of locales) {
    for (const blog of blogs) {
      sitemapEntries.push({
        url: `${BASE_URL}/${locale}/highlights/${blog.slug}`,
        lastModified: new Date(blog.updatedAt),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: {
          languages: {
            en: `${BASE_URL}/en/highlights/${blog.slug}`,
            vi: `${BASE_URL}/vi/highlights/${blog.slug}`,
          },
        },
      });
    }
  }

  return sitemapEntries;
}
