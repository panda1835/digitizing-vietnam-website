import { setRequestLocale } from "next-intl/server";
import Link from "next/link";

export default function AdminIndex({
  params,
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Admin</h1>
      <p className="text-sm text-gray-500 mb-8">
        Internal tools. More sections will land here as we build them out.
      </p>
      <ul className="space-y-3 text-sm">
        <li>
          <Link
            href={`/${params.locale}/admin/ocr`}
            className="text-indigo-600 hover:underline"
          >
            OCR Toolbox →
          </Link>
          <span className="ml-2 text-gray-500">
            Single-page tester, importer, and per-doc editor.
          </span>
        </li>
      </ul>
    </div>
  );
}
