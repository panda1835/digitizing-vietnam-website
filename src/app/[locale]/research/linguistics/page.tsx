import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("ResearchHub.hubs.linguistics.title")} | Digitizing Việt Nam`,
  };
}

export default async function LinguisticsResearchPage({
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
          title={t("ResearchHub.hubs.linguistics.title")}
          subtitle={t("ResearchHub.hubs.linguistics.description")}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            { label: t("ResearchHub.hubs.linguistics.title") },
          ]}
          locale={locale}
        />

        <div className="mt-10 rounded-lg border bg-branding-gray p-8">
          <p className="font-['Helvetica Neue'] font-light text-base text-branding-black">
            {locale === "vi" ? "Nội dung đang được cập nhật." : "Content is coming soon."}
          </p>
        </div>
      </div>
    </div>
  );
}

