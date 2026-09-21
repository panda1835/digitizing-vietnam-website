import { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Boxes,
  CalendarDays,
  GraduationCap,
  Library,
  Layers,
  Scan,
  Search,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import VietDienSearch from "./_components/VietDienSearch";
import DictionarySearchBar from "@/app/[locale]/tools/han-nom-dictionaries/DictionarySearchBar";
import { hdwd as giupdocHdwd } from "@/app/[locale]/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet/hdwd";
import { hdwd as qatdHdwd } from "@/app/[locale]/tools/han-nom-dictionaries/nguyen-trai-quoc-am-tu-dien/hdwd";
import { hdwd as taberdHdwd } from "@/app/[locale]/tools/han-nom-dictionaries/taberd/hdwd";
import { hdwd as tdcndgHdwd } from "@/app/[locale]/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/hdwd";
import { Merriweather } from "next/font/google";
import localFont from "next/font/local";

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});

const NomNaTong = localFont({
  src: "../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

const VIET_DIEN_URL = "https://viet-dien.com";

// Queries the lookup is worth trying first, one per way of searching it:
// a Hán-Nôm character, a Quốc Ngữ reading, and a pair of components. They go
// straight to the dictionary rather than filling the box, so a tap is one
// step, not two. The component pair is typed with no space between the two
// parts — the label shows the "+" the box itself will not take.
const LOOKUP_EXAMPLES: { q: string; label?: string }[] = [
  { q: "學" },
  { q: "國" },
  { q: "văn" },
  { q: "học" },
  { q: "口南", label: "口+南" },
];

type NavItem = { label: string; href: string; external?: boolean };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("ResearchHub.HanNomHub.hero.title")} | Digitizing Việt Nam`,
    description: t("ResearchHub.HanNomHub.hub.lede"),
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

  // The four groups that used to be the sidebar. They now carry the same links
  // as cards across the full width of the page.
  const navGroups: {
    title: string;
    icon: typeof Library;
    items: NavItem[];
  }[] = [
    {
      title: locale === "vi" ? "Kho lưu trữ số" : "Digital Archives",
      icon: Layers,
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
      icon: Boxes,
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
      icon: BookOpen,
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
      icon: GraduationCap,
      items: [
        { label: "NômFlow", href: "https://nomflow.app", external: true },
        {
          label: locale === "vi" ? "Giáo trình Trực tuyến" : "Online Textbook",
          href: "/our-collections/nghien-cuu-han-nom/ly-thuyet-thuc-hanh-chu-nom",
        },
      ],
    },
  ];

  const featuredContent: {
    key: string;
    href: string;
    // A picture shown across the head of the card, with the part of it the
    // band should keep when the crop bites.
    image?: string;
    crop?: string;
  }[] = [
    {
      key: "featuredCollection",
      href: "/our-collections/han-nom-collection",
      image: "/images/han-nom-collection-card.jpg",
      crop: "object-top",
    },
    {
      key: "featuredBooks",
      href: "/our-collections/nghien-cuu-han-nom",
      image: "/images/han-nom-books-card.jpg",
      // The stack sits mid-frame; anchoring to the top would crop to the
      // shelf behind it.
      crop: "object-center",
    },
  ];

  const projects: {
    name: string;
    blurb: string;
    cta: string;
    href: string;
    external?: boolean;
    icon: typeof Scan;
  }[] = [
    {
      name: t("ResearchHub.HanNomHub.digital-archives.title"),
      blurb: t("ResearchHub.HanNomHub.hub.projects.archivesBlurb"),
      cta: t("ResearchHub.HanNomHub.hub.projects.archivesCta"),
      href:
        locale === "vi"
          ? "/our-collections?category=Kho Cận đại"
          : "/our-collections?category=Pre-modern Archive",
      icon: Layers,
    },
    {
      name: "Hán-Nôm OCR",
      blurb: t("ResearchHub.HanNomHub.hub.projects.ocrBlurb"),
      cta: t("ResearchHub.HanNomHub.hub.projects.ocrCta"),
      href: "https://ocr.digitizingvietnam.com/en",
      external: true,
      icon: Scan,
    },
    {
      name: t("ResearchHub.HanNomHub.DateConverter.title"),
      blurb: t("ResearchHub.HanNomHub.hub.projects.dateBlurb"),
      cta: t("ResearchHub.HanNomHub.hub.projects.dateCta"),
      href: "/tools/date-converter",
      icon: CalendarDays,
    },
  ];

  // One surface per job, rather than one card class for everything.
  const panelClass =
    "bg-white rounded-2xl border border-branding-black/10 shadow-lg shadow-branding-brown/5";
  const flatCardClass =
    "bg-white/70 rounded-xl border border-branding-black/10 hover:border-branding-black/25 transition-colors";
  const navLinkClass =
    "inline-flex items-start gap-0.5 text-[15px] leading-[1.4] text-branding-black/75 font-medium hover:text-branding-brown hover:underline underline-offset-2";

  const renderNavLink = (item: NavItem) => (
    <li key={item.label}>
      {item.external ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={navLinkClass}
        >
          {item.label}
          <ArrowUpRight className="h-3 w-3 shrink-0 mt-[0.2em]" aria-hidden />
        </a>
      ) : (
        <Link href={item.href} className={navLinkClass}>
          {item.label}
        </Link>
      )}
    </li>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="w-full mb-20">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "research" },
            { label: t("ResearchHub.HanNomHub.hero.title") },
          ]}
        />

        {/* --- Hero ------------------------------------------------------- */}
        <section className="relative isolate mt-2 overflow-hidden rounded-2xl px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          {/* Brushed 漢喃 on paper, cropped to the right so the strokes sit
              beside the text rather than under it. */}
          <Image
            src="/images/han-nom-hero-banner.jpg"
            alt=""
            aria-hidden
            fill
            priority
            sizes="100vw"
            className="-z-20 pointer-events-none select-none object-cover object-right"
          />
          {/* A wash over the paper: heavy on the left, where the words are,
              clearing by the right edge so the brushwork stays legible. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white/85 via-white/70 to-white/55 sm:bg-gradient-to-r sm:from-white/92 sm:via-white/75 sm:to-transparent"
          />

          <div className="">
            <h1
              className={`${merriweather.className} flex max-w-3xl flex-col gap-2 sm:gap-3 text-4xl sm:text-5xl xl:text-[3.25rem] leading-[1.1] text-branding-black mb-4`}
            >
              <span>
                {locale === "vi"
                  ? "Cổng thông tin số cho"
                  : "The Digital Gateway to"}
              </span>
              <span>
                {locale === "vi" ? "Nghiên cứu Hán-Nôm" : "Hán-Nôm Studies"}
              </span>
            </h1>
            <p className="text-lg text-branding-black/70 leading-relaxed max-w-7xl mb-7">
              {t("ResearchHub.HanNomHub.hub.lede")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={
                  locale === "vi"
                    ? "/our-collections?category=Kho Cận đại"
                    : "/our-collections?category=Pre-modern Archive"
                }
                className="inline-flex items-center gap-2 rounded-lg bg-branding-brown px-6 py-3 text-sm font-bold text-white shadow-md shadow-branding-brown/20 hover:bg-branding-brown/90 hover:-translate-y-0.5 transition-all"
              >
                {t("ResearchHub.HanNomHub.hub.ctaPrimary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* --- About ------------------------------------------------------- */}
        <section id="about" className="mt-8 lg:mt-10 scroll-mt-32">
          <h2
            className={`${merriweather.className} text-2xl text-branding-black mb-3`}
          >
            {t("ResearchHub.HanNomHub.hub.about")}
          </h2>
          <p className="text-base text-branding-black/70 leading-relaxed max-w-7xl">
            {t("ResearchHub.HanNomHub.intro.description")}
          </p>
        </section>

        {/* --- The four sections of the hub -------------------------------- */}
        <section className="mt-8 lg:mt-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
          {navGroups.map((group) => (
            <div
              key={group.title}
              className="flex flex-col bg-white/70 rounded-xl border border-branding-black/10 shadow-sm shadow-branding-brown/5 p-5"
            >
              <h2
                className={`${merriweather.className} flex items-center gap-2 text-[15px] text-branding-black font-bold pb-2.5 mb-3 border-b border-branding-black/10`}
              >
                <span className="p-1.5 rounded-md bg-branding-brown/10 text-branding-brown shrink-0">
                  <group.icon className="h-4 w-4" />
                </span>
                {group.title}
              </h2>
              {/* No blurb: the links below it say the same thing. The mockup
                  needed one because its cards held nothing else.
                  Not mt-auto either — the cards are equal height, and pushing
                  the links down left the short lists floating. */}
              <ul className="space-y-2.5">{group.items.map(renderNavLink)}</ul>
            </div>
          ))}
        </section>

        {/* --- Featured content -------------------------------------------- */}
        <section className="mt-10">
          <h2
            className={`${merriweather.className} flex items-center gap-3 text-2xl text-branding-black mb-4`}
          >
            {t("ResearchHub.HanNomHub.hub.featured.title")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {featuredContent.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                className={`${flatCardClass} group overflow-hidden bg-branding-brown/[0.04] flex flex-col`}
              >
                {/* A plate from the collection, shown as a picture: full
                    strength, its own band across the head of the card. */}
                {card.image && (
                  <div className="relative h-40 sm:h-44 w-full border-b border-branding-black/10 bg-branding-brown/5">
                    <Image
                      src={card.image}
                      alt={t(`ResearchHub.HanNomHub.cards.${card.key}.title`)}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className={`object-cover ${
                        card.crop ?? "object-center"
                      } transition-transform duration-500 group-hover:scale-[1.03]`}
                    />
                  </div>
                )}
                <div className="p-5 sm:p-6 flex flex-col justify-center">
                  <h3
                    className={`${merriweather.className} text-2xl sm:text-[28px] leading-snug text-branding-black mb-2`}
                  >
                    {t(`ResearchHub.HanNomHub.cards.${card.key}.title`)}
                  </h3>
                  <p className="text-[15px] text-branding-black/70 mb-5">
                    {t(`ResearchHub.HanNomHub.cards.${card.key}.description`)}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-branding-brown">
                    {t(`ResearchHub.HanNomHub.cards.${card.key}.cta`)}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* --- Search band ------------------------------------------------ */}
        <section id="search" className="mt-10">
          <h2
            className={`${merriweather.className} text-2xl text-branding-black mb-4`}
          >
            {t("ResearchHub.HanNomHub.cards.corpusSearch.title")}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${panelClass} p-5 sm:p-6 flex flex-col`}>
              <div>
                {/* The name and its icon are the way into the tool itself, the
                    way Việt Điển's logo is the way to Việt Điển. */}
                <Link
                  href="/tools/han-nom-dictionaries/general"
                  className="group flex items-start gap-3"
                >
                  <span className="p-2 rounded-lg bg-branding-brown/10 text-branding-brown shrink-0 transition-colors group-hover:bg-branding-brown/20">
                    <Search className="h-5 w-5" />
                  </span>
                  <h2
                    className={`${merriweather.className} flex items-center gap-2 text-2xl sm:text-[28px] leading-snug text-branding-black font-bold transition-colors group-hover:text-branding-brown`}
                  >
                    {t("ResearchHub.HanNomHub.cards.quickLookup.title")}
                    <ArrowRight
                      className="h-5 w-5 shrink-0 text-branding-brown transition-transform group-hover:translate-x-1"
                      aria-hidden
                    />
                  </h2>
                </Link>
                {/* Indented to the title, not the icon. */}
                <p className="mt-1 pl-12 text-sm text-branding-black/70">
                  {t("ResearchHub.HanNomHub.cards.quickLookup.description")}
                </p>
              </div>
              <div className="mt-5 flex-1">
                <DictionarySearchBar
                  searchWord={undefined}
                  placeholder={t(
                    "Tools.han-nom-dictionaries.dictionaries.general.search-placeholder"
                  )}
                  hdwd_list={combinedHeadwords}
                  searchPath="/tools/han-nom-dictionaries/general"
                  variant="flat"
                />
                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <span>{t("ResearchHub.HanNomHub.hub.examples")}</span>
                  {LOOKUP_EXAMPLES.map((example, index) => (
                    // A dot between the links: the component pair reads as one
                    // query, not as two more characters to try.
                    <span key={example.q} className="flex items-center gap-x-2">
                      {index > 0 && (
                        <span className="text-branding-black/25" aria-hidden>
                          &middot;
                        </span>
                      )}
                      <Link
                        href={`/tools/han-nom-dictionaries/general?q=${encodeURIComponent(
                          example.q
                        )}`}
                        className={`${NomNaTong.className} text-branding-brown hover:underline`}
                      >
                        {example.label ?? example.q}
                      </Link>
                    </span>
                  ))}
                </p>
              </div>
            </div>

            {/* Việt Điển keeps its own type and its navy, so the panel reads as
                that site sitting inside ours. */}
            <div
              className={`${panelClass} p-5 sm:p-6 text-center flex flex-col`}
            >
              <div className="flex flex-col justify-center">
                <a
                  href={VIET_DIEN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Image
                    src="/images/viet-dien-logo.png"
                    alt={t("ResearchHub.HanNomHub.cards.vietDien.alt")}
                    width={960}
                    height={184}
                    className="mx-auto w-full max-w-[17rem] sm:max-w-[22rem] h-auto"
                  />
                </a>
                <p className="mt-2 text-sm text-slate-500">
                  {t("ResearchHub.HanNomHub.cards.vietDien.description")}
                </p>
              </div>
              <div className="mt-auto">
                <VietDienSearch />
              </div>
            </div>
          </div>
        </section>

        {/* --- Projects and tools ------------------------------------------- */}
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4 mb-4">
            <h2
              className={`${merriweather.className} flex items-center gap-3 text-2xl text-branding-black`}
            >
              {t("ResearchHub.HanNomHub.hub.projects.title")}
            </h2>
            <Link
              href="/tools"
              className="inline-flex items-center gap-1 text-sm font-medium text-branding-brown hover:underline whitespace-nowrap"
            >
              {t("ResearchHub.HanNomHub.hub.projects.viewAll")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((project) => {
              const body = (
                <>
                  <span className="p-2 m-4 mr-0 h-fit rounded-lg bg-branding-brown/10 text-branding-brown shrink-0">
                    <project.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="p-4 min-w-0">
                    <h3
                      className={`${merriweather.className} flex items-center gap-1 text-lg text-branding-black`}
                    >
                      {project.name}
                      {project.external && (
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                      )}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {project.blurb}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-branding-brown">
                      {project.cta}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </>
              );
              const className = `${flatCardClass} group flex items-start`;

              return project.external ? (
                <a
                  key={project.name}
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {body}
                </a>
              ) : (
                <Link
                  key={project.name}
                  href={project.href}
                  className={className}
                >
                  {body}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
