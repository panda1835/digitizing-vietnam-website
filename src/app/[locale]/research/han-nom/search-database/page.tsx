import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/PageHeader";
import CorpusBrowser from "@/app/[locale]/research/han-nom/search-database/_components/CorpusBrowser";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("ResearchHub.HanNomHub.hero.title")} | Digitizing Việt Nam`,
  };
}

export default async function CorpusPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();
  const corpusTitle =
    locale === "vi" ? "Cơ sở dữ liệu Hán Nôm" : "Hán-Nôm Corpus Database";

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={corpusTitle}
          subtitle={locale === "vi" ? "Kho dữ liệu và tìm kiếm toàn văn Hán Nôm." : "Corpus browser and full-text search for Hán-Nôm materials."}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            { label: t("ResearchHub.HanNomHub.hero.title"), href: "/research/han-nom" },
            { label: corpusTitle },
          ]}
          locale={locale}
        />

        <main className="mt-10 min-h-screen bg-branding-gray/5">
          <CorpusBrowser />
        </main>
      </div>
    </div>
  );
}
