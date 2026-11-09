import { Metadata } from "next";
import { SITE_URL } from "@/utils/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  GraduationCap,
  Layers,
  MessageCircle,
  Search,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { InfoCard } from "@/components/common/InfoCard";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { Merriweather } from "next/font/google";

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: "Tools.ca-dao-tuc-ngu",
  });
  const title = `${t("seo.title")} | Digitizing Việt Nam`;
  const description = t("seo.description");
  const url = `${SITE_URL}/${locale}/research/ca-dao-tuc-ngu`;
  const image = {
    url: `${SITE_URL}/images/research-hub/opengraph-image.png`,
    width: 1200,
    height: 630,
    alt: t("seo.image-alt"),
  };

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_URL}/en/research/ca-dao-tuc-ngu`,
        vi: `${SITE_URL}/vi/research/ca-dao-tuc-ngu`,
      },
    },
    openGraph: {
      type: "website",
      siteName: "Digitizing Việt Nam",
      title,
      description,
      url,
      locale: locale === "vi" ? "vi_VN" : "en_US",
      alternateLocale: locale === "vi" ? "en_US" : "vi_VN",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function CaDaoTucNguPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();

  const tocGroups = [
    {
      title: locale === "vi" ? "Kho lưu trữ số" : "Digital Archives",
      icon: Layers,
      items: [
        {
          label: t("Tools.ca-dao-tuc-ngu.sidebar.archive-item1"),
          href: "/our-collections/vietnamese-folk-literature#folk-verses-proverbs",
        },
        {
          label: t("Tools.ca-dao-tuc-ngu.sidebar.archive-item2"),
          href: "/our-collections/vietnamese-folk-literature#folktales",
        },
      ],
    },
    {
      title: locale === "vi" ? "Công cụ số" : "Digital Tools",
      icon: Boxes,
      items: [
        {
          label: t("Tools.ca-dao-tuc-ngu.sidebar.tools-item1"),
          href: "/research/ca-dao-tuc-ngu/tu-dien",
        },
        {
          label: t("Tools.ca-dao-tuc-ngu.sidebar.tools-item3"),
          href: "/research/ca-dao-tuc-ngu/kho-tang-tuc-ngu/tra-cuu",
        },
        {
          label: t("Tools.ca-dao-tuc-ngu.sidebar.tools-item2"),
          href: "https://cadao.richardhoa.io.vn/qa-page",
        },
      ],
    },
    {
      title: locale === "vi" ? "Trung tâm học tập" : "Learning Center",
      icon: GraduationCap,
      items: [
        {
          label: t("Tools.ca-dao-tuc-ngu.sidebar.learning-item1"),
          href: "/research/ca-dao-tuc-ngu/hoc-ca-dao",
        },
      ],
    },
  ];

  const featuredContent = [
    {
      key: "folktales-collection",
      href: "/our-collections/vietnamese-folk-literature#folktales",
    },
    {
      key: "folk-verses-collection",
      href: "/our-collections/vietnamese-folk-literature#folk-verses-proverbs",
    },
  ];
  const tools = [
    {
      key: "fairy-tales",
      href: "/our-collections/vietnamese-folk-literature/truyen-co-tich-viet-nam",
      icon: Search,
    },
    {
      key: "cham-folktales",
      href: "/our-collections/vietnamese-folk-literature/truyen-co-dan-gian-cham",
      icon: Search,
    },
    {
      key: "kho-tang",
      href: "/research/ca-dao-tuc-ngu/kho-tang-tuc-ngu",
      icon: Search,
    },
    {
      key: "dictionary",
      href: "/research/ca-dao-tuc-ngu/tu-dien",
      icon: Search,
    },
    {
      key: "qa",
      href: "https://cadao.richardhoa.io.vn/qa-page",
      icon: MessageCircle,
    },
    {
      key: "learning",
      href: "/research/ca-dao-tuc-ngu/hoc-ca-dao",
      icon: GraduationCap,
    },
  ];
  const focusClass =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-branding-brown";
  const navLinkClass = `inline-flex items-start gap-0.5 text-[15px] leading-[1.4] text-branding-black/75 font-medium hover:text-[#956319] hover:underline underline-offset-2 ${focusClass}`;

  const pageUrl = `${SITE_URL}/${locale}/research/ca-dao-tuc-ngu`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: t("Tools.ca-dao-tuc-ngu.seo.title"),
        description: t("Tools.ca-dao-tuc-ngu.hero.intro"),
        inLanguage: locale,
        image: `${SITE_URL}/images/research-hub/opengraph-image.png`,
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: [...featuredContent, ...tools].map(
            (item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: t(`Tools.ca-dao-tuc-ngu.cards.${item.key}.title`),
              url: item.href.startsWith("https://")
                ? item.href
                : `${SITE_URL}/${locale}${item.href}`,
            })
          ),
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: t("ResearchHub.title"),
            item: `${SITE_URL}/${locale}/research`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: t("Tools.ca-dao-tuc-ngu.name"),
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\u003c"),
        }}
      />
      <div className="w-full mb-20">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "research" },
            { label: t("Tools.ca-dao-tuc-ngu.name") },
          ]}
        />

        <section className="relative isolate mt-2 overflow-hidden rounded-2xl px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <Image
            src="/images/research-hub/ca-dao-tuc-ngu.png"
            alt=""
            aria-hidden
            fill
            priority
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="-z-20 pointer-events-none select-none object-cover"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-white/35"
          />
          <h1
            className={`${merriweather.className} max-w-4xl text-4xl sm:text-5xl xl:text-[3.5rem] leading-[1.25] sm:leading-[1.25] xl:leading-[1.25] text-branding-black mb-4`}
          >
            {t("Tools.ca-dao-tuc-ngu.hero.title")}
          </h1>
          <p className="text-lg text-branding-black/70 leading-relaxed max-w-3xl mb-7">
            {t("Tools.ca-dao-tuc-ngu.hero.subtitle")}
          </p>
          <Link
            href="/our-collections/vietnamese-folk-literature#folk-verses-proverbs"
            className={`inline-flex items-center gap-2 rounded-lg bg-[#956319] px-6 py-3 text-sm font-bold text-white shadow-md shadow-branding-brown/20 hover:bg-[#805516] transition-colors ${focusClass}`}
          >
            {t("Tools.ca-dao-tuc-ngu.sidebar.archive-item1")}
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        </section>

        <section aria-labelledby="explore-heading" className="mt-8 lg:mt-10">
          <h2
            id="explore-heading"
            className={`${merriweather.className} text-[28px] sm:text-[32px] leading-relaxed text-branding-black mb-4`}
          >
            {t("Tools.ca-dao-tuc-ngu.sections.introduction")}
          </h2>
          <p className="w-full text-base leading-relaxed text-branding-black/75">
            {t("Tools.ca-dao-tuc-ngu.hero.intro")}
          </p>
          <nav
            aria-labelledby="explore-heading"
            className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5"
          >
            {tocGroups.map((group) => (
              <div
                key={group.title}
                className="flex flex-col bg-white/70 rounded-xl border border-branding-black/10 shadow-sm shadow-branding-brown/5 p-5"
              >
                <h3
                  className={`${merriweather.className} flex items-center gap-2 text-[15px] text-branding-black font-bold pb-2.5 mb-3 border-b border-branding-black/10`}
                >
                  <span className="p-1.5 rounded-md bg-branding-brown/10 text-branding-brown shrink-0">
                    <group.icon className="h-4 w-4" aria-hidden />
                  </span>
                  {group.title}
                </h3>
                <ul className="space-y-2.5">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      {item.href === "#" ? (
                        <span
                          className="text-[15px] leading-[1.4] text-branding-black/60"
                          aria-disabled="true"
                        >
                          {item.label}
                        </span>
                      ) : item.href.startsWith("http") ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={navLinkClass}
                        >
                          {item.label}
                          <ArrowUpRight
                            className="h-3 w-3 shrink-0 mt-[0.2em]"
                            aria-hidden
                          />
                        </a>
                      ) : (
                        <Link href={item.href} className={navLinkClass}>
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </section>

        <section aria-labelledby="featured-heading" className="mt-10">
          <h2
            id="featured-heading"
            className={`${merriweather.className} text-[28px] sm:text-[32px] leading-relaxed text-branding-black mb-4`}
          >
            {t("Tools.ca-dao-tuc-ngu.sections.featured")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {featuredContent.map((card) => (
              <InfoCard
                variant="resource"
                alignRows
                key={card.key}
                url={card.href}
                name={t(`Tools.ca-dao-tuc-ngu.cards.${card.key}.title`)}
                description={t(
                  `Tools.ca-dao-tuc-ngu.cards.${card.key}.description`
                )}
                ctaText={t(`Tools.ca-dao-tuc-ngu.cards.${card.key}.cta`)}
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="tools-heading" className="mt-10">
          <h2
            id="tools-heading"
            className={`${merriweather.className} text-[28px] sm:text-[32px] leading-relaxed text-branding-black mb-4`}
          >
            {t("Tools.ca-dao-tuc-ngu.sections.tools")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {tools.map((tool) => (
              <InfoCard
                variant="resource"
                alignRows
                key={tool.key}
                url={tool.href}
                newTab={tool.href.startsWith("https://")}
                name={t(`Tools.ca-dao-tuc-ngu.cards.${tool.key}.title`)}
                description={t(
                  `Tools.ca-dao-tuc-ngu.cards.${tool.key}.description`
                )}
                ctaText={t(`Tools.ca-dao-tuc-ngu.cards.${tool.key}.cta`)}
                icon={tool.icon}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
