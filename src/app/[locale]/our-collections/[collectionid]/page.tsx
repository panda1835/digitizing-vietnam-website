import { getTranslations } from "next-intl/server";
import Image from "next/image";
import qs from "qs";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CollectionItem from "@/components/collection/CollectionItem";
import MetaData from "@/components/collection/Metadata";

import { fetcher } from "@/lib/api";
import { getImageByKey } from "@/utils/image";
import { formatDate } from "@/utils/datetime";
import { populate } from "dotenv";

const EachCollection = async ({ params: { locale, collectionid } }) => {
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
  };

  let collectionItems = [];

  try {
    const queryParams = {
      fields: "*",
      "filters[slug][$eq]": collectionId,
      // "populate[0]": "thumbnail",
      // "populate[1]": "collection_items.thumbnail",
      populate: "*",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/collections?${queryString}`;
    const data = await fetcher(url);
    const collectionData = data.data[0];
    // console.log("Collection data:", collectionData);
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
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{t("Header.home")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${locale}/our-collections`}>
                {t("Header.our-collections")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{collection.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* Banner */}
        <Image
          unoptimized
          src={getImageByKey(collection.thumbnail.formats, "small")!.url}
          alt={collection.thumbnail.alternativeText}
          width={100}
          height={100}
          className="w-full h-[300px] object-cover mt-8 rounded"
        />

        <h1 className="text-primary-blue my-8">{collection.title}</h1>

        <div className="mb-4">{collection.abstract}</div>
        <Dialog>
          <DialogTrigger>
            <p className="text-blue-600 hover:underline">Metadata</p>
          </DialogTrigger>
          <DialogContent className="">
            <DialogHeader>
              <DialogTitle>{collection.title}</DialogTitle>
              <DialogDescription>
                <MetaData collection={collection} />
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <CollectionItem
          collectionItems={collectionItems}
          collectionSlug={collection.slug}
          locale={locale}
        />

        <div className="mb-10"></div>

        {/* Featured articles */}
        <section>
          <h1 id="feature-articles">{t("Collection.featured-articles")}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {/* {featuredArticles &&
              featuredArticles &&
              featuredArticles.map((item) => (
                <Item
                  title={item.title}
                  description={""}
                  imageUrl={item.image_url}
                  link={`/blogs/${item.blog_id}`}
                  key={`/blogs/${item.blog_id}`}
                />
              ))} */}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EachCollection;
