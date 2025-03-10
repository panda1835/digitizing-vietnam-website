import { getTranslations } from "next-intl/server";
import qs from "qs";

import { fetcher } from "@/lib/api";
import { formatDate } from "@/utils/datetime";
import { Collection } from "@/types/collection";

import CollectionItemView from "./CollectionItemView";
import FeatureArticle from "./FeatureArticle";
import { Separator } from "@/components/ui/separator";

const OurCollections = async ({ params: { locale, collectionid } }) => {
  const collectionId = collectionid;
  let collections: Collection[] = [];

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

  let collectionItems = [];

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
