import { setRequestLocale } from "next-intl/server";
import PipelineClient from "./PipelineClient";

export const dynamic = "force-dynamic";

export default async function PipelinePage({
  params,
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        OCR Pipeline
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Batch-process queued documents through Kandianguji OCR. Monitor progress and API usage.
      </p>
      <PipelineClient locale={params.locale} />
    </div>
  );
}
