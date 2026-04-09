import { setRequestLocale } from "next-intl/server";
import qs from "qs";
import Link from "next/link";
import { Metadata } from "next";

import { fetcher } from "@/lib/api";
import { getIndex } from "@/lib/ocr-store";
import { Merriweather } from "next/font/google";
import ReadingWorkshop from "./ReadingWorkshop";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export async function generateMetadata(): Promise<Metadata> {
  return { title: `Text Lab | Digitizing Việt Nam` };
}

// ---------------------------------------------------------------------------
// Known text sources — documents that have existing XML-based text content.
// Maps document slug patterns to fetcher functions.
// Each returns { text: string, pageCount: number } for the given page.
// ---------------------------------------------------------------------------

const TRUYEN_KIEU_VERSIONS: Record<string, string> = {
  "truyen-kieu-1866": "1866",
  "truyen-kieu-1870": "1870",
  "truyen-kieu-1871": "1871",
  "truyen-kieu-1872": "1872",
  "truyen-kieu-1902": "1902",
};

// Known page counts for documents without a dynamic count endpoint
const KNOWN_PAGE_COUNTS: Record<string, number> = {
  "van-tien-co-tich-tan-truyen": 104,
  "chinh-phu-ngam-khuc": 64,
};

async function fetchExistingText(
  documentid: string,
  page: number
): Promise<{ text: string; pageCount: number } | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  // Truyện Kiều (all versions)
  const kieuVersion = TRUYEN_KIEU_VERSIONS[documentid];
  if (kieuVersion) {
    try {
      const res = await fetch(
        `${apiBase}/searchable-text/truyen-kieu?version=${kieuVersion}&page=${page}`,
        { cache: "force-cache" }
      );
      if (!res.ok) return null;
      const { count } = await res.json();
      return { text: "", pageCount: count };
    } catch {
      return null;
    }
  }

  // Lục Vân Tiên
  if (documentid === "van-tien-co-tich-tan-truyen") {
    return { text: "", pageCount: KNOWN_PAGE_COUNTS[documentid] };
  }

  // Chinh Phụ Ngâm Khúc
  if (documentid === "chinh-phu-ngam-khuc") {
    return { text: "", pageCount: KNOWN_PAGE_COUNTS[documentid] };
  }

  return null;
}

// ---------------------------------------------------------------------------

export default async function ReadingWorkshopPage({
  params,
  searchParams,
}: {
  params: { locale: string; collectionid: string; documentid: string };
  searchParams?: { page?: string; canvasId?: string };
}) {
  const { locale, collectionid, documentid } = params;
  setRequestLocale(locale);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);

  // Fetch collection item from Strapi
  let collectionItemData: any = null;
  let collectionTitle = "";
  try {
    const queryParams = {
      fields: ["title", "abstract"],
      "filters[slug][$eq]": documentid,
      populate: ["collections"],
      locale,
    };
    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/collection-items?${qs.stringify(queryParams)}`;
    const data = await fetcher(url, { next: { revalidate: 60 * 30 } });
    collectionItemData = data?.data?.[0] ?? null;
    collectionTitle =
      collectionItemData?.collections?.find((c: any) => c.slug === collectionid)?.title ?? "";
  } catch {
    // proceed with empty data
  }

  // Fetch page count from existing text source (if any)
  const existingText = await fetchExistingText(documentid, page);

  // OCR index for status + page count fallback
  const index = await getIndex();
  const ocrEntry = index[documentid] ?? null;

  const rawManifestUrl = `${backendUrl}/get-manifest?item-slug=${documentid}&locale=${locale}`;
  // Route through our proxy to fix canvas sort order
  const manifestUrl = `/api/manifest?url=${encodeURIComponent(rawManifestUrl)}`;

  // Page count: prefer existing text source count, then OCR count
  const pageCount = existingText?.pageCount ?? ocrEntry?.pageCount ?? 0;
  const ocrStatus = ocrEntry?.status ?? "none";

  return (
    <div className="relative left-1/2 -ml-[45vw] w-[90vw]">
      {/* Title bar */}
      <div className="px-5 py-3 flex items-center gap-4 border-b border-[#e1e1de] bg-branding-white">
        <Link
          href={`/${locale}/our-collections/${collectionid}/${documentid}`}
          className="text-xs text-branding-brown hover:underline whitespace-nowrap font-light"
        >
          ← Back to document
        </Link>
        <div className="h-4 w-px bg-[#e1e1de]" />
        <h1 className={`${merriweather.className} text-base text-branding-black truncate`}>
          {collectionItemData?.title || documentid}
        </h1>
        <span className="text-xs text-branding-brown/60 whitespace-nowrap font-light">Text Lab</span>
      </div>

      {/* Workshop */}
      <ReadingWorkshop
        manifestUrl={manifestUrl}
        documentSlug={documentid}
        collectionSlug={collectionid}
        documentTitle={collectionItemData?.title || documentid}
        ocrStatus={ocrStatus}
        pageCount={pageCount}
        initialPage={page}
      />
    </div>
  );
}
