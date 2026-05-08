import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import TesterClient from "./TesterClient";

export const dynamic = "force-dynamic";

export default function OcrTesterPage({
  params,
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  return (
    <div className="px-6 py-6">
      <div className="text-xs text-gray-500 mb-2">
        <Link href={`/${params.locale}/admin`} className="hover:underline">
          Admin
        </Link>
        <span className="mx-1">/</span>
        <Link
          href={`/${params.locale}/admin/ocr`}
          className="hover:underline"
        >
          OCR Toolbox
        </Link>
        <span className="mx-1">/</span>
        <span>Single-Page Tester</span>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        Single-Page OCR Tester
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Upload one page image, run OCR, correct columns and characters,
        then export as plain text or training data.
      </p>
      <TesterClient />
    </div>
  );
}
