import { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  GraduationCap,
  Library,
  Scan,
  Search,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/common/PageHeader";
import VietDienSearch from "./_components/VietDienSearch";
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

const VIET_DIEN_URL = "https://viet-dien.com";

type TocItem = {
  label: string;
  href: string;
  external?: boolean;
};

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

  const tocGroups: { title: string; items: TocItem[] }[] = [
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
          label: t("ResearchHub.HanNomHub.cards.vietDien.nav"),
          href: VIET_DIEN_URL,
          external: true,
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
          label: locale === "vi" ? "Từ điển Hán Nôm" : "Unified Hán-Nôm Lookup",
          href: "/tools/han-nom-dictionaries/general",
        },
        {
          label: "Hán-Nôm OCR",
          href: "https://ocr.digitizingvietnam.com/en",
          external: true,
        },
        {
          label: locale === "vi" ? "Công cụ tính ngày tháng" : "Date Converter",
          href: "/tools/date-converter",
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
      items: [
        {
          label: "NômFlow",
          href: "https://nomflow.app",
          external: true,
        },
        {
          label: locale === "vi" ? "Giáo trình Trực tuyến" : "Online Textbook",
          href: "/our-collections/nghien-cuu-han-nom/ly-thuyet-thuc-hanh-chu-nom",
        },
      ],
    },
  ];

  const tocLinkClass =
    "font-['Helvetica Neue'] text-[14px] lg:text-[16px] leading-[1.35] text-[#747474] font-medium hover:text-branding-brown";

  const renderTocItem = (item: TocItem) => (
    <li key={item.label} className="list-none">
      {item.external ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={tocLinkClass}
        >
          {item.label}
        </a>
      ) : (
        <Link href={item.href} className={tocLinkClass}>
          {item.label}
        </Link>
      )}
    </li>
  );

  // The sidebar stacks the groups; on mobile the same list sits in the main
  // column as a two-column grid so it doesn't push the content far down.
  const tocList = (variant: "sidebar" | "inline") => (
    <ul
      className={
        variant === "sidebar"
          ? "space-y-11"
          : "grid grid-cols-2 gap-x-4 gap-y-6"
      }
    >
      {tocGroups.map((group) => (
        <li key={group.title}>
          <p
            className={`${merriweather.className} text-sm lg:text-lg leading-none tracking-[0.1em] text-branding-brown font-bold`}
          >
            {group.title}
          </p>
          <ul className="mt-3 lg:mt-5 pl-3 lg:pl-5 pr-0 lg:pr-4 py-1 space-y-2 border-l border-branding-brown/30">
            {group.items.map(renderTocItem)}
          </ul>
        </li>
      ))}
    </ul>
  );

  const eyebrowClass =
    "flex items-center gap-2 uppercase tracking-widest text-branding-brown/70 text-[11px] font-bold";

  const featuredCards = [
    {
      href: "/our-collections/han-nom-collection",
      icon: Library,
      key: "featuredCollection",
    },
    {
      href: "/our-collections/nghien-cuu-han-nom",
      icon: BookOpen,
      key: "featuredBooks",
    },
  ];

  return (
    <div className="flex flex-col items-center max-width w-full">
      <div className="w-full mb-20">
        <PageHeader
          title={t("ResearchHub.HanNomHub.hero.title")}
          subtitle={""}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            { label: t("ResearchHub.HanNomHub.hero.title") },
          ]}
          locale={locale}
        />

        <div className="mt-8 lg:mt-12 flex flex-col lg:flex-row gap-12 justify-center w-full">
          <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            <nav className="lg:sticky lg:top-32">{tocList("sidebar")}</nav>
          </aside>

          <main className="flex flex-col gap-8 lg:gap-12 max-w-5xl w-full min-w-0">
            <section
              id="intro"
              className="scroll-mt-32 grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12"
            >
              <div className="lg:col-span-3">
                <h2 className="font-['Helvetica Neue'] text-3xl md:text-5xl text-branding-black font-bold mb-4 lg:mb-8 leading-tight">
                  {t("ResearchHub.HanNomHub.intro.title")}
                </h2>
                <p className="text-base md:text-xl text-branding-black/70 font-light leading-relaxed">
                  {t("ResearchHub.HanNomHub.intro.description")}
                </p>
              </div>

              <nav className="lg:hidden rounded-2xl border border-branding-brown/15 bg-white/60 p-5">
                {tocList("inline")}
              </nav>

              <div className="lg:col-span-2 self-start bg-white/50 backdrop-blur-sm p-6 lg:p-8 rounded-xl border border-branding-brown/10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-branding-brown mb-5 lg:mb-6">
                  {t("ResearchHub.HanNomHub.intro.goal")}
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {[
                    { icon: Library, key: "archives" },
                    { icon: Scan, key: "ocr" },
                    { icon: Search, key: "lookup" },
                    { icon: GraduationCap, key: "resources" },
                  ].map((feature) => (
                    <li key={feature.key} className="flex gap-4 items-center">
                      <div className="p-1.5 bg-branding-brown/10 rounded-lg text-branding-brown shrink-0">
                        <feature.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm lg:text-base text-branding-black/80 font-medium leading-snug">
                        {t(
                          `ResearchHub.HanNomHub.intro.features.${feature.key}`
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Side by side from xl (Việt Điển 2/3, lookup 1/3); below that the
                column is too narrow to split, so they stack. */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              {/* Styled after viet-dien.com's own home page (white sheet, the
                  logo lockup, slate text, its navy #00196e) so the banner reads
                  as that site rather than as another card of this one. */}
              <section
                id="viet-dien"
                className="scroll-mt-32 xl:col-span-2 bg-white shadow rounded-lg px-5 py-6 sm:px-10 sm:py-8 text-center flex flex-col justify-center"
              >
                <a
                  href={VIET_DIEN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Image
                    src="/images/viet-dien-logo.png"
                    alt={t("ResearchHub.HanNomHub.cards.vietDien.alt")}
                    width={960}
                    height={184}
                    className="mx-auto w-full max-w-[19rem] sm:max-w-[26rem] h-auto"
                  />
                </a>
                <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
                  {t("ResearchHub.HanNomHub.cards.vietDien.description")}
                </p>
                <VietDienSearch />
                <a
                  href={VIET_DIEN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 self-center inline-flex items-center gap-1 text-sm font-medium text-[#00196e] hover:text-[#33529f]"
                >
                  {t("ResearchHub.HanNomHub.cards.vietDien.cta")}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </section>

              <section
                id="lookup"
                className="scroll-mt-32 bg-white p-5 sm:p-8 rounded-3xl shadow-xl border border-branding-brown/10 grid grid-cols-1 md:grid-cols-5 xl:grid-cols-1 gap-4 md:gap-8 xl:gap-5 md:items-center xl:content-center"
              >
                <div className="md:col-span-2 xl:col-span-1">
                  <div className={`${eyebrowClass} mb-3`}>
                    <Search className="h-3.5 w-3.5" />
                    <span>
                      {t("ResearchHub.HanNomHub.cards.quickLookup.label")}
                    </span>
                  </div>
                  <h3
                    className={`${merriweather.className} text-xl sm:text-2xl text-branding-black mb-2`}
                  >
                    {t("ResearchHub.HanNomHub.cards.quickLookup.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("ResearchHub.HanNomHub.cards.quickLookup.description")}
                  </p>
                </div>
                <div className="md:col-span-3 xl:col-span-1">
                  <DictionarySearchBar
                    searchWord={undefined}
                    placeholder={t(
                      "Tools.han-nom-dictionaries.dictionaries.general.search-placeholder"
                    )}
                    hdwd_list={combinedHeadwords}
                    searchPath="/tools/han-nom-dictionaries/general"
                    stackFromXl
                  />
                </div>
              </section>
            </div>

            <section
              id="featured"
              className="scroll-mt-32 grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8"
            >
              {featuredCards.map((card) => (
                <Link
                  key={card.key}
                  href={card.href}
                  className="group rounded-3xl bg-branding-black/5 border border-branding-black/10 p-6 sm:p-8 hover:bg-branding-black/10 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className={`${eyebrowClass} mb-4`}>
                      <card.icon className="h-3.5 w-3.5" />
                      <span>
                        {t(`ResearchHub.HanNomHub.cards.${card.key}.label`)}
                      </span>
                    </div>
                    <h3
                      className={`${merriweather.className} text-xl sm:text-2xl text-branding-black mb-2`}
                    >
                      {t(`ResearchHub.HanNomHub.cards.${card.key}.title`)}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground font-light mb-6">
                      {t(`ResearchHub.HanNomHub.cards.${card.key}.description`)}
                    </p>
                  </div>
                  <div className="flex items-center text-branding-black font-bold text-sm uppercase tracking-wider">
                    {t(`ResearchHub.HanNomHub.cards.${card.key}.cta`)}
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
