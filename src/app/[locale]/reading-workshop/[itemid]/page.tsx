import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import Link from "next/link";
import { Merriweather } from "next/font/google";
import dynamic from "next/dynamic";

import { getIndex } from "@/lib/ocr-store";
import { getHanNomManifestEntryByItemId } from "@/lib/han-nom-collection";
import ReadingWorkshop from "@/app/[locale]/our-collections/[collectionid]/[documentid]/reading-workshop/ReadingWorkshop";

const OCREditor = dynamic(() => import("@/components/ocr-editor/OCREditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      Loading OCR editor…
    </div>
  ),
});

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export async function generateMetadata({
  params,
}: {
  params: { itemid: string };
}): Promise<Metadata> {
  // Try Han-Nom entry first, then OCR index
  const entry = getHanNomManifestEntryByItemId(params.itemid);
  if (entry) {
    return { title: `${entry.title} — Text Lab | Digitizing Việt Nam` };
  }
  const index = await getIndex();
  const ocrEntry = index[params.itemid];
  const title = ocrEntry?.title ?? params.itemid;
  return { title: `${title} — Text Lab | Digitizing Việt Nam` };
}

export default async function WorkshopPage({
  params,
  searchParams,
}: {
  params: { locale: string; itemid: string };
  searchParams?: { page?: string };
}) {
  const { locale, itemid } = params;
  setRequestLocale(locale);

  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);

  // ── Path 1: Han-Nom collection item (has IIIF manifest) ──
  const hanNomEntry = getHanNomManifestEntryByItemId(itemid);
  if (hanNomEntry) {
    const slug = `han-nom-${itemid}`;
    const index = await getIndex();
    const ocrEntry = index[slug] ?? null;
    const manifestUrl = hanNomEntry.manifestUrl;
    const pageCount = ocrEntry?.pageCount ?? 0;
    const ocrStatus = ocrEntry?.status ?? "none";

    return (
      <div className="relative left-1/2 -ml-[45vw] w-[90vw]">
        <div className="px-5 py-3 flex items-center gap-4 border-b border-[#e1e1de] bg-branding-white">
          <Link
            href={`/${locale}/reading-workshop`}
            className="text-xs text-branding-brown hover:underline whitespace-nowrap font-light"
          >
            ← Back to lab
          </Link>
          <div className="h-4 w-px bg-[#e1e1de]" />
          <h1 className={`${merriweather.className} text-base text-branding-black truncate`}>
            {hanNomEntry.title}
          </h1>
          <span className="text-xs text-branding-brown/60 whitespace-nowrap font-light">Text Lab</span>
        </div>
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

  // ── Path 2: OCR-indexed document (PDF upload or other) ──
  const index = await getIndex();
  const ocrEntry = index[itemid];

  if (!ocrEntry) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <p className="text-branding-black/50 font-light">Document not found.</p>
        <Link href={`/${locale}/reading-workshop`} className="text-branding-brown hover:underline text-sm mt-4 inline-block">
          ← Back to Text Lab
        </Link>
      </div>
    );
  }

  const title = ocrEntry.title ?? itemid;
  const pageCount = ocrEntry.pageCount ?? 0;

  // If the OCR entry has a manifest URL, use the full ReadingWorkshop
  if (ocrEntry.manifestUrl) {
    return (
      <div className="relative left-1/2 -ml-[45vw] w-[90vw]">
        <div className="px-5 py-3 flex items-center gap-4 border-b border-[#e1e1de] bg-branding-white">
          <Link
            href={`/${locale}/reading-workshop`}
            className="text-xs text-branding-brown hover:underline whitespace-nowrap font-light"
          >
            ← Back to lab
          </Link>
          <div className="h-4 w-px bg-[#e1e1de]" />
          <h1 className={`${merriweather.className} text-base text-branding-black truncate`}>
            {title}
          </h1>
          <span className="text-xs text-branding-brown/60 whitespace-nowrap font-light">Text Lab</span>
        </div>
        <ReadingWorkshop
          manifestUrl={ocrEntry.manifestUrl}
          documentSlug={itemid}
          collectionSlug={ocrEntry.collectionSlug ?? "uploads"}
          documentTitle={title}
          ocrStatus={ocrEntry.status}
          pageCount={pageCount}
          initialPage={page}
        />
      </div>
    );
  }

  // PDF-source document: render OCREditor directly (uses /api/ocr/page-image fallback)
  return (
    <div className="relative left-1/2 -ml-[45vw] w-[90vw]">
      <div className="px-5 py-3 flex items-center gap-4 border-b border-[#e1e1de] bg-branding-white">
        <Link
          href={`/${locale}/reading-workshop`}
          className="text-xs text-branding-brown hover:underline whitespace-nowrap font-light"
        >
          ← Back to lab
        </Link>
        <div className="h-4 w-px bg-[#e1e1de]" />
        <h1 className={`${merriweather.className} text-base text-branding-black truncate`}>
          {title}
        </h1>
        <span className="text-xs text-branding-brown/60 whitespace-nowrap font-light">Text Lab</span>
      </div>
      <div style={{ height: "calc(100vh - 141px)" }}>
        <OCREditor
          slug={itemid}
          initialPage={page}
          pageCount={pageCount}
        />
      </div>
    </div>
  );
}
