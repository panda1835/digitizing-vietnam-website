import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Merriweather } from "next/font/google";

import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/common/PageHeader";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("NomFonts.title")} | Digitizing Việt Nam`,
  };
}

export default async function NomFontsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();

  const fonts = [
    {
      slug: "nom-na-tong",
      name: t("NomFonts.fonts.nom-na-tong.name"),
      description: t("NomFonts.fonts.nom-na-tong.description"),
      url: t("NomFonts.fonts.nom-na-tong.url"),
    },
  ];

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("NomFonts.title")}
          subtitle={t("NomFonts.description")}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            {
              label: t("ResearchHub.HanNomHub.hero.title"),
              href: "/research/han-nom",
            },
            { label: t("NomFonts.title") },
          ]}
          locale={locale}
        />

        <section className="mt-10">
          <div className="mt-8">
            {fonts.map((font) => (
              <div key={font.slug} className="mb-8">
                <div
                  className={`${merriweather.className} text-branding-black text-2xl leading-relaxed`}
                >
                  <Link
                    href={`/research/han-nom/fonts/${font.slug}`}
                    className="text-branding-black font-['Helvetica Neue'] underline hover:text-branding-brown"
                  >
                    {font.name}
                  </Link>
                </div>
                <p className="text-branding-black text-base font-light font-['Helvetica Neue'] leading-relaxed mt-2">
                  {font.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
