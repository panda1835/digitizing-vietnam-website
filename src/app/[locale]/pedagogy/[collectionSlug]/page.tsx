import { getTranslations } from "next-intl/server";

import { fetcher } from "@/lib/api";
import { getImageByKey } from "@/utils/image";

import ArticleCard from "@/components/ArticleCard";
import { PageHeader } from "@/components/common/PageHeader";

import { Metadata } from "next";
import algoliasearch from "algoliasearch";
import { Pedagogy, PedagogyCollection } from "../page";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID! || "",
  process.env.NEXT_PUBLIC_ALGOLIA_API_KEY! || ""
);

export async function generateMetadata({
  params,
}: {
  params: { locale: string; collectionSlug: string };
}): Promise<Metadata> {
  const t = await getTranslations();

  const { results } = await searchClient.search([
    {
      indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME!,
      query: params.collectionSlug,
      params: {
        restrictSearchableAttributes: ["slug"],
      },
    },
  ]);

  const hits = (results[0] as any).hits.filter(
    (hit) => hit.locale === params.locale && hit.slug === params.collectionSlug
  );

  if (hits.length > 0) {
    return {
      title: `${hits[0].title} | Digitizing Việt Nam`,
    };
  } else {
    return {
      title: `${t("NavigationBar.outreach")} | Digitizing Việt Nam`,
    };
  }
}

const PedagogyCollectionPage = async ({
  params,
}: {
  params: { locale: string; collectionSlug: string };
}) => {
  const { locale, collectionSlug } = params;
  const t = await getTranslations();

  let collectionData: PedagogyCollection = {
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
            } as Pedagogy;
          }) || [],
      };
    }
  } catch (error) {
    console.error("Error fetching pedagogy collection:", error);
  }

  return (
    <div className="flex flex-col max-width items-center">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={collectionData.title}
          subtitle={collectionData.abstract}
          breadcrumbItems={[
            {
              label: t("NavigationBar.outreach"),
              href: "pedagogy",
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
                link={`/pedagogy/${collectionSlug}/${item.slug}`}
                key={`/pedagogy/${collectionSlug}/${item.slug}`}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default PedagogyCollectionPage;
