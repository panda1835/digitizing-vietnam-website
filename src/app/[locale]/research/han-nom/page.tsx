import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GraduationCap, Library, Scan, Search } from "lucide-react";

import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/common/PageHeader";
import DictionarySearchBar from "@/app/[locale]/tools/han-nom-dictionaries/DictionarySearchBar";
import { hdwd as giupdocHdwd } from "@/app/[locale]/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet/hdwd";
import { hdwd as qatdHdwd } from "@/app/[locale]/tools/han-nom-dictionaries/nguyen-trai-quoc-am-tu-dien/hdwd";
import { hdwd as taberdHdwd } from "@/app/[locale]/tools/han-nom-dictionaries/taberd/hdwd";
import { hdwd as tdcndgHdwd } from "@/app/[locale]/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/hdwd";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("ResearchHub.HanNomHub.hero.title")} | Digitizing Việt Nam`,
  };
}

export default async function HanNomPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();
  const combinedHeadwords = Array.from(
    new Set([...tdcndgHdwd, ...giupdocHdwd, ...qatdHdwd, ...taberdHdwd])
  ).sort();

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("ResearchHub.HanNomHub.hero.title")}
          subtitle={t("ResearchHub.HanNomHub.intro.description")}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            { label: t("ResearchHub.HanNomHub.hero.title") },
          ]}
          locale={locale}
        />

        <main className="mt-10">
          <section id="our-mission">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mt-6">
              <div className="lg:col-span-2 bg-white/50 p-8 rounded-3xl border border-branding-brown/10">
                <ul className="space-y-4">
                  {[
                    { icon: Library, key: "archives" },
                    { icon: Scan, key: "ocr" },
                    { icon: Search, key: "lookup" },
                    { icon: GraduationCap, key: "resources" },
                  ].map((feature) => (
                    <li key={feature.key} className="flex gap-4 items-start">
                      <div className="mt-1 p-1.5 bg-branding-brown/10 rounded-lg text-branding-brown">
                        <feature.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-['Helvetica Neue'] text-sm text-branding-black/80 leading-snug">
                        {t(
                          `ResearchHub.HanNomHub.intro.features.${feature.key}`
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="max-w-4xl">
              <DictionarySearchBar
                searchWord={undefined}
                placeholder={t(
                  "Tools.han-nom-dictionaries.dictionaries.general.search-placeholder"
                )}
                hdwd_list={combinedHeadwords}
                searchPath="/tools/han-nom-dictionaries/general"
              />
            </div>
          </section>

          <section className="mt-12">
            <nav className="mt-2">
              <ul className="space-y-5">
                <li>
                  <p className="text-branding-brown text-2xl font-['Merriweather']">
                    {locale === "vi" ? "Kho lưu trữ số" : "Digital Archives"}
                  </p>
                  <ul className="mt-3 ml-6 list-disc space-y-2">
                    <li>
                      <Link
                        href="/our-collections?category=pre-modern-archive"
                        className="font-['Helvetica Neue'] font-light text-base text-branding-black hover:text-branding-brown hover:underline"
                      >
                        {t("ResearchHub.HanNomHub.digital-archives.title")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/research/han-nom/external-archives"
                        className="font-['Helvetica Neue'] font-light text-base text-branding-black hover:text-branding-brown hover:underline"
                      >
                        {t(
                          "ResearchHub.HanNomHub.digital-archives.external-archives.title"
                        )}
                      </Link>
                    </li>
                  </ul>
                </li>

                <li>
                  <p className="text-branding-brown text-2xl font-['Merriweather']">
                    {locale === "vi" ? "Công cụ số" : "Digital Tools"}
                  </p>
                  <ul className="mt-3 ml-6 list-disc space-y-2">
                    <li>
                      <Link
                        href="/tools/han-nom-dictionaries/general"
                        className="font-['Helvetica Neue'] font-light text-base text-branding-black hover:text-branding-brown hover:underline"
                      >
                        {locale === "vi"
                          ? "Từ điển Hán Nôm"
                          : "Hán Nôm Dictionary"}
                      </Link>
                    </li>
                    <li>
                      <a
                        href="https://ocr.digitizingvietnam.com/en"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-['Helvetica Neue'] font-light text-base text-branding-black hover:text-branding-brown hover:underline"
                      >
                        Hán-Nôm OCR
                      </a>
                    </li>
                    <li>
                      <Link
                        href="/research/han-nom/other-dictionaries"
                        className="font-['Helvetica Neue'] font-light text-base text-branding-black hover:text-branding-brown hover:underline"
                      >
                        {t(
                          "ResearchHub.HanNomHub.unified-lookup.vietnamese-title"
                        )}
                      </Link>
                    </li>
                  </ul>
                </li>

                <li>
                  <p className="text-branding-brown text-2xl font-['Merriweather']">
                    {t("ResearchHub.HanNomHub.sidebar.resources")}
                  </p>
                  <ul className="mt-3 ml-6 list-disc space-y-2">
                    <li>
                      <Link
                        href="/research/han-nom/periodicals"
                        className="font-['Helvetica Neue'] font-light text-base text-branding-black hover:text-branding-brown hover:underline"
                      >
                        {t("ResearchHub.HanNomHub.resources.periodicals")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/our-collections/nghien-cuu-han-nom"
                        className="font-['Helvetica Neue'] font-light text-base text-branding-black hover:text-branding-brown hover:underline"
                      >
                        {locale === "vi" ? "Sách Học thuật" : "Books"}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/research/han-nom/fonts"
                        className="font-['Helvetica Neue'] font-light text-base text-branding-black hover:text-branding-brown hover:underline"
                      >
                        {t("ResearchHub.HanNomHub.resources.fonts")}
                      </Link>
                    </li>
                  </ul>
                </li>

                <li>
                  <p className="text-branding-brown text-2xl font-['Merriweather']">
                    {locale === "vi" ? "Trung tâm học tập" : "Learning Center"}
                  </p>
                  <ul className="mt-3 ml-6 list-disc space-y-2">
                    <li className="font-['Helvetica Neue'] font-light text-base text-branding-black">
                      {locale === "vi" ? "Sắp ra mắt" : "Coming Soon"}
                    </li>
                  </ul>
                </li>
              </ul>
            </nav>
          </section>
        </main>
      </div>
    </div>
  );
}
