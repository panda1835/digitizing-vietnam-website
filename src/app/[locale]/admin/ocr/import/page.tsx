import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import ImportClient from "./ImportClient";
import ImportIiifClient from "./ImportIiifClient";

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
      <p className="text-sm text-gray-500 mb-8">
        Bring a document into the editor, then OCR &amp; correct it from the{" "}
        <Link
          href={`/${params.locale}/admin/ocr/edit`}
          className="text-indigo-600 hover:underline"
        >
          Edit Documents
        </Link>{" "}
        page.
      </p>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900">
          New document from IIIF manifest
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Self-originating: creates the document + blank pages in the
          Supabase <code className="text-xs bg-gray-100 rounded px-1 py-0.5">ocr</code>{" "}
          schema. Run OCR per page in the editor afterward.
        </p>
        <ImportIiifClient locale={params.locale} />
      </section>

      <section className="border-t border-gray-200 pt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Import pre-OCR&apos;d data (zip)
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Ingest an already-OCR&apos;d{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            data/documents/&lt;slug&gt;/
          </code>{" "}
          export from the Nôm OCR Training tool.{" "}
          <span className="text-amber-700">
            Note: this path still writes the local filesystem store, not
            Supabase.
          </span>
        </p>
        <ImportClient locale={params.locale} />
      </section>
    </div>
  );
}
