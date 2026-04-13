import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Merriweather } from "next/font/google";
import { Download, Monitor, Apple, Terminal } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});

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

  const osSections = [
    {
      label: "Windows",
      icon: Monitor,
      instructions: t("NomFonts.instructions.windows"),
    },
    {
      label: "macOS",
      icon: Apple,
      instructions: t("NomFonts.instructions.mac"),
    },
    {
      label: "Linux",
      icon: Terminal,
      instructions: t("NomFonts.instructions.linux"),
    },
  ];

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("NomFonts.fonts.nom-na-tong.name")}
          subtitle={t("NomFonts.fonts.nom-na-tong.description")}
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

        <main className="mt-12 space-y-14">
          {/* Download */}
          <section>
            <h2
              className={`${merriweather.className} text-base text-branding-black font-bold mb-6 uppercase tracking-widest`}
            >
              {locale === "vi" ? "Tải về" : "Download"}
            </h2>
            <a
              href={t("NomFonts.fonts.nom-na-tong.url")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-branding-black text-white font-semibold text-base hover:bg-branding-black/85 transition-colors"
            >
              <Download className="h-5 w-5" />
              {locale === "vi"
                ? "Tải Nôm Na Tống từ GitHub"
                : "Download Nôm Na Tống from GitHub"}
            </a>
          </section>

          {/* Installation Instructions */}
          <section>
            <h2
              className={`${merriweather.className} text-base text-branding-black font-bold mb-6 uppercase tracking-widest`}
            >
              {t("NomFonts.instructions.title")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {osSections.map(({ label, icon: Icon, instructions }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-branding-brown/15 bg-white p-6 flex flex-col gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-branding-brown/10 rounded-lg text-branding-brown">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3
                      className={`${merriweather.className} text-lg text-branding-black font-bold`}
                    >
                      {label}
                    </h3>
                  </div>
                  <p className="text-branding-black text-sm font-['Helvetica_Neue'] leading-relaxed">
                    {instructions}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
