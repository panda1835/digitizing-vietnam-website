import { getTranslations } from "next-intl/server";
import qs from "qs";

import { fetcher } from "@/lib/api";

import { Separator } from "@/components/ui/separator";

import CollectionItemView from "./CollectionItemView";
import FeatureArticle from "./FeatureArticle";
import { PageHeader } from "@/components/common/PageHeader";

import { Metadata } from "next";
import algoliasearch from "algoliasearch";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID! || "",
  process.env.NEXT_PUBLIC_ALGOLIA_API_KEY! || ""
);

export async function generateMetadata({
  params,
}: {
  params: { locale: string; collectionid: string };
}): Promise<Metadata> {
  const t = await getTranslations();

  const { results } = await searchClient.search([
    {
      indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME!,
      query: params.collectionid,
      params: {
        restrictSearchableAttributes: ["slug"], // Only search in slug field
      },
    },
  ]);

  const hits = (results[0] as any).hits.filter(
    (hit) => hit.locale === params.locale && hit.slug === params.collectionid
  );

  if (hits.length > 0) {
    return {
      title: `${hits[0].title} | Digitizing Việt Nam`,
    };
  } else {
    return {
      title: `${t("NavigationBar.our-collections")} | Digitizing Việt Nam`,
    };
  }
}

const OurCollections = async ({ params: { locale, collectionid } }) => {
  const collectionId = collectionid;

  const t = await getTranslations();

  let collectionItems: { display_order: number; display_category: string }[] =
    [];
  let featuredBlogs = [];
  let collectionMetadata: { slug: string; title: string; abstract: string } = {
    slug: "",
    title: "",
    abstract: "",
  };

  try {
    const queryParamsCollectionItem = {
      fields: "*",
      "filters[slug][$eq]": collectionId,
      populate: [
        "featured_blogs.thumbnail",

        "collection_items.thumbnail",
        "collection_items.date_created",
        "collection_items.languages",
        "collection_items.contributor",
        "collection_items.subjects",
        "collection_items.publisher",
        "collection_items.collections",
        "collection_items.contributor.author",
        "collection_items.contributor.author_role_term",
      ],
      locale: locale,
    };

    const queryStringCollectionItem = qs.stringify(queryParamsCollectionItem);

    const urlCollectionItem = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/collections?${queryStringCollectionItem}`;
    const dataCollectionItem = await fetcher(urlCollectionItem);
    const collectionData = dataCollectionItem.data[0];
    collectionItems = collectionData.collection_items;
    featuredBlogs = collectionData.featured_blogs;
    collectionMetadata = {
      slug: collectionData.slug,
      title: collectionData.title,
      abstract: collectionData.abstract,
    };
    // Sort collection items by display order
    collectionItems.sort((a, b) => a.display_order - b.display_order);
  } catch (error) {
    console.error("Error fetching collection:", error);
  }

  return (
    <div className="flex flex-col w-full items-center">
      <PageHeader
        title={collectionMetadata.title}
        subtitle={collectionMetadata.abstract}
        breadcrumbItems={[
          {
            label: t("NavigationBar.our-collections"),
            href: "our-collections",
          },
          { label: collectionMetadata.title },
        ]}
        locale={locale}
      />
      <CollectionItemView collectionItems={collectionItems} />
      <Separator className="mt-10 w-full" />
      <FeatureArticle highlights={featuredBlogs} locale={locale} />
    </div>
  );
};

export default OurCollections;
