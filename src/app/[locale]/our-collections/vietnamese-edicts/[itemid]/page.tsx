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
import { Merriweather } from "next/font/google";
import localFont from "next/font/local";

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import CollectionPermalink from "@/components/CollectionPermalink";
import MiradorViewer from "@/components/mirador/MiradorViewer";
import { Separator } from "@/components/ui/separator";
import {
  EDICTS_COLLECTION_SLUG,
  EDICTS_REPOSITORY,
  getEdictByRecord,
  getEdictEntries,
  getEdictText,
} from "../_data";
import EdictMetadata from "../_components/EdictMetadata";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export async function generateMetadata({
  params: { locale, itemid },
}: {
  params: { locale: string; itemid: string };
}): Promise<Metadata> {
  const entry = getEdictByRecord(itemid);
  if (!entry) return { title: "Document | Digitizing Việt Nam" };

  // Search results and shared links should read in the page's own language.
  const { title, description } = getEdictText(entry, locale);
  return {
    title: `${title} | Digitizing Việt Nam`,
    description: description?.slice(0, 200),
  };
}

/** 32 items — cheap to prerender, and it puts them in the build output. */
export function generateStaticParams() {
  return ["en", "vi"].flatMap((locale) =>
    getEdictEntries().map((entry) => ({
      locale,
      itemid: String(entry.dmrecord),
    }))
  );
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
              {
                label: t("NavigationBar.our-collections"),
                href: "our-collections",
              },
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

  // PSU catalogues in English only; on the Vietnamese site the heading and
  // scope note are DVN's translations. See src/lib/pennstate-edicts-vi.ts.
  const { title, description } = getEdictText(entry, locale);

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex-col mb-20 w-full">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[
            {
              label: t("NavigationBar.our-collections"),
              href: "our-collections",
            },
            {
              label: collectionTitle,
              href: `our-collections/${EDICTS_COLLECTION_SLUG}`,
            },
            { label: title },
          ]}
        />
        <h1
          className={`${merriweather.className} text-branding-black text-4xl max-w-5xl`}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-5xl text-branding-black text-base font-light font-['Helvetica Neue'] leading-relaxed">
            {description}
          </p>
        )}

        <CollectionPermalink />

        <div className="mt-8">
          <Separator />
        </div>

        {/* `relative` is load-bearing: Mirador's root is absolutely positioned,
            so without a positioned ancestor it anchors to the viewport and
            covers the whole page. The han-nom item page does the same. */}
        <div className="flex flex-row mt-10">
          <div className="w-full relative">
            <MiradorViewer manifestUrl={entry.manifestUrl} canvasId="" />
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
              <p className="mt-3 max-w-5xl text-branding-black text-base font-light font-['Helvetica Neue'] leading-relaxed whitespace-pre-wrap">
                {entry.transcriptNotes}
              </p>
            )}
            <p className="mt-3 max-w-5xl text-branding-black text-base font-light font-['Helvetica Neue'] leading-relaxed">
              {vi
                ? `Phiên bản do ${EDICTS_REPOSITORY.label} cung cấp.`
                : `Transcript provided by ${EDICTS_REPOSITORY.label}.`}
            </p>
          </section>
        )}

        <div className="mt-8">
          <Separator />
        </div>

        <EdictMetadata entry={entry} locale={locale} />
      </div>
    </div>
  );
}
