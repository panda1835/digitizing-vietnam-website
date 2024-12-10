// "use client";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

import MiradorViewer from "@/components/mirador/MiradorViewer";
import CollectionInforPanel from "@/components/CollectionInforPanel";
import CollectionPermalink from "@/components/CollectionPermalink";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import config from "../../../../config";
import { fetchCollectionItems } from "@/utils/data";

const CollectionItemViewer = async ({
  params,
  searchParams,
}: {
  params: { collectionId: string; documentId: string; locale: string };
  searchParams?: {
    canvasId?: string;
  };
}) => {
  // const searchParams = useSearchParams();
  // const canvasParam = new URLSearchParams(searchParams);
  // const originalCanvasId = canvasParam.get("canvasId")?.toString();

  const locale = params.locale;
  const collectionId = params.collectionId;
  const documentId = params.documentId;
  const originalCanvasId = searchParams?.canvasId || "";

  const t = await getTranslations();

  // const { manifest, mediaType, collectionName, currentPageOCR } =
  // await fetchCollectionItems(
  //   collectionId,
  //   documentId,
  //   locale,
  //   originalCanvasId
  // );

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5 ">
        {/* Breadcrumbs */}

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
            {/* <BreadcrumbItem>
              <BreadcrumbPage>{collectionName}</BreadcrumbPage>
            </BreadcrumbItem> */}
          </BreadcrumbList>
        </Breadcrumb>
        {/* Title */}
        {/* <h1>
          {manifest
            ? manifest["label"] && Object.keys(manifest["label"]).includes("en")
              ? manifest["label"]["en"][0]
              : manifest["label"]
            : null}
        </h1> */}

        {/* Share links */}
        <CollectionPermalink />

        {/* Content */}
        <div className="flex flex-row">
          {/* General Info and Text OCR section */}
          {/* <CollectionInforPanel
            manifest={manifest}
            mediaType={mediaType}
            currentPageOCR={currentPageOCR}
          /> */}

          {/* Item viewer */}
          <div className="w-full relative ml-5">
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
                manifestUrl={`https://manifest.digitizingvietnam.com/get-manifest?item-slug=${documentId}`}
                canvasId={originalCanvasId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionItemViewer;
