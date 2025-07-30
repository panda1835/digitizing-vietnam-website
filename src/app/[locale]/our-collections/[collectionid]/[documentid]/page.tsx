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

import TruyenKieu from "./searchable-text/truyen-kieu/TruyenKieuText";
import LucVanTienText from "./searchable-text/luc-van-tien/LucVanTienText";
import ChinhPhuNgamText from "./searchable-text/chinh-phu-ngam-khuc/ChinhPhuNgamText";
import TinhHoaMuaXuan from "./searchable-text/tinh-hoa-mua-xuan/TinhHoaMuaXuan";
import QuocAmThiTap from "./searchable-text/quoc-am-thi-tap/QuocAmThiTap";
import DaiVietSuKyToanThu from "./searchable-text/dai-viet-su-ky-toan-thu/DaiVietSuKyToanThu";
import NotFound from "@/app/not-found";

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
    line?: string;
  };
}) => {
  const locale = params.locale;
  const collectionId = params.collectionid;
  const documentId = params.documentid;
  const originalCanvasId = searchParams?.canvasId || "";
  const currentPage = searchParams?.page || "1";
  const currentTopic = searchParams?.topic || "";
  const highlightedLine = searchParams?.line || "";

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

  if (!collectionItemData) {
    return <NotFound />;
  }

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
        ) : collectionId === "quoc-am-thi-tap" &&
          documentId === "nguyen-trai-quoc-am-thi-tap" ? (
          <QuocAmThiTap
            locale={locale}
            topic={currentTopic || "1"}
            highlightedLine={Number(highlightedLine)}
          />
        ) : collectionId === "dai-viet-su-ky-toan-thu" &&
          documentId === "quyen-thu" ? (
          <DaiVietSuKyToanThu
            title={collectionItemData.title}
            locale={locale}
            documentid={documentId}
            book="0"
            page={currentPage}
            topic={currentTopic || "1"}
          />
        ) : collectionId === "dai-viet-su-ky-toan-thu" &&
          documentId === "ngoai-ky" ? (
          <DaiVietSuKyToanThu
            title={collectionItemData.title}
            locale={locale}
            documentid={documentId}
            book="1"
            page={currentPage}
            topic={currentTopic || "1"}
          />
        ) : collectionId === "dai-viet-su-ky-toan-thu" &&
          documentId === "ban-ky-toan-thu" ? (
          <DaiVietSuKyToanThu
            title={collectionItemData.title}
            locale={locale}
            documentid={documentId}
            book="2"
            page={currentPage}
            topic={currentTopic || "1"}
          />
        ) : collectionId === "dai-viet-su-ky-toan-thu" &&
          documentId === "ban-ky-thuc-luc" ? (
          <DaiVietSuKyToanThu
            title={collectionItemData.title}
            locale={locale}
            documentid={documentId}
            book="3"
            page={currentPage}
            topic={currentTopic || "1"}
          />
        ) : collectionId === "dai-viet-su-ky-toan-thu" &&
          documentId === "ban-ky-tuc-bien" ? (
          <DaiVietSuKyToanThu
            title={collectionItemData.title}
            locale={locale}
            documentid={documentId}
            book="4"
            page={currentPage}
            topic={currentTopic || "1"}
          />
        ) : collectionId === "truyen-kieu" &&
          documentId === "truyen-kieu-1866" ? (
          <TruyenKieu
            title={collectionItemData.title}
            locale={locale}
            documentid={documentId}
            version={"1866"}
            page={currentPage}
          />
        ) : collectionId === "truyen-kieu" &&
          documentId === "truyen-kieu-1870" ? (
          <TruyenKieu
            title={collectionItemData.title}
            locale={locale}
            documentid={documentId}
            version={"1870"}
            page={currentPage}
          />
        ) : collectionId === "truyen-kieu" &&
          documentId === "truyen-kieu-1871" ? (
          <TruyenKieu
            title={collectionItemData.title}
            locale={locale}
            documentid={documentId}
            version={"1871"}
            page={currentPage}
          />
        ) : collectionId === "truyen-kieu" &&
          documentId === "truyen-kieu-1872" ? (
          <TruyenKieu
            title={collectionItemData.title}
            locale={locale}
            documentid={documentId}
            version={"1872"}
            page={currentPage}
          />
        ) : collectionId === "truyen-kieu" &&
          documentId === "truyen-kieu-1902" ? (
          <TruyenKieu
            title={collectionItemData.title}
            locale={locale}
            documentid={documentId}
            version={"1902"}
            page={currentPage}
          />
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
