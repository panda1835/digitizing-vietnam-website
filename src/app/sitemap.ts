import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://digitizingvietnam.com";

// Static pages that exist for all locales
const staticPages = [
  "",
  "/about-us",
  "/our-collections",
  "/pedagogy",
  "/highlights",
  "/online-resources",
  "/tools",
  "/tools/han-nom-dictionaries",
  "/tools/kieu-tools",
  "/tools/han-nom-tools",
  "/tools/digital-humanities-tools",
];

async function getCollections(): Promise<
  { slug: string; updatedAt: string }[]
> {
  try {
    const queryParams = new URLSearchParams({
      fields: "slug,updatedAt",
      "pagination[pageSize]": "1000",
    });

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/collections?${queryParams}`;
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
    const data = await response.json();

    return (
      data.data?.map((item: any) => ({
        slug: item.slug,
        updatedAt: item.updatedAt,
      })) || []
    );
  } catch (error) {
    console.error("Error fetching collections for sitemap:", error);
    return [];
  }
}

async function getCollectionItems(): Promise<
  { slug: string; collectionSlug: string; updatedAt: string }[]
> {
  try {
    const queryParams = new URLSearchParams({
      fields: "slug,updatedAt",
      "populate[0]": "collections",
      "pagination[pageSize]": "1000",
    });

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/collection-items?${queryParams}`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    const data = await response.json();

    return (
      data.data?.map((item: any) => ({
        slug: item.slug,
        collectionSlug: item.collections?.[0]?.slug || "",
        updatedAt: item.updatedAt,
      })) || []
    );
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

  // Add collection pages
  for (const locale of locales) {
    for (const collection of collections) {
      sitemapEntries.push({
        url: `${BASE_URL}/${locale}/our-collections/${collection.slug}`,
        lastModified: new Date(collection.updatedAt),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: {
          languages: {
            en: `${BASE_URL}/en/our-collections/${collection.slug}`,
            vi: `${BASE_URL}/vi/our-collections/${collection.slug}`,
          },
        },
      });
    }
  }

  // Add collection item pages
  for (const locale of locales) {
    for (const item of collectionItems) {
      if (item.collectionSlug) {
        sitemapEntries.push({
          url: `${BASE_URL}/${locale}/our-collections/${item.collectionSlug}/${item.slug}`,
          lastModified: new Date(item.updatedAt),
          changeFrequency: "monthly",
          priority: 0.6,
          alternates: {
            languages: {
              en: `${BASE_URL}/en/our-collections/${item.collectionSlug}/${item.slug}`,
              vi: `${BASE_URL}/vi/our-collections/${item.collectionSlug}/${item.slug}`,
            },
          },
        });
      }
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
