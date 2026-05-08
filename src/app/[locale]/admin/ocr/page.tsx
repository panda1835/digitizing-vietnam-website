import { setRequestLocale } from "next-intl/server";
import Link from "next/link";

export default function OcrToolboxIndex({
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
        <span>Hán-Nôm OCR Toolbox</span>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Hán-Nôm OCR Toolbox
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Test OCR on a single image, import existing OCR data, or edit
        previously-imported documents.
      </p>
      <ul className="space-y-4 text-sm">
        <li>
          <Link
            href={`/${params.locale}/admin/ocr/test`}
            className="text-indigo-600 hover:underline font-medium"
          >
            Single-Page OCR Tester →
          </Link>
          <p className="text-gray-500 mt-0.5">
            Upload one image, run OCR, correct columns and characters, export
            as plain text or training data.
          </p>
        </li>
        <li>
          <Link
            href={`/${params.locale}/admin/ocr/import`}
            className="text-indigo-600 hover:underline font-medium"
          >
            Import OCR Data →
          </Link>
          <p className="text-gray-500 mt-0.5">
            Upload a zipped folder of pages + JSON from the Nôm OCR Training
            tool, or supply a IIIF manifest URL with JSON-only data.
          </p>
        </li>
        <li>
          <Link
            href={`/${params.locale}/admin/ocr/edit`}
            className="text-indigo-600 hover:underline font-medium"
          >
            Edit Documents →
          </Link>
          <p className="text-gray-500 mt-0.5">
            Browse imported documents and correct columns / characters per
            page.
          </p>
        </li>
      </ul>
    </div>
  );
}
