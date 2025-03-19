// "use client";
import { getTranslations } from "next-intl/server";
import qs from "qs";

import MiradorViewer from "@/components/mirador/MiradorViewer";
import CollectionPermalink from "@/components/CollectionPermalink";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import Metadata from "./Metadata";
import { Separator } from "@/components/ui/separator";

import { fetcher } from "@/lib/api";
import { Merriweather } from "next/font/google";
import { toast } from "sonner";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const CollectionItemViewer = async ({
  params,
  searchParams,
}: {
  params: { collectionid: string; documentid: string; locale: string };
  searchParams?: {
    canvasId?: string;
  };
}) => {
  const locale = params.locale;
  const collectionId = params.collectionid;
  const documentId = params.documentid;
  const originalCanvasId = searchParams?.canvasId || "";

  const t = await getTranslations();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  let collectionItemData: any = {};
  let collectionTitle = "";

  try {
    const queryParams = {
      fields: "*",
      "filters[slug][$eq]": documentId,
      populate: [
        "date_created",
        "languages",
        "contributor",
        "subjects",
        "publisher",
        "collections",
        "resource_types",
        "format",
        "place_of_publication",
        "access_condition",
        "contributor.author",
        "contributor.author_role_term",
      ],
      locale: locale,
    };
    const queryStringParam = qs.stringify(queryParams);
    const queryString = new URLSearchParams(queryStringParam).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/collection-items?${queryString}`;
    const data = await fetcher(url);
    collectionItemData = data.data[0];
    collectionTitle =
      collectionItemData.collections.find(
        (collection: any) => collection.slug === collectionId
      )?.title || "";
  } catch (error) {
    console.log("Error fetching collection:", error);
  }

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex-col mb-20 w-full">
        {/* Breadcrumbs */}

        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[
            {
              label: t("NavigationBar.our-collections"),
              href: "/our-collections",
            },
            {
              label: collectionTitle,
              href: "/our-collections/" + collectionId,
            },
            { label: collectionItemData.title },
          ]}
        />

        {/* Headline */}
        <div
          className={`${merriweather.className} text-branding-black text-4xl`}
        >
          {collectionItemData.title}
        </div>

        {/* Subheadline */}
        <div
          className={`font-light font-['Helvetica Neue'] leading-relaxed mt-8 max-w-4xl`}
        >
          {collectionItemData.abstract}
        </div>

        {/* Share links */}
        <CollectionPermalink />

        {/* Content */}
        <div className="flex flex-row">
          {/* General Info and Text OCR section */}

          {/* Item viewer */}
          <div className="w-full relative">
            {/* {mediaType === "video" && (
              <div>
                <iframe
                  width="600"
                  height="315"
                  src={`https://www.youtube.com/embed/${
                    manifest["items"][0]["items"][0]["items"][0]["body"][
                      "id"
                    ].split("=")[1]
                  }`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )} */}

            {"document" === "document" && (
              <MiradorViewer
                manifestUrl={`${backendUrl}/get-manifest?item-slug=${documentId}&locale=${locale}`}
                canvasId={originalCanvasId}
              />
            )}
          </div>
        </div>
        <div className="mt-16">
          <Separator />
        </div>

        {/* Metadata */}
        <Metadata locale={locale} collectionItemData={collectionItemData} />
      </div>
    </div>
  );
};

export default CollectionItemViewer;
