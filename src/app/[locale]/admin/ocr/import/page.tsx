import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import ImportClient from "./ImportClient";

export const dynamic = "force-dynamic";

export default function ImportPage({
  params,
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-xs text-gray-500 mb-2">
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
        <span>Import OCR Data</span>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Import OCR Data
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Bring an OCR&apos;d document into admin storage. Imports land at{" "}
        <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
          data/ocr/&lt;slug&gt;/
        </code>{" "}
        and become editable from the{" "}
        <Link
          href={`/${params.locale}/admin/ocr/edit`}
          className="text-indigo-600 hover:underline"
        >
          Edit Documents
        </Link>{" "}
        page.
      </p>
      <ImportClient locale={params.locale} />
    </div>
  );
}
