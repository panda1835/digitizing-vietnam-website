import { getTranslations, setRequestLocale } from "next-intl/server";

import { Metadata } from "next";

import { MainToolsGrid } from "@/components/common/MainToolsGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("NavigationBar.tools")} | Digitizing Việt Nam`,
  };
}

// Generate static pages for all locales
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Revalidate every 24 hours for ISR (tools page is mostly static)
export const revalidate = 60 * 60 * 24; // 1 day

const Tools = async ({ params: { locale } }) => {
  // Enable static rendering for this page
  setRequestLocale(locale);

  const t = await getTranslations();

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("NavigationBar.tools")}
          subtitle={t("Tools.subtitle")}
          breadcrumbItems={[{ label: t("NavigationBar.tools") }]}
          locale={locale}
        />
        <MainToolsGrid />
      </div>
    </div>
  );
};

export default Tools;
