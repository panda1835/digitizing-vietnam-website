import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

import MiradorViewer from "@/components/mirador/MiradorViewer";
import CollectionPermalink from "@/components/CollectionPermalink";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { Separator } from "@/components/ui/separator";
import { Merriweather } from "next/font/google";
import HanNomMetadata from "./Metadata";
import { getHanNomManifestEntryByItemId } from "@/lib/han-nom-collection";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

interface IIIFManifest {
  "@context": string | string[];
  id: string;
  type: string;
  label: {
    en?: string[];
    [key: string]: string[] | undefined;
  };
  thumbnail?: Array<{
    id: string;
    type: string;
    format: string;
  }>;
  metadata?: Array<{
    label: { en?: string[] };
    value: { en?: string[] };
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; itemid: string };
}): Promise<Metadata> {
  const t = await getTranslations();

  try {
    const manifestEntry = getHanNomManifestEntryByItemId(params.itemid);
    const manifestUrl = manifestEntry?.manifestUrl || "";

    if (manifestUrl) {
      const manifestResponse = await fetch(manifestUrl);
      const manifest: IIIFManifest = await manifestResponse.json();
      const title = manifest.label?.en?.[0] || t("HanNomCollection.collection-title");

      return {
        title: `${title} | Digitizing Việt Nam`,
      };
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  return {
    title: `${t("NavigationBar.our-collections")} | Digitizing Việt Nam`,
  };
}

const HanNomItemViewer = async ({
  params,
  searchParams,
}: {
  params: { locale: string; itemid: string };
  searchParams?: {
    canvasId?: string;
  };
}) => {
  const { locale, itemid } = params;
  const originalCanvasId = searchParams?.canvasId || "";
  const t = await getTranslations();

  let manifestData: IIIFManifest | null = null;
  let manifestUrl = "";
  let cuCatalogUrl = "";

  try {
    const manifestEntry = getHanNomManifestEntryByItemId(itemid);
    manifestUrl = manifestEntry?.manifestUrl || "";
    cuCatalogUrl = manifestEntry?.pid
      ? `https://dlc.library.columbia.edu/catalog/${manifestEntry.pid}`
      : "";

    if (manifestUrl) {
      const manifestResponse = await fetch(manifestUrl);
      manifestData = await manifestResponse.json();
    }
  } catch (error) {
    console.error("Error fetching manifest:", error);
  }

  if (!manifestData) {
    return (
      <div className="flex flex-col w-full items-center p-10">
        <p>{t("HanNomCollection.item-not-found")}</p>
      </div>
    );
  }

  const title = manifestData.label?.en?.[0] || t("HanNomCollection.untitled");
  const metadata = (manifestData.metadata || []).map((item) => ({
    label: item.label.en?.[0] || "",
    value: item.value.en?.[0] || "",
  }));

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
              label: t("HanNomCollection.collection-title"),
              href: "/our-collections/han-nom-collection",
            },
            { label: title },
          ]}
        />

        {/* Headline */}
        <div
          className={`${merriweather.className} text-branding-black text-4xl max-w-5xl`}
        >
          {title}
        </div>

        {/* Share links */}
        <CollectionPermalink />

        <div className="mt-16">
          <Separator />
        </div>

        {/* Mirador Viewer */}
        <div className="flex flex-row mt-10">
          <div className="w-full relative">
            <MiradorViewer
              manifestUrl={manifestUrl}
              canvasId={originalCanvasId}
            />
          </div>
        </div>

        <div className="mt-16">
          <Separator />
        </div>

        {/* Metadata */}
        <HanNomMetadata metadata={metadata} cuCatalogUrl={cuCatalogUrl} />
      </div>
    </div>
  );
};

export default HanNomItemViewer;
