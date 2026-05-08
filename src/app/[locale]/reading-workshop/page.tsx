import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import { Merriweather } from "next/font/google";

import { getIndex, getPagesWithTextCounts, getCorpusStats, OcrIndexEntry } from "@/lib/ocr-store";
import { getHanNomManifestEntries, HanNomManifestEntry } from "@/lib/han-nom-collection";
import WorkshopHubClient from "./WorkshopHubClient";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Text Lab | Digitizing Việt Nam" };
}

// Known documents with existing searchable text
const KNOWN_TEXT_DOCS = [
  { slug: "truyen-kieu-1866", title: "Truyện Kiều (1866)", collection: "truyen-kieu" },
  { slug: "truyen-kieu-1870", title: "Truyện Kiều (1870)", collection: "truyen-kieu" },
  { slug: "truyen-kieu-1871", title: "Truyện Kiều (1871)", collection: "truyen-kieu" },
  { slug: "truyen-kieu-1872", title: "Truyện Kiều (1872)", collection: "truyen-kieu" },
  { slug: "truyen-kieu-1902", title: "Truyện Kiều (1902)", collection: "truyen-kieu" },
  { slug: "van-tien-co-tich-tan-truyen", title: "Lục Vân Tiên", collection: "luc-van-tien" },
  { slug: "chinh-phu-ngam-khuc", title: "Chinh Phụ Ngâm Khúc", collection: "chinh-phu-ngam-khuc" },
];

export default async function ReadingWorkshopHubPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);

  const [ocrIndex, pagesWithTextCounts, corpusStats] = await Promise.all([
    getIndex(),
    getPagesWithTextCounts(),
    getCorpusStats(),
  ]);
  const hanNomEntries = getHanNomManifestEntries();

  // Mark which Han-Nom items are already in the OCR index
  const queuedItemIds = new Set<string>();
  for (const [, entry] of Object.entries(ocrIndex)) {
    if (entry.itemId) queuedItemIds.add(entry.itemId);
  }

  // Compute stats
  const ocrDocs = Object.values(ocrIndex).filter(
    (e) => e.status === "partial" || e.status === "complete" || e.status === "corrected"
  );
  const totalTexts = ocrDocs.length;
  const totalPages = ocrDocs.reduce((sum, e) => sum + e.pageCount, 0);
  const totalPagesWithText = Object.values(pagesWithTextCounts).reduce((sum, n) => sum + n, 0);

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className={`${merriweather.className} text-[32px] text-branding-black`}>
          Text Lab
        </h1>
        <p className="text-base text-branding-black/60 font-light mt-2">
          Browse documents, manage OCR processing, and open the reading workshop.
        </p>
        <div className="flex items-center gap-6 mt-3">
          <span className="text-sm text-branding-black/50 font-light">
            <span className="font-medium text-branding-black/70">{totalTexts}</span> texts
          </span>
          <span className="text-sm text-branding-black/50 font-light">
            <span className="font-medium text-branding-black/70">{totalPagesWithText.toLocaleString()}</span> / {totalPages.toLocaleString()} pages with text
          </span>
          {corpusStats?.overallAvgConfidence != null && (() => {
            const avg = corpusStats.overallAvgConfidence;
            const cls =
              avg >= 0.9 ? "text-emerald-600" : avg >= 0.75 ? "text-amber-600" : "text-red-600";
            return (
              <span
                className="text-sm text-branding-black/50 font-light"
                title={`Weighted across ${corpusStats.totalCharCount.toLocaleString()} OCR'd characters in ${corpusStats.docsWithConfidence} docs`}
              >
                Avg OCR: <span className={`font-medium tabular-nums ${cls}`}>{Math.round(avg * 100)}%</span>
              </span>
            );
          })()}
        </div>
      </div>

      <WorkshopHubClient
        locale={locale}
        knownDocs={KNOWN_TEXT_DOCS}
        ocrIndex={ocrIndex}
        hanNomEntries={hanNomEntries}
        queuedItemIds={Array.from(queuedItemIds)}
        pagesWithText={pagesWithTextCounts}
      />
    </div>
  );
}
