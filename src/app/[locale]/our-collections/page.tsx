import { getTranslations } from "next-intl/server";

import { fetcher } from "@/lib/api";
import { formatDate } from "@/utils/datetime";

import { Collection } from "@/types/collection";

import CollectionView from "@/components/view/Collection";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
    collections = collectionData.map(
      (collection) =>
        ({
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
          format: collection.formats.map((format) => format.name),
          language: collection.languages.map((language) => language.name),
          subject: collection.subjects.map((subject) => subject.name),
          collectionLocation: collection.collection_location.name,
          accessCondition: collection.access_condition.name,
          collectionItems: collection.collection_items,
        } as Collection)
    );
  } catch (error) {
    console.error("Error fetching blog:", error);
  }

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{t("Header.home")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("Collection.title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <section className="flex flex-col items-center justify-center mt-8">
          <h1 className="">{t("Collection.title")}</h1>
          <p className="text-gray-500 mb-5 text-center">
            {t("Collection.subtitle")}
          </p>
        </section>
        <CollectionView collections={collections} />
        {/* Collection gallery */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {collections.map((collection) => (
            <Item
              title={collection.title}
              description={collection.abstract}
              max_trim_word={50}
              imageUrl={
                getImageByKey(collection.thumbnail[0].formats, "medium")!
              }
              link={`/our-collections/${collection.slug}`}
              key={`/our-collections/${collection.slug}`}
            />
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default OurCollections;
