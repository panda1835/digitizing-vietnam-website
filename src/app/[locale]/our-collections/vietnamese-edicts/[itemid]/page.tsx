// src/app/[locale]/our-collections/vietnamese-edicts/[itemid]/page.tsx
//
// Item page for one Penn State edict.
//
// A sibling static folder like this takes routing precedence over
// [collectionid]/[documentid], which is how han-nom-collection/[itemid] works.
//
// Unlike that page, this one does NOT parse the IIIF manifest server-side.
// Columbia serves IIIF Presentation 3 (`label.en[0]`); Penn State serves
// Presentation 2, so that parsing would not apply — and since the metadata is
// already snapshotted locally there is nothing to gain by fetching it at
// request time. Mirador still loads PSU's manifest directly in the browser, so
// the scans stay authoritative and PSU remains the host of record.

import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import localFont from "next/font/local";

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import CollectionPermalink from "@/components/CollectionPermalink";
import EdictViewer from "./EdictViewer";
import { Separator } from "@/components/ui/separator";
import {
  EDICTS_COLLECTION_SLUG,
  EDICTS_REPOSITORY,
  getEdictByRecord,
  getEdictEntries,
} from "@/lib/pennstate-edicts";
import EdictMetadata from "./EdictMetadata";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export async function generateMetadata({
  params: { itemid },
}: {
  params: { itemid: string };
}): Promise<Metadata> {
  const entry = getEdictByRecord(itemid);
  return {
    title: `${entry?.title ?? "Document"} | Digitizing Việt Nam`,
    description: entry?.description?.slice(0, 200),
  };
}

/** 32 items — cheap to prerender, and it puts them in the build output. */
export function generateStaticParams() {
  return getEdictEntries().map((entry) => ({ itemid: String(entry.dmrecord) }));
}

export default async function EdictItemPage({
  params: { locale, itemid },
}: {
  params: { locale: string; itemid: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();
  const vi = locale === "vi";

  const entry = getEdictByRecord(itemid);

  const collectionTitle = vi
    ? "Sắc phong và Văn bản Hành chính Việt Nam"
    : "Vietnamese Edicts and Official Documents";

  if (!entry) {
    return (
      <div className="flex flex-col items-center max-width">
        <div className="w-full mb-20">
          <BreadcrumbAndSearchBar
            locale={locale}
            breadcrumbItems={[
              { label: t("NavigationBar.our-collections"), href: "our-collections" },
              {
                label: collectionTitle,
                href: `our-collections/${EDICTS_COLLECTION_SLUG}`,
              },
            ]}
          />
          <div className="mt-10 text-branding-black">
            {t("HanNomCollection.item-not-found")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-width">
      <div className="w-full mb-20">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[
            { label: t("NavigationBar.our-collections"), href: "our-collections" },
            {
              label: collectionTitle,
              href: `our-collections/${EDICTS_COLLECTION_SLUG}`,
            },
            { label: entry.title },
          ]}
        />

        <h1 className="font-['Helvetica Neue'] text-branding-black text-[32px] mt-6 leading-tight">
          {entry.title}
        </h1>
        <p className="text-base text-[#777777] mt-2">
          {[entry.dynasty ? `${entry.dynasty} dynasty` : "", entry.date, entry.container]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="mt-4">
          <CollectionPermalink />
        </div>

        {/* `relative` is load-bearing: Mirador's root is absolutely positioned,
            so without a positioned ancestor it anchors to the viewport and
            covers the whole page. The han-nom item page does the same. */}
        <div className="mt-8 flex flex-row">
          <div className="w-full relative">
            <EdictViewer manifestUrl={entry.manifestUrl} />
          </div>
        </div>

        {/* The transcript is what DVN adds over PSU's own interface: the text
            written on the document, rendered in the Hán-Nôm face and indexed by
            the collection search. */}
        {entry.transcript && (
          <section className="mt-12">
            <h2 className="font-['Helvetica Neue'] text-2xl text-branding-black">
              {vi ? "Phiên bản chữ Hán" : "Hán transcript"}
            </h2>
            <div
              className={`${NomNaTong.className} mt-4 rounded-md border border-branding-brown/15 bg-white p-6 text-2xl leading-[2] text-branding-black whitespace-pre-wrap`}
            >
              {entry.transcript}
            </div>
            {entry.transcriptNotes && (
              <p className="mt-3 text-sm text-[#777777] whitespace-pre-wrap">
                {entry.transcriptNotes}
              </p>
            )}
            <p className="mt-2 text-xs text-[#777777]">
              {vi
                ? `Phiên bản do ${EDICTS_REPOSITORY.label} cung cấp.`
                : `Transcript provided by ${EDICTS_REPOSITORY.label}.`}
            </p>
          </section>
        )}

        <Separator className="mt-12" />

        <EdictMetadata entry={entry} locale={locale} />
      </div>
    </div>
  );
}
