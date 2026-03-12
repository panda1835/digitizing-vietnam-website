import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("ResearchHub.hubs.vietnam-war.title")} | Digitizing Việt Nam`,
  };
}

export default async function VietnamWarResearchPage({
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
          title={t("ResearchHub.hubs.vietnam-war.title")}
          subtitle={t("ResearchHub.hubs.vietnam-war.description")}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            { label: t("ResearchHub.hubs.vietnam-war.title") },
          ]}
          locale={locale}
        />

        <div className="mt-10">
          <p className="font-['Helvetica Neue'] font-light text-base text-muted-foreground">
            {locale === "vi"
              ? "Nội dung đang được cập nhật."
              : "Content is coming soon."}
          </p>
        </div>
      </div>
    </div>
  );
}
