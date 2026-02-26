import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/PageHeader";
import LearnMoreButton from "@/components/LearnMoreButton";

import { Merriweather } from "next/font/google";
import { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { getCategorySlug, getOnlineResources } from "./resource-utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("NavigationBar.online-resources")} | Digitizing Việt Nam`,
  };
}

// Generate static pages for all locales
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Revalidate every hour for ISR
export const revalidate = 60 * 60 * 24; // 1 day

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });
const OnlineResources = async ({
  params: { locale },
}: {
  params: { locale: string };
}) => {
  // Enable static rendering for this page
  setRequestLocale(locale);

  const t = await getTranslations();

  const onlineResources = await getOnlineResources(locale).catch((error) => {
    console.error("Error fetching online resources:", error);
    return [];
  });

  return (
    <div className="flex flex-col max-width items-center">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("NavigationBar.online-resources")}
          subtitle={t("OnlineResource.subtitle")}
          breadcrumbItems={[{ label: t("NavigationBar.online-resources") }]}
          locale={locale}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {onlineResources.map((category) => (
            <div
              className="flex flex-col items-left justify-items-start border bg-branding-gray rounded-lg p-5 h-full justify-between"
              key={category.category_name}
            >
              <div
                className={`${merriweather.className} text-branding-brown text-3xl`}
              >
                {category.category_name}
              </div>
              <div>
                <p className="mt-5 text-base font-light font-['Helvetica Neue'] leading-relaxed text-branding-black text-left">
                  {category.description}
                </p>
                <div className="mt-5">
                  <LearnMoreButton
                    url={`/online-resources/${getCategorySlug(category.category_name)}`}
                    text={t("Button.learn-more")}
                    newTab={false}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnlineResources;
