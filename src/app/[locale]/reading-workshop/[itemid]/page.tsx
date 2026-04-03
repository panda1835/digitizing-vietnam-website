import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import Link from "next/link";
import { Merriweather } from "next/font/google";

import { getIndex } from "@/lib/ocr-store";
import { getHanNomManifestEntryByItemId } from "@/lib/han-nom-collection";
import ReadingWorkshop from "@/app/[locale]/our-collections/[collectionid]/[documentid]/reading-workshop/ReadingWorkshop";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export async function generateMetadata({
  params,
}: {
  params: { itemid: string };
}): Promise<Metadata> {
  const entry = getHanNomManifestEntryByItemId(params.itemid);
  const title = entry?.title ?? params.itemid;
  return { title: `${title} — Reading Workshop | Digitizing Việt Nam` };
}

export default async function HanNomWorkshopPage({
  params,
  searchParams,
}: {
  params: { locale: string; itemid: string };
  searchParams?: { page?: string };
}) {
  const { locale, itemid } = params;
  setRequestLocale(locale);

  const hanNomEntry = getHanNomManifestEntryByItemId(itemid);
  if (!hanNomEntry) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <p className="text-branding-black/50 font-light">Item not found.</p>
        <Link href={`/${locale}/reading-workshop`} className="text-branding-brown hover:underline text-sm mt-4 inline-block">
          ← Back to Reading Workshop
        </Link>
      </div>
    );
  }

  const slug = `han-nom-${itemid}`;
  const index = await getIndex();
  const ocrEntry = index[slug] ?? null;
  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);

  // Use the Columbia IIIF manifest directly (no proxy needed — correctly ordered)
  const manifestUrl = hanNomEntry.manifestUrl;
  const pageCount = ocrEntry?.pageCount ?? 0;
  const ocrStatus = ocrEntry?.status ?? "none";

  return (
    <div className="relative left-1/2 -ml-[45vw] w-[90vw]">
      {/* Title bar */}
      <div className="px-5 py-3 flex items-center gap-4 border-b border-[#e1e1de] bg-branding-white">
        <Link
          href={`/${locale}/reading-workshop`}
          className="text-xs text-branding-brown hover:underline whitespace-nowrap font-light"
        >
          ← Back to hub
        </Link>
        <div className="h-4 w-px bg-[#e1e1de]" />
        <h1 className={`${merriweather.className} text-base text-branding-black truncate`}>
          {hanNomEntry.title}
        </h1>
        <span className="text-xs text-branding-brown/60 whitespace-nowrap font-light">Reading Workshop</span>
      </div>

      {/* Workshop */}
      <ReadingWorkshop
        manifestUrl={manifestUrl}
        documentSlug={slug}
        collectionSlug="han-nom-collection"
        documentTitle={hanNomEntry.title}
        ocrStatus={ocrStatus}
        pageCount={pageCount}
        initialPage={page}
      />
    </div>
  );
}
