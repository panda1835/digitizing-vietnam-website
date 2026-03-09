import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GraduationCap, Library, Scan, Search, ArrowRight } from "lucide-react";

import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/common/PageHeader";
import DictionarySearchBar from "@/app/[locale]/tools/han-nom-dictionaries/DictionarySearchBar";
import { hdwd as giupdocHdwd } from "@/app/[locale]/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet/hdwd";
import { hdwd as qatdHdwd } from "@/app/[locale]/tools/han-nom-dictionaries/nguyen-trai-quoc-am-tu-dien/hdwd";
import { hdwd as taberdHdwd } from "@/app/[locale]/tools/han-nom-dictionaries/taberd/hdwd";
import { hdwd as tdcndgHdwd } from "@/app/[locale]/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/hdwd";
import { Merriweather } from "next/font/google";

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});

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

  const tocGroups = [
    {
      title: locale === "vi" ? "Kho lưu trữ số" : "Digital Archives",
      items: [
        {
          label: t("ResearchHub.HanNomHub.digital-archives.title"),
          href:
            locale === "vi"
              ? "/our-collections?category=Kho Cận đại"
              : "/our-collections?category=Pre-modern Archive",
        },
        {
          label: t(
            "ResearchHub.HanNomHub.digital-archives.external-archives.title"
          ),
          href: "/research/han-nom/external-archives",
        },
        {
          label: locale === "vi" ? "Cơ sở dữ liệu" : "Search Database",
          href: "/research/han-nom/search-database",
        },
      ],
    },
    {
      title: locale === "vi" ? "Công cụ số" : "Digital Tools",
      items: [
        {
          label: locale === "vi" ? "Từ điển Hán Nôm" : "Hán-Nôm Dictionary",
          href: "/tools/han-nom-dictionaries/general",
        },
        {
          label: "Hán-Nôm OCR",
          href: "https://ocr.digitizingvietnam.com/en",
          external: true,
        },
        {
          label: t("ResearchHub.HanNomHub.unified-lookup.vietnamese-title"),
          href: "/research/han-nom/other-dictionaries",
        },
      ],
    },
    {
      title: t("ResearchHub.HanNomHub.sidebar.resources"),
      items: [
        {
          label: t("ResearchHub.HanNomHub.resources.periodicals"),
          href: "/research/han-nom/periodicals",
        },
        {
          label: locale === "vi" ? "Sách Học thuật" : "Books",
          href: "/our-collections/nghien-cuu-han-nom",
        },
        {
          label: t("ResearchHub.HanNomHub.resources.fonts"),
          href: "/research/han-nom/fonts",
        },
      ],
    },
    {
      title: locale === "vi" ? "Trung tâm học tập" : "Learning Center",
      items: [{ label: locale === "vi" ? "Sắp ra mắt" : "Coming Soon" }],
    },
  ];

  return (
    <div className="flex flex-col items-center max-width w-full">
      <div className="w-full mb-20">
        <PageHeader
          title={t("ResearchHub.HanNomHub.hero.title")}
          subtitle={t("ResearchHub.HanNomHub.intro.description")}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            { label: t("ResearchHub.HanNomHub.hero.title") },
          ]}
          locale={locale}
        />

        <div className="mt-12 flex flex-col lg:flex-row gap-12 justify-center w-full">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="sticky top-32">
              <ul className="space-y-5">
                {tocGroups.map((group) => (
                  <li key={group.title}>
                    <p className="text-branding-brown text-xl font-['Helvetica Neue']">
                      {group.title}
                    </p>
                    <ul className="mt-3 ml-6 list-disc space-y-2">
                      {group.items.map((item) => (
                        <li key={item.label}>
                          {item.href ? (
                            item.external ? (
                              <a
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-['Helvetica Neue'] font-light text-base text-branding-black hover:text-branding-brown hover:underline"
                              >
                                {item.label}
                              </a>
                            ) : (
                              <Link
                                href={item.href}
                                className="font-['Helvetica Neue'] font-light text-base text-branding-black hover:text-branding-brown hover:underline"
                              >
                                {item.label}
                              </Link>
                            )
                          ) : (
                            <span className="font-['Helvetica Neue'] font-light text-base text-branding-black">
                              {item.label}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <main className="flex flex-col gap-14 max-w-5xl w-full">
            <section id="intro" className="scroll-mt-32">
              <h2 className="font-halyard text-4xl md:text-5xl text-branding-black font-bold mb-8 leading-tight">
                {t("ResearchHub.HanNomHub.intro.title")}
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                <div className="lg:col-span-3">
                  <p className="text-2xl text-muted-foreground font-light leading-relaxed mb-8">
                    {t("ResearchHub.HanNomHub.intro.description")}
                  </p>
                </div>

                <div className="lg:col-span-2 bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-branding-brown/10">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-branding-brown mb-6">
                    {t("ResearchHub.HanNomHub.intro.goal")}
                  </h3>
                  <ul className="space-y-4">
                    {[
                      { icon: Library, key: "archives" },
                      { icon: Scan, key: "ocr" },
                      { icon: Search, key: "lookup" },
                      { icon: GraduationCap, key: "resources" },
                    ].map((feature) => (
                      <li key={feature.key} className="flex gap-4 items-start">
                        <div className="mt-1 p-1.5 bg-branding-brown/10 rounded-lg text-branding-brown">
                          <feature.icon className="h-4 w-4" />
                        </div>
                        <span className="text-base text-branding-black/80 font-medium leading-snug">
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

            <section id="tools-and-featured" className="scroll-mt-32">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <Link
                  href="/our-collections/han-nom-collection"
                  className="group relative overflow-hidden rounded-3xl bg-branding-black/5 border border-branding-black/10 p-8 hover:bg-branding-black/10 transition-colors cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-4 uppercase tracking-widest text-branding-brown/60 text-[10px] font-bold">
                      <Library className="h-3.5 w-3.5" />
                      <span>
                        {locale === "vi"
                          ? "Nội dung nổi bật"
                          : "Featured Content"}
                      </span>
                    </div>
                    <h3
                      className={`${merriweather.className} text-2xl text-branding-black mb-2`}
                    >
                      {locale === "vi"
                        ? "Bộ sưu tập Hán Nôm"
                        : "Hán-Nôm Collection"}
                    </h3>
                    <p className="text-muted-foreground font-light mb-6">
                      {locale === "vi"
                        ? "Khám phá các tư liệu Hán Nôm tiêu biểu trong kho số hóa của DVN."
                        : "Explore curated Hán-Nôm materials from DVN's digitized collections."}
                    </p>
                  </div>
                  <div className="flex items-center text-branding-black font-bold text-sm uppercase tracking-wider">
                    {locale === "vi" ? "Xem bộ sưu tập" : "Browse Collection"}
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <div className="bg-white p-8 rounded-3xl shadow-xl border border-branding-brown/10 flex flex-col">
                  <div className="flex items-center gap-2 mb-6 uppercase tracking-widest text-branding-brown/60 text-[10px] font-bold">
                    <Search className="h-3.5 w-3.5" />
                    <span>
                      {locale === "vi" ? "Tra cứu nhanh" : "Quick Lookup"}
                    </span>
                  </div>
                  <h3
                    className={`${merriweather.className} text-2xl text-branding-black mb-6`}
                  >
                    {locale === "vi" ? "Từ điển Hán Nôm" : "Hán-Nôm Dictionary"}
                  </h3>
                  <div className="flex-1 flex flex-col justify-center">
                    <DictionarySearchBar
                      searchWord={undefined}
                      placeholder={t(
                        "Tools.han-nom-dictionaries.dictionaries.general.search-placeholder"
                      )}
                      hdwd_list={combinedHeadwords}
                      searchPath="/tools/han-nom-dictionaries/general"
                    />
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
