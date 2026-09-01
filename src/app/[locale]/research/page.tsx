import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { InfoCard } from "@/components/common/InfoCard";
import { MainToolsGrid } from "@/components/common/MainToolsGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("ResearchHub.title")} | Digitizing Việt Nam`,
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const ResearchPage = async ({ params: { locale } }) => {
  setRequestLocale(locale);
  const t = await getTranslations();

  const researchHubs = [
    {
      name: t("ResearchHub.hubs.han-nom.title"),
      description: t("ResearchHub.hubs.han-nom.description"),
      href: "/research/han-nom",
    },
    {
      name: t("ResearchHub.hubs.ca-dao.title"),
      description: t("ResearchHub.hubs.ca-dao.description"),
      href: "/research/ca-dao-tuc-ngu",
    },
    {
      name: t("ResearchHub.hubs.vietnam-war.title"),
      description: t("ResearchHub.hubs.vietnam-war.description"),
      href: "/research/vietnam-war",
      ctaText: locale === "vi" ? "(Sắp ra mắt)" : "(Coming soon)",
      ctaIsLink: false,
    },
    {
      name: t("ResearchHub.hubs.linguistics.title"),
      description: t("ResearchHub.hubs.linguistics.description"),
      href: "/research/linguistics",
      ctaText: locale === "vi" ? "(Sắp ra mắt)" : "(Coming soon)",
      ctaIsLink: false,
    },
  ];

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("ResearchHub.title")}
          subtitle={t("ResearchHub.subtitle")}
          breadcrumbItems={[{ label: t("ResearchHub.title") }]}
          locale={locale}
        />

        <section className="mt-10">
          <h2 className="text-[28px] text-branding-black font-['Helvetica Neue']">
            {t("ResearchHub.hubs-title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {researchHubs.map((hub) => (
              <div key={hub.name}>
                <InfoCard
                  name={hub.name}
                  description={hub.description}
                  url={hub.href}
                  ctaText={hub.ctaText}
                  ctaIsLink={hub.ctaIsLink}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-[28px] text-branding-black font-['Helvetica Neue']">
            {t("ResearchHub.tools-section.title")}
          </h2>
          <p className="font-['Helvetica Neue'] font-light text-base text-branding-black mt-4">
            {t("ResearchHub.tools-section.description")}
          </p>
          <MainToolsGrid />
        </section>
      </div>
    </div>
  );
};

export default ResearchPage;
