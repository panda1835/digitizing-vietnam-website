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
    icon: typeof Library;
    // A picture shown across the head of the card, with the part of it the
    // band should keep when the crop bites.
    image?: string;
    crop?: string;
  }[] = [
    {
      key: "featuredCollection",
      href: "/our-collections/han-nom-collection",
      icon: Library,
      image: "/images/han-nom-collection-card.jpg",
      crop: "object-top",
    },
    {
      key: "featuredBooks",
      href: "/our-collections/nghien-cuu-han-nom",
      icon: BookOpen,
      image: "/images/han-nom-books-card.jpg",
      // The stack sits mid-frame; anchoring to the top would crop to the
      // shelf behind it.
      crop: "object-center",
    },
  ];

  const projects: {
    name: string;
    tags: string;
    blurb: string;
    cta: string;
    href: string;
    external?: boolean;
    icon: typeof Scan;
  }[] = [
    {
      name: t("ResearchHub.HanNomHub.digital-archives.title"),
      tags: t("ResearchHub.HanNomHub.hub.projects.archivesTags"),
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
      tags: t("ResearchHub.HanNomHub.hub.projects.ocrTags"),
      blurb: t("ResearchHub.HanNomHub.hub.projects.ocrBlurb"),
      cta: t("ResearchHub.HanNomHub.hub.projects.ocrCta"),
      href: "https://ocr.digitizingvietnam.com/en",
      external: true,
      icon: Scan,
    },
    {
      name: t("ResearchHub.HanNomHub.DateConverter.title"),
      tags: t("ResearchHub.HanNomHub.hub.projects.dateTags"),
      blurb: t("ResearchHub.HanNomHub.hub.projects.dateBlurb"),
      cta: t("ResearchHub.HanNomHub.hub.projects.dateCta"),
      href: "/tools/date-converter",
      icon: CalendarDays,
    },
  ];

  // One surface per job, rather than one card class for everything.
  const panelClass =
    "bg-white rounded-2xl border-t-4 border-branding-brown shadow-lg shadow-branding-brown/5";
  const flatCardClass =
    "bg-white/70 rounded-xl border border-branding-brown/20 hover:border-branding-brown/60 transition-colors";
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
    <div className="flex flex-col items-center max-width w-full">
      <div className="w-full mb-20">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "research" },
            { label: t("ResearchHub.HanNomHub.hero.title") },
          ]}
        />

        {/* --- Hero ------------------------------------------------------- */}
        <section className="relative isolate mt-2 overflow-hidden rounded-2xl px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-16">
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

          <div className="max-w-3xl">
            {/* The hub's own name, which the headline below does not say. It
                sits where the eyebrow did, a size up from decoration. */}
            <p className="flex items-center gap-3 text-xs sm:text-sm uppercase tracking-[0.2em] text-branding-brown font-bold mb-4">
              <span className="h-px w-8 bg-branding-brown/60" aria-hidden />
              {t("ResearchHub.HanNomHub.hero.title")}
            </p>
            <h1
              className={`${merriweather.className} text-4xl sm:text-5xl xl:text-[3.25rem] leading-[1.1] text-branding-black mb-4`}
            >
              {t("ResearchHub.HanNomHub.intro.title")}
            </h1>
            <span
              aria-hidden
              className="block h-1 w-16 rounded-full bg-branding-brown mb-5"
            />
            <p className="text-lg text-branding-black/70 leading-relaxed max-w-xl mb-7">
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
              <a
                href="#about"
                className="inline-flex items-center gap-2 rounded-lg border border-branding-black/25 bg-white/60 px-6 py-3 text-sm font-bold text-branding-black hover:border-branding-brown hover:text-branding-brown hover:-translate-y-0.5 transition-all"
              >
                {t("ResearchHub.HanNomHub.hub.ctaSecondary")}
              </a>
            </div>
          </div>
        </section>

        {/* --- The four sections of the hub -------------------------------- */}
        <section className="mt-10 lg:mt-14 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
          {navGroups.map((group) => (
            <div
              key={group.title}
              className="flex flex-col bg-white/70 rounded-xl border-l-4 border-branding-brown shadow-sm shadow-branding-brown/5 p-5"
            >
              <h2
                className={`${merriweather.className} flex items-center gap-2 text-[15px] text-branding-black font-bold pb-2.5 mb-3 border-b border-branding-brown/25`}
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
        <section className={`${panelClass} mt-12 lg:mt-16 px-6 py-8 sm:px-8`}>
          <h2
            className={`${merriweather.className} flex items-center gap-3 text-2xl text-branding-black mb-6`}
          >
            <span className="h-px w-8 bg-branding-brown" aria-hidden />
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
                  <div className="relative h-40 sm:h-44 w-full border-b border-branding-brown/20 bg-branding-brown/5">
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
                <div className="p-7 flex flex-col justify-center">
                  <p className="flex items-center gap-2 uppercase tracking-widest text-branding-brown/70 text-[11px] font-bold mb-2">
                    <card.icon className="h-3.5 w-3.5" aria-hidden />
                    {t(`ResearchHub.HanNomHub.cards.${card.key}.label`)}
                  </p>
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
        <section
          id="search"
          className={`${panelClass} mt-12 lg:mt-16 overflow-hidden`}
        >
          {/* Two rows, shared by both halves through subgrid: whichever
              heading block is taller sets the line the two search boxes
              start from, so they sit level on desktop. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-[auto_1fr] divide-y lg:divide-y-0 lg:divide-x divide-branding-brown/15">
            <div className="p-6 sm:p-8 lg:row-span-2 lg:grid lg:grid-rows-subgrid">
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
              <div className="mt-5">
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
            <div className="p-6 sm:p-8 text-center lg:row-span-2 lg:grid lg:grid-rows-subgrid">
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
              <VietDienSearch />
            </div>
          </div>
        </section>

        {/* --- Projects and tools ------------------------------------------- */}
        <section className="mt-12 lg:mt-16">
          <div className="flex items-end justify-between gap-4 mb-6">
            <h2
              className={`${merriweather.className} flex items-center gap-3 text-2xl text-branding-black`}
            >
              <span className="h-px w-8 bg-branding-brown" aria-hidden />
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
                    <p className="mt-1 uppercase tracking-[0.15em] text-[10px] font-bold text-branding-brown/70">
                      {project.tags}
                    </p>
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

        {/* --- About ------------------------------------------------------- */}
        <section id="about" className="mt-12 lg:mt-16 scroll-mt-32 max-w-3xl">
          <h2
            className={`${merriweather.className} text-xl text-branding-brown mb-3`}
          >
            {t("ResearchHub.HanNomHub.hub.about")}
          </h2>
          <p className="text-base text-branding-black/70 leading-relaxed">
            {t("ResearchHub.HanNomHub.intro.description")}
          </p>
        </section>
      </div>
    </div>
  );
}
