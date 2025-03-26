import { getTranslations } from "next-intl/server";
import qs from "qs";

import { fetcher } from "@/lib/api";
import { formatDate } from "@/utils/datetime";

import CollectionItemView from "./CollectionItemView";
import FeatureArticle from "./FeatureArticle";
import { Separator } from "@/components/ui/separator";

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
    (hit) => hit.locale === params.locale
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
  let collection = {
    title: "",
    abstract: "",
    datePublished: "",
    dateCreated: "",
    format: [],
    language: [],
    subject: [],
    collectionLocation: "",
    accessCondition: "",
    thumbnail: {
      alternativeText: "",
      caption: "",
      formats: [{ url: "", width: 0, height: 0 }] as unknown as Formats,
    },
    slug: "",
    featuredBlog: [],
  };

  let collectionItems: { display_order: number }[] = [];

  try {
    const queryParams = {
      fields: "*",
      "filters[slug][$eq]": collectionId,
      "populate[0]": "featured_blogs.thumbnail",
      "populate[1]": "date_created",
      "populate[2]": "formats",
      "populate[3]": "languages",
      "populate[4]": "subjects",
      "populate[5]": "collection_location",
      "populate[6]": "access_condition",
      "populate[7]": "thumbnail",

      // "populate[1]": "collection_items.thumbnail",
      // populate: "*",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/collections?${queryString}`;
    const data = await fetcher(url);
    const collectionData = data.data[0];
    collection = {
      title: collectionData.title,
      abstract: collectionData.abstract,
      thumbnail: collectionData.thumbnail[0],
      slug: collectionData.slug,
      datePublished: formatDate(collectionData.publishedAt, locale),
      dateCreated:
        formatDate(collectionData.date_created.full_date, locale) ||
        formatDate(collectionData.date_created.year_month_only, locale) ||
        formatDate(collectionData.date_created.year_only, locale) ||
        formatDate(collectionData.date_created.approximate_date, locale),
      format: collectionData.formats.map((format) => format.name),
      language: collectionData.languages.map((language) => language.name),
      subject: collectionData.subjects.map((subject) => subject.name),
      collectionLocation: collectionData.collection_location.name,
      accessCondition: collectionData.access_condition.name,
      featuredBlog: collectionData.featured_blogs,
      // collectionItems: collectionData.collection_items,
    };

    // For many weird reasons I could not get both collection thumbnail,
    // collection_items thumbnail, and other collection metadata such as access condition, ...
    // So I have to make another API call to get the collection items separately!!!
    const queryParamsCollectionItem = {
      fields: "*",
      "filters[slug][$eq]": collectionId,
      populate: [
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

    // const queryStringCollectionItem = new URLSearchParams(
    //   queryParamsCollectionItem
    // ).toString();

    const queryStringCollectionItem = qs.stringify(queryParamsCollectionItem);

    const urlCollectionItem = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/collections?${queryStringCollectionItem}`;
    const dataCollectionItem = await fetcher(urlCollectionItem);
    const collectionDataCollectionItem = dataCollectionItem.data[0];
    collectionItems = collectionDataCollectionItem.collection_items;
    // Sort collection items by display order
    collectionItems.sort((a, b) => a.display_order - b.display_order);
    // console.log("Collection items:", collectionItems);

    // console.log("Contributors:", collectionItems[0]["contributor"]);
    // console.log("Languages:", collectionItems[0]["languages"]);

    // console.log("Collection:", collection);
    // console.log("Collection items:", collectionItems);
  } catch (error) {
    console.error("Error fetching collection:", error);
  }

  return (
    <div className="flex flex-col max-width items-center">
      <CollectionItemView
        collectionItems={collectionItems}
        collection={collection}
        locale={locale}
      />
      <Separator className="mt-10 w-full" />
      <FeatureArticle highlights={collection.featuredBlog} locale={locale} />
    </div>
  );
};

export default OurCollections;
