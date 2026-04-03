import { setRequestLocale } from "next-intl/server";
import qs from "qs";
import { fetcher } from "@/lib/api";
import { getIndex } from "@/lib/ocr-store";
import AdminOCRClient from "./AdminOCRClient";

export const dynamic = "force-dynamic";

export default async function AdminOCRPage({
  params,
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);

  // Fetch all collection items from Strapi
  let allItems: any[] = [];
  try {
    const queryParams = {
      fields: ["title", "slug"],
      populate: ["collections"],
      locale: params.locale,
      "pagination[pageSize]": 100,
    };
    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/collection-items?${qs.stringify(
      queryParams
    )}`;
    const data = await fetcher(url, { next: { revalidate: 60 } });
    allItems = data?.data ?? [];
  } catch (e) {
    // continue with empty list
  }

  // Read OCR index
  const ocrIndex = await getIndex();

  const docs = allItems.map((item: any) => {
    const collectionSlug = item.collections?.[0]?.slug ?? "";
    const ocrEntry = ocrIndex[item.slug] ?? null;
    return {
      slug: item.slug,
      title: item.title,
      collectionSlug,
      ocrStatus: ocrEntry?.status ?? "none",
      pageCount: ocrEntry?.pageCount ?? 0,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Admin — OCR Pipeline</h1>
      <p className="text-sm text-gray-500 mb-6">
        Upload PDFs and run OCR to populate the Reading Workshop transcription layer.
        Data is saved locally in <code className="text-xs bg-gray-100 px-1 rounded">data/ocr/</code>.
      </p>
      <AdminOCRClient docs={docs} locale={params.locale} />
    </div>
  );
}
