import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import OCRTestClient from "./OCRTestClient";

export default function OCRTestPage({
  params,
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);

  return (
    <div className="relative left-1/2 -ml-[40vw] w-[80vw] py-6">
      <div className="flex items-center gap-4 mb-4">
        <Link
          href={`/${params.locale}/reading-workshop`}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          ← Back to Reading Workshop
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">OCR Tester</h1>
      </div>

      <OCRTestClient />
    </div>
  );
}
