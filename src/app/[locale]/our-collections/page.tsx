import { getTranslations } from "next-intl/server";

import { fetcher } from "@/lib/api";
import { formatDate } from "@/utils/datetime";
import { Collection } from "@/types/collection";

import CollectionView from "./CollectionView";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("NavigationBar.our-collections")} | Digitizing Việt Nam`,
  };
}

const OurCollections = async ({ params: { locale } }) => {
  let collections: Collection[] = [];

  const t = await getTranslations();

  try {
    const queryParams = {
      fields: "*",
      populate: "*",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/collections?${queryString}`;
    const data = await fetcher(url);
    const collectionData = data.data;

    // console.log("collectionData", collectionData);
    collections = collectionData.map((collection) => ({
      title: collection.title,
      abstract: collection.abstract,
      thumbnail: collection.thumbnail[0],
      slug: collection.slug,
      datePublished: formatDate(collection.publishedAt, locale),
      dateCreated:
        formatDate(collection.date_created.full_date, locale) ||
        formatDate(collection.date_created.year_month_only, locale) ||
        formatDate(collection.date_created.year_only, locale) ||
        formatDate(collection.date_created.approximate_date, locale),
      formats: collection.formats?.map((format) => format.name) || [], // Default to an empty array
      languages: collection.languages?.map((language) => language.name) || [], // Default to an empty array
      subjects: collection.subjects?.map((subject) => subject.name) || [], // Default to an empty array
      collectionLocation: collection.collection_location?.name || "Unknown", // Default to "Unknown"
      accessCondition: collection.access_condition?.name || "Unknown", // Default to "Unknown"
      collectionItems: collection.collection_items || [], // Default to an empty array
      resourceTypes:
        collection.resource_types?.map((resourceType) => resourceType.name) ||
        [], // Default to an empty array
    }));
  } catch (error) {
    console.error("Error fetching collections:", error);
  }

  return (
    <div className="flex flex-col max-width items-center">
      <CollectionView collections={collections} locale={locale} />
    </div>
  );
};

export default OurCollections;
