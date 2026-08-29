// src/app/[locale]/our-collections/the-borgia-tonchinensis-collection/[itemid]/page.tsx
//
// Item page for one Borgia Tonchinensis manuscript.
//
// A sibling static folder like this takes routing precedence over
// [collectionid]/[documentid], which is how vietnamese-edicts and
// han-nom-collection work.
//
// The Vatican serves IIIF Presentation 2 with `Access-Control-Allow-Origin: *`,
// so Mirador loads their manifest straight from digi.vatlib.it in the browser:
// the scans stay authoritative and the Vatican remains the host of record. The
// metadata is snapshotted locally, so nothing is fetched server-side here.

import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Merriweather } from "next/font/google";

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import CollectionPermalink from "@/components/CollectionPermalink";
import BorgiaViewer from "./BorgiaViewer";
import BorgiaMetadata from "./BorgiaMetadata";
import { Separator } from "@/components/ui/separator";
import {
  BORGIA_COLLECTION_SLUG,
  formatPageCount,
  getBorgiaByItemId,
  getBorgiaEntries,
  getBorgiaText,
} from "@/lib/vatican-borgia";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export async function generateMetadata({
  params: { locale, itemid },
}: {
  params: { locale: string; itemid: string };
}): Promise<Metadata> {
  const entry = getBorgiaByItemId(itemid);
  if (!entry) return { title: "Manuscript | Digitizing Việt Nam" };

  const { title, summary } = getBorgiaText(entry, locale);
  return {
    title: `${title} | Digitizing Việt Nam`,
    description: summary?.slice(0, 200) || undefined,
  };
}

/** 41 items — cheap to prerender, and it puts them in the build output. */
export function generateStaticParams() {
  return getBorgiaEntries().map((entry) => ({ itemid: entry.itemId }));
}

export default async function BorgiaItemPage({
  params: { locale, itemid },
}: {
  params: { locale: string; itemid: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();
  const vi = locale === "vi";

  const entry = getBorgiaByItemId(itemid);

  const collectionTitle = vi
    ? "Thủ bản và Ấn phẩm Công giáo Việt Nam thời kỳ đầu"
    : "Vietnamese Catholic Manuscripts and Early Printed Works";

  const breadcrumbBase = [
    { label: t("NavigationBar.our-collections"), href: "our-collections" },
    {
      label: collectionTitle,
      href: `our-collections/${BORGIA_COLLECTION_SLUG}`,
    },
  ];

  if (!entry) {
    return (
      <div className="flex flex-col items-center max-width">
        <div className="w-full mb-20">
          <BreadcrumbAndSearchBar locale={locale} breadcrumbItems={breadcrumbBase} />
          <div className="mt-10 text-branding-black">
            {t("HanNomCollection.item-not-found")}
          </div>
        </div>
      </div>
    );
  }

  // Until DVN catalogues a volume, the heading is its shelfmark — which is all
  // the Vatican itself shows for it.
  const { title, summary, isCatalogued, isVietnameseFallback } = getBorgiaText(
    entry,
    locale
  );

  return (
    <div className="flex flex-col w-full items-center">
      {/* digi.vatlib.it takes ~3.7s to negotiate TLS; once the connection is up
          it answers in ~150ms. Opening it while the page is still parsing,
          rather than when Mirador asks for the manifest, takes that handshake
          off the critical path.

          Both variants are needed and they are not interchangeable: the browser
          keys its connection pool on credentials mode, so the crossorigin one
          warms the socket Mirador's manifest and info.json fetches use, and the
          plain one warms the socket OpenSeadragon's tile <img> elements use.
          React hoists both into <head>. */}
      <link rel="preconnect" href="https://digi.vatlib.it" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://digi.vatlib.it" />

      <div className="flex-col mb-20 w-full">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[...breadcrumbBase, { label: title }]}
        />

        <h1
          className={`${merriweather.className} text-branding-black text-4xl max-w-5xl`}
        >
          {title}
        </h1>
        <p className="text-base text-[#777777] mt-2">
          {[
            isCatalogued ? entry.shelfmark : "",
            formatPageCount(entry.pageCount, locale),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {summary && (
          <div className="mt-4 max-w-5xl">
            {/* DVN catalogued this fond in Vietnamese. Showing that to an
                English reader beats a blank page, but it should say so rather
                than let them wonder why the page changed language. */}
            {isVietnameseFallback && (
              <p className="max-w-5xl text-branding-black text-base font-light font-['Helvetica Neue'] leading-relaxed italic">
                Description in Vietnamese; an English translation is in progress.
              </p>
            )}
            <p className="mt-2 text-base text-branding-black font-light font-['Helvetica Neue'] leading-relaxed">
              {summary}
            </p>
          </div>
        )}

        <CollectionPermalink />

        <div className="mt-8">
          <Separator />
        </div>

        {/* `relative` is load-bearing: Mirador's root is absolutely positioned,
            so without a positioned ancestor it anchors to the viewport and
            covers the whole page. The other item pages do the same. */}
        <div className="flex flex-row mt-10">
          <div className="w-full relative">
            <BorgiaViewer manifestUrl={entry.manifestUrl} />
          </div>
        </div>

        <div className="mt-8">
          <Separator />
        </div>

        <BorgiaMetadata entry={entry} locale={locale} />
      </div>
    </div>
  );
}
