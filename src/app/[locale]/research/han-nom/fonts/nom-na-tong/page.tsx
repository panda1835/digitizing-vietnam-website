import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("NomFonts.fonts.nom-na-tong.name")} | Digitizing Việt Nam`,
  };
}

export default async function NomNaTongInstallPage({
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
          title={t("NomFonts.fonts.nom-na-tong.name")}
          subtitle={""}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            {
              label: t("ResearchHub.HanNomHub.hero.title"),
              href: "/research/han-nom",
            },
            { label: t("NomFonts.title"), href: "/research/han-nom/fonts" },
            { label: t("NomFonts.fonts.nom-na-tong.name") },
          ]}
          locale={locale}
        />

        <main className="mt-10">
          <section>
            <h2 className="text-[28px] text-branding-black font-['Merriweather'] ">
              {locale === "vi" ? "Tải về" : "Download"}
            </h2>
            <div className="mt-6">
              <a
                href={t("NomFonts.fonts.nom-na-tong.url")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-branding-black text-base font-light font-['Helvetica Neue'] underline hover:text-branding-brown"
              >
                {t("NomFonts.fonts.nom-na-tong.url")}
              </a>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-[28px] text-branding-black font-['Merriweather'] ">
              {t("NomFonts.instructions.title")}
            </h2>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-branding-black text-2xl font-['Merriweather']">
                  Windows
                </h3>
                <p className="mt-2 text-branding-black text-base font-light font-['Helvetica Neue'] leading-relaxed">
                  {t("NomFonts.instructions.windows")}
                </p>
              </div>
              <div>
                <h3 className="text-branding-black text-2xl font-['Merriweather']">
                  macOS
                </h3>
                <p className="mt-2 text-branding-black text-base font-light font-['Helvetica Neue'] leading-relaxed">
                  {t("NomFonts.instructions.mac")}
                </p>
              </div>
              <div>
                <h3 className="text-branding-black text-2xl font-['Merriweather']">
                  Linux
                </h3>
                <p className="mt-2 text-branding-black text-base font-light font-['Helvetica Neue'] leading-relaxed">
                  {t("NomFonts.instructions.linux")}
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
