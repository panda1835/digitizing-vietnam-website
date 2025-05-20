// "use client";
import { getTranslations } from "next-intl/server";
import qs from "qs";

import MiradorViewer from "@/components/mirador/MiradorViewer";
import CollectionPermalink from "@/components/CollectionPermalink";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import DocumentMetadata from "./Metadata";
import { Separator } from "@/components/ui/separator";

import { fetcher } from "@/lib/api";
import { renderHtml } from "@/utils/renderHtml";
import { Merriweather } from "next/font/google";
import { Metadata } from "next";
import algoliasearch from "algoliasearch";

import TruyenKieu from "./searchable-text/TruyenKieuText";
import LucVanTienText from "./searchable-text/LucVanTienText";
import ChinhPhuNgamText from "./searchable-text/ChinhPhuNgamText";
import TinhHoaMuaXuan from "./searchable-text/TinhHoaMuaXuan";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID! || "",
  process.env.NEXT_PUBLIC_ALGOLIA_API_KEY! || ""
);

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export async function generateMetadata({
  params,
}: {
  params: { locale: string; collectionid: string; documentid: string };
}): Promise<Metadata> {
  const t = await getTranslations();

  const { results } = await searchClient.search([
    {
      indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME!,
      query: params.documentid,
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

const CollectionItemViewer = async ({
  params,
  searchParams,
}: {
  params: { collectionid: string; documentid: string; locale: string };
  searchParams?: {
    canvasId?: string;
    page?: string;
    topic?: string;
  };
}) => {
  const locale = params.locale;
  const collectionId = params.collectionid;
  const documentId = params.documentid;
  const originalCanvasId = searchParams?.canvasId || "";
  const currentPage = searchParams?.page || "1";
  const currentTopic = searchParams?.topic || "";

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
        "item_url",
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

  if (collectionId === "truyen-kieu") {
    if (documentId === "truyen-kieu-1866") {
      return (
        <TruyenKieu
          version="1866"
          locale={locale}
          documentid={`truyen-kieu-1866`}
          collectionid={collectionId}
          collectionTitle={collectionTitle}
        />
      );
    } else if (documentId === "truyen-kieu-1870") {
      return (
        <TruyenKieu
          version="1870"
          locale={locale}
          documentid={`truyen-kieu-1870`}
          collectionid={collectionId}
          collectionTitle={collectionTitle}
        />
      );
    } else if (documentId === "truyen-kieu-1871") {
      return (
        <TruyenKieu
          version="1871"
          locale={locale}
          documentid={`truyen-kieu-1871`}
          collectionid={collectionId}
          collectionTitle={collectionTitle}
        />
      );
    } else if (documentId === "truyen-kieu-1872") {
      return (
        <TruyenKieu
          version="1872"
          locale={locale}
          documentid={`truyen-kieu-1872`}
          collectionid={collectionId}
          collectionTitle={collectionTitle}
        />
      );
    } else if (documentId === "truyen-kieu-1902") {
      return (
        <TruyenKieu
          version="1902"
          locale={locale}
          documentid={`truyen-kieu-1902`}
          collectionid={collectionId}
          collectionTitle={collectionTitle}
        />
      );
    }
    // Do not have else because the documentid can be different for other items
  }

  // if (collectionId === "luc-van-tien") {
  //   if (documentId === "van-tien-co-tich-tan-truyen") {
  //     return (
  //       <LucVanTienText
  //         collectionTitle={collectionTitle}
  //         title={collectionItemData.title}
  //         abstract={collectionItemData.abstract}
  //         locale={locale}
  //         documentid={`van-tien-co-tich-tan-truyen`}
  //         collectionid={collectionId}
  //         page={currentPage}
  //       />
  //     );
  //   }
  // }

  // if (collectionId === "chinh-phu-ngam-khuc") {
  //   if (documentId === "chinh-phu-ngam-khuc") {
  //     return (
  //       <ChinhPhuNgamText
  //         collectionTitle={collectionTitle}
  //         title={collectionItemData?.title}
  //         abstract={collectionItemData?.abstract}
  //         locale={locale}
  //         documentid={`chinh-phu-ngam-khuc`}
  //         collectionid={collectionId}
  //         page={currentPage}
  //       />
  //     );
  //   }
  // }

  let documentType = "document";
  if (collectionItemData.item_url[0]) {
    const url = collectionItemData.item_url[0];
    if (url.media_embed) {
      documentType = "embed";
    }
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
          className={`${merriweather.className} text-branding-black text-4xl max-w-5xl`}
        >
          {collectionItemData.title}
        </div>

        {/* Subheadline */}
        <div
          className={`font-['Helvetica_Neue'] font-light text-lg mt-8 max-w-5xl`}
        >
          {collectionItemData.abstract}
        </div>

        {/* Share links */}
        <CollectionPermalink />

        <div className="mt-16">
          <Separator />
        </div>

        {/* Content */}
        {collectionId === "luc-van-tien" &&
        documentId === "van-tien-co-tich-tan-truyen" ? (
          <LucVanTienText
            title={collectionItemData.title}
            locale={locale}
            documentid={documentId}
            page={currentPage}
          />
        ) : collectionId === "chinh-phu-ngam-khuc" &&
          documentId === "chinh-phu-ngam-khuc" ? (
          <ChinhPhuNgamText
            title={collectionItemData?.title}
            locale={locale}
            documentid={documentId}
            page={currentPage}
          />
        ) : collectionId === "tho-ho-xuan-huong" &&
          documentId === "tinh-hoa-mua-xuan" ? (
          <TinhHoaMuaXuan locale={locale} topic={currentTopic || "Cảnh thu"} />
        ) : (
          <div className="flex flex-row">
            {/* Item viewer */}
            <div className="w-full relative">
              {/* Video/audio type */}
              {documentType === "embed" && (
                <div className="flex">
                  <div
                    className=""
                    dangerouslySetInnerHTML={renderHtml(
                      collectionItemData.item_url[0].media_embed
                    )}
                  ></div>
                </div>
              )}

              {/* Automatic IIIF Manifest */}
              {documentType === "document" && (
                <MiradorViewer
                  manifestUrl={`${backendUrl}/get-manifest?item-slug=${documentId}&locale=${locale}`}
                  canvasId={originalCanvasId}
                />
              )}
            </div>
          </div>
        )}
        <div className="mt-16">
          <Separator />
        </div>

        {/* Metadata */}
        <DocumentMetadata
          locale={locale}
          collectionItemData={collectionItemData}
        />
      </div>
    </div>
  );
};

export default CollectionItemViewer;
