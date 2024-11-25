// "use client";
import { Link } from "../../../../../i18n/routing";
import { getTranslations } from "next-intl/server";

import MiradorViewer from "../../../../../components/MiradorViewer";
import CollectionInforPanel from "../../../../../components/CollectionInforPanel";
import CollectionPermalink from "../../../../../components/CollectionPermalink";

import config from "../../../../config";
import { fetchCollectionItems } from "../../../../../utils/data";

const CollectionItemViewer = async ({
  params,
  searchParams,
}: {
  params: { collectionid: string; documentid: string; locale: string };
  searchParams?: {
    canvasId?: string;
  };
}) => {
  // const searchParams = useSearchParams();
  // const canvasParam = new URLSearchParams(searchParams);
  // const originalCanvasId = canvasParam.get("canvasId")?.toString();

  const locale = params.locale;
  const collectionId = params.collectionid;
  const documentId = params.documentid;
  const originalCanvasId = searchParams?.canvasId || "";

  const t = await getTranslations();

  const { manifest, mediaType, collectionName, currentPageOCR } =
    await fetchCollectionItems(
      collectionId,
      documentId,
      locale,
      originalCanvasId
    );

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5 ">
        {/* Breadcrumbs */}
        <div className="flex items-center">
          <Link href="/our-collections">
            <h3 className="hover:underline">{t("Header.our-collections")}</h3>
          </Link>
          <h3 className="mx-3">{">"}</h3>
          {/* <ChevronRightIcon className="w-10"></ChevronRightIcon> */}
          <Link href={`/our-collections/${collectionId}`}>
            <h3 className="hover:underline">{collectionName}</h3>
          </Link>
        </div>

        {/* Title */}
        <h1>
          {manifest
            ? manifest["label"] && Object.keys(manifest["label"]).includes("en")
              ? manifest["label"]["en"][0]
              : manifest["label"]
            : null}
        </h1>

        {/* Share links */}
        <CollectionPermalink />

        {/* Content */}
        <div className="flex flex-row">
          {/* General Info and Text OCR section */}
          <CollectionInforPanel
            manifest={manifest}
            mediaType={mediaType}
            currentPageOCR={currentPageOCR}
          />

          {/* Item viewer */}
          <div className="w-full relative ml-5">
            {mediaType === "video" && (
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
            )}

            {mediaType === "document" && (
              <MiradorViewer
                manifestUrl={`${config["api"]["manifest"]}/${collectionId}/${documentId}`}
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
