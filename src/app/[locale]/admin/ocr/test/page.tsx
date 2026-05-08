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
    // Stay within the public-host layout's max-w-7xl wrap so the upload
    // form doesn't sprawl across the viewport. TesterClient widens to
    // full viewport itself when it enters the columns / editing phases
    // where the editor really does need the room.
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
        <span>Single-Page Tester</span>
      </div>
      <h1 className="text-lg font-semibold text-gray-900 mb-3">
        Single-Page OCR Tester
      </h1>
      <TesterClient />
    </div>
  );
}
