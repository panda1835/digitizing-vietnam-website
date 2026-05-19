import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { getManifest, getPage } from "@/lib/ocr-store-supabase";
import EditorClient from "./EditorClient";

export const dynamic = "force-dynamic";

export default async function EditPage({
  params,
}: {
  params: { locale: string; slug: string; page: string };
}) {
  setRequestLocale(params.locale);
  const slug = decodeURIComponent(params.slug);
  const pageNum = parseInt(params.page, 10);
  if (!pageNum || pageNum < 1) notFound();

  const manifest = await getManifest(slug);
  if (!manifest) notFound();
  if (pageNum > manifest.pageCount) notFound();

  const pageData = await getPage(slug, pageNum);
  if (!pageData) notFound();

  return (
    <div className="px-2 py-4">
      <div className="text-xs text-gray-500 mb-1">
        <Link href={`/${params.locale}/admin`} className="hover:underline">
          Admin
        </Link>
        <span className="mx-1">/</span>
        <Link
          href={`/${params.locale}/admin/ocr`}
          className="hover:underline"
        >
          Hán-Nôm OCR Toolbox
        </Link>
        <span className="mx-1">/</span>
        <Link
          href={`/${params.locale}/admin/ocr/edit`}
          className="hover:underline"
        >
          Edit Documents
        </Link>
        <span className="mx-1">/</span>
        <Link
          href={`/${params.locale}/admin/ocr/edit/${encodeURIComponent(
            slug
          )}`}
          className="hover:underline"
        >
          {manifest.title}
        </Link>
        <span className="mx-1">/</span>
        <span className="truncate">page {pageNum}</span>
      </div>
      <h1 className="text-lg font-semibold text-gray-900 mb-3">
        {manifest.title}
        <span className="ml-2 text-sm font-normal text-gray-500">
          page {pageNum} of {manifest.pageCount}
        </span>
      </h1>
      <div className="h-[calc(100vh-200px)] flex flex-col">
        <EditorClient
          slug={slug}
          page={pageNum}
          pageCount={manifest.pageCount}
          initialPageData={pageData}
          imageUrl={`/api/admin/ocr/page-image/${encodeURIComponent(
            slug
          )}/${pageNum}`}
          locale={params.locale}
        />
      </div>
    </div>
  );
}
