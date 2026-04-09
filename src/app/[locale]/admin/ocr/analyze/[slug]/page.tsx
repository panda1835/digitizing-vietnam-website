import { setRequestLocale } from "next-intl/server";
import AnalyzeClient from "./AnalyzeClient";

export const dynamic = "force-dynamic";

export default async function AnalyzePage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(params.locale);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <AnalyzeClient slug={params.slug} locale={params.locale} />
    </div>
  );
}
