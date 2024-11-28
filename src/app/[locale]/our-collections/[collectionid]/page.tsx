import { getTranslations } from "next-intl/server";
import Image from "next/image";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import CollectionItemGallery from "@/components/CollectionItemGallery";
import Item from "@/components/Item";
import ScrollButtons from "@/components/ScrollButtons";

import { Collection, CollectionItem } from "@/types/collection";
import { fetcher } from "@/lib/api";
import { getImageByKey } from "@/utils/image";
import { get } from "http";

const EachCollection = async ({ params: { locale, collectionId } }) => {
  const t = await getTranslations();

  let collection = {
    title: "",
    abstract: "",
    thumbnail: {
      alternativeText: "",
      caption: "",
      formats: {},
    },
    slug: "",
    collection_items: [],
  };

  try {
    const queryParams = {
      fields: "*",
      "filters[slug][$eq]": collectionId,
      "populate[0]": "thumbnail",
      "populate[1]": "collection_items.thumbnail",
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
      collection_items: collectionData.collection_items.map((item) => ({
        title: item.title,
        description: item.description,
        image_url: getImageByKey(item.thumbnail.formats, "medium")!,
        link: `/collections/${collectionId}/${item.slug}`,
      })),
    };
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
              <BreadcrumbLink href={`/${locale}/our-collections`}>
                {t("Collection.title")}
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

        <div className="mb-8">{collection.abstract}</div>

        {/* Item gallery */}
        <CollectionItemGallery
          collectionData={collection.collection_items}
          collectionId={collectionId}
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
