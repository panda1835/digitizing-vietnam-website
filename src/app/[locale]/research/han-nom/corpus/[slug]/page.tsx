import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/PageHeader";
import { getSource } from "@/lib/corpus/local-store";
import CorpusReader from "../_components/CorpusReader";

export async function generateMetadata({
  params: { slug },
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const source = getSource(slug);
  return {
    title: `${source?.title ?? "Source"} | Digitizing Việt Nam`,
  };
}

export default async function CorpusSourcePage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();
  const vi = locale === "vi";

  const source = getSource(slug);
  if (!source) notFound();

  const corpusTitle = vi ? "Kho nghiên cứu thứ cấp" : "Secondary Source Corpus";

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={source.title}
          subtitle={
            [source.author, source.year].filter(Boolean).join(" · ") +
            (source.pageCount
              ? ` · ${source.pageCount} ${vi ? "trang quét" : "scanned pages"}`
              : "")
          }
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "research" },
            { label: t("ResearchHub.HanNomHub.hero.title"), href: "research/han-nom" },
            { label: corpusTitle, href: "research/han-nom/corpus" },
            { label: source.title },
          ]}
          locale={locale}
        />

        <main className="mt-10">
          {/* CorpusReader reads ?page/&s/&e/&q via useSearchParams. */}
          <Suspense fallback={<div className="text-sm text-muted-foreground">…</div>}>
            <CorpusReader slug={slug} locale={locale} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
