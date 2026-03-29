import { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/common/PageHeader";
import DateCalculatorClient from "./DateCalculatorClient";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ResearchHub.HanNomHub.DateConverter");
  return {
    title: `${t("title")} | Digitizing Việt Nam`,
    description: t("subtitle"),
  };
}

export default async function DateConverterPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="flex flex-col items-center max-width w-full">
      <div className="w-full mb-20">
        <PageHeader
          title={t("ResearchHub.HanNomHub.DateConverter.title")}
          subtitle={t("ResearchHub.HanNomHub.DateConverter.subtitle")}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            { label: t("ResearchHub.HanNomHub.hero.title"), href: "/research/han-nom" },
            { label: t("ResearchHub.HanNomHub.DateConverter.title") },
          ]}
          locale={locale}
        />

        <div className="mt-10 max-w-4xl">
          <DateCalculatorClient />
        </div>
      </div>
    </div>
  );
}
