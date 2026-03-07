import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Merriweather } from "next/font/google";

import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/common/PageHeader";
import { routing } from "@/i18n/routing";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "OtherDictionaries" });
  return {
    title: `${t("title")} | Digitizing Việt Nam`,
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const OtherDictionariesPage = async ({ params: { locale } }) => {
  setRequestLocale(locale);
  const t = await getTranslations("OtherDictionaries");
  const common = await getTranslations();

  const dictionaries = ["zi-tools", "thivien", "zdic", "pleco", "de-rhodes"];
  const category = {
    resources: dictionaries.map((key) => ({
      title: t(`list.${key}.name`),
      description: t(`list.${key}.description`),
      url: t(`list.${key}.url`),
    })),
  };

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("title")}
          subtitle={t("description")}
          breadcrumbItems={[
            { label: common("ResearchHub.title"), href: "/research" },
            {
              label: common("ResearchHub.HanNomHub.hero.title"),
              href: "/research/han-nom",
            },
            { label: t("title") },
          ]}
          locale={locale}
        />

        <section className="mt-10">
          {category.resources.map((resource) => (
            <div key={resource.title} className="mb-8">
              <div
                className={`${merriweather.className} text-branding-black text-2xl leading-relaxed`}
              >
                <Link
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-branding-brown"
                >
                  {resource.title}
                </Link>
              </div>
              <p className="text-branding-black text-base font-light font-['Helvetica Neue'] leading-relaxed mt-2">
                {resource.description}
              </p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default OtherDictionariesPage;
