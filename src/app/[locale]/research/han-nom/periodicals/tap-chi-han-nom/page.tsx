import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/PageHeader";
import CatalogBrowser from "./_components/CatalogBrowser";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("TchnCatalog.title")} | Digitizing Việt Nam`,
    description: t("TchnCatalog.description"),
  };
}

export default async function TchnCatalogPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("TchnCatalog.title")}
          subtitle={t("TchnCatalog.description")}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            {
              label: t("ResearchHub.HanNomHub.hero.title"),
              href: "/research/han-nom",
            },
            {
              label: t("Periodicals.title"),
              href: "/research/han-nom/periodicals",
            },
            { label: t("TchnCatalog.title") },
          ]}
          locale={locale}
        />

        <div className="mt-10">
          <CatalogBrowser locale={locale} />
        </div>

        <div className="mt-12 border-t border-neutral-200 pt-6 text-sm text-neutral-600 max-w-3xl">
          <p>{t("TchnCatalog.provenance")}</p>
          <p className="mt-3">{t("TchnCatalog.caveats")}</p>
        </div>
      </div>
    </div>
  );
}
