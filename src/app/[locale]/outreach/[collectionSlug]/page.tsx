import { getTranslations } from "next-intl/server";
import qs from "qs";

import { fetcher } from "@/lib/api";
import { getImageByKey } from "@/utils/image";
import { stripHtmlTags, getStrapiImageUrl } from "@/utils/seo";

import ArticleCard from "@/components/ArticleCardShort";
import { PageHeader } from "@/components/common/PageHeader";

import { Metadata } from "next";
import { Outreach, OutreachCollection } from "../page";

export async function generateMetadata({
  params,
}: {
  params: { locale: string; collectionSlug: string };
}): Promise<Metadata> {
  const t = await getTranslations();

  try {
    const queryParams = {
      fields: ["title", "abstract"],
      "filters[slug][$eq]": params.collectionSlug,
      "populate[0]": "thumbnail",
      locale: params.locale,
    };
    const queryString = qs.stringify(queryParams);
    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/pedagogy-collections?${queryString}`;
    const data = await fetcher(url);

    if (data.data && data.data.length > 0) {
      const collection = data.data[0];
      const description = stripHtmlTags(collection.abstract);
      const thumbnailUrl = collection.thumbnail?.formats
        ? getImageByKey(collection.thumbnail.formats, "medium")?.url ||
          collection.thumbnail?.url
        : collection.thumbnail?.url;
      const ogImage = getStrapiImageUrl(thumbnailUrl);

      return {
        title: `${collection.title} | Digitizing Việt Nam`,
        description,
        openGraph: {
          ...(ogImage ? { images: [{ url: ogImage }] } : {}),
        },
      };
    }
  } catch (error) {
    console.error("Error fetching outreach collection metadata:", error);
  }

  return {
    title: `${t("NavigationBar.outreach-menu")} | Digitizing Việt Nam`,
  };
}

const OutreachCollectionPage = async ({
  params,
}: {
  params: { locale: string; collectionSlug: string };
}) => {
  const { locale, collectionSlug } = params;
  const t = await getTranslations();

  let collectionData: OutreachCollection = {
    slug: "",
    title: "",
    abstract: "",
    pedagogies: [],
  };

  try {
    const queryParams = {
      fields: "*",
      "filters[slug][$eq]": collectionSlug,
      "populate[0]": "thumbnail",
      "populate[1]": "pedagogy_category",
      "populate[2]": "pedagogy_items.thumbnail",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/pedagogy-collections?${queryString}`;
    const data = await fetcher(url);
    const collection = data.data?.[0];

    if (collection) {
      collectionData = {
        slug: collection.slug,
        title: collection.title,
        abstract: collection.abstract,
        thumbnail: collection.thumbnail
          ? {
              url: collection.thumbnail.url,
              width: collection.thumbnail.width,
              height: collection.thumbnail.height,
              formats: collection.thumbnail.formats,
            }
          : undefined,
        pedagogy_category: collection.pedagogy_category
          ? {
              slug: collection.pedagogy_category.slug,
              name: collection.pedagogy_category.name,
            }
          : undefined,
        pedagogies:
          collection.pedagogy_items?.map((post) => {
            const thumbnail = post.thumbnail
              ? getImageByKey(post.thumbnail.formats, "medium")
              : null;
            return {
              slug: post.slug,
              title: post.title,
              description: post.description,
              content: post.content,
              contributors: [],
              thumbnail: thumbnail
                ? {
                    url: thumbnail.url,
                    width: thumbnail.width,
                    height: thumbnail.height,
                  }
                : undefined,
              metadata: post.metadata,
            } as Outreach;
          }) || [],
      };
    }
  } catch (error) {
    console.error("Error fetching outreach collection:", error);
  }

  return (
    <div className="flex flex-col max-width items-center">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={collectionData.title}
          subtitle={collectionData.abstract}
          breadcrumbItems={[
            {
              label: t("NavigationBar.outreach-menu"),
              href: "outreach",
            },
            { label: collectionData.title },
          ]}
          locale={locale}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10">
          {collectionData.pedagogies
            ?.slice()
            .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
            .map((item) => (
              <ArticleCard
                title={item.title}
                description={item.description}
                date={""}
                imageUrl={item.thumbnail}
                link={`/outreach/${collectionSlug}/${item.slug}`}
                key={`/outreach/${collectionSlug}/${item.slug}`}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default OutreachCollectionPage;
