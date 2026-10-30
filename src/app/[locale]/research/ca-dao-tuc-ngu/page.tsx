import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/common/PageHeader";
import { Merriweather } from "next/font/google";

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("Tools.ca-dao-tuc-ngu.name")} | Digitizing Việt Nam`,
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
      title: t("Tools.ca-dao-tuc-ngu.sidebar.archive-title"),
      items: [
        {
          label: t("Tools.ca-dao-tuc-ngu.sidebar.archive-item1"),
          href: "/our-collections/tuc-ngu-phong-dao-viet-nam",
        },
        {
          label: t("Tools.ca-dao-tuc-ngu.sidebar.archive-item2"),
          href: "#",
        },
        {
          label: t("Tools.ca-dao-tuc-ngu.sidebar.archive-item3"),
          href: "#",
        },
      ],
    },
    {
      title: t("Tools.ca-dao-tuc-ngu.sidebar.tools-title"),
      items: [
        {
          label: t("Tools.ca-dao-tuc-ngu.sidebar.tools-item1"),
          href: "/research/ca-dao-tuc-ngu/tu-dien",
        },
        {
          label: t("Tools.ca-dao-tuc-ngu.sidebar.tools-item2"),
          href: "https://ca-dao.richardhoa.io.vn/qa-page",
        },
      ],
    },
    {
      title: t("Tools.ca-dao-tuc-ngu.sidebar.learning-title"),
      items: [
        {
          label: t("Tools.ca-dao-tuc-ngu.sidebar.learning-item1"),
          href: "/research/ca-dao-tuc-ngu/hoc-ca-dao",
        },
      ],
    },
  ];

  const tocList = (
    <ul className="space-y-6 lg:space-y-11">
      {tocGroups.map((group) => (
        <li key={group.title}>
          <p
            className={`${merriweather.className} text-base lg:text-lg leading-none tracking-[0.1em] text-branding-brown font-bold`}
          >
            {group.title}
          </p>
          <ul className="mt-3 lg:mt-5 pl-4 lg:pl-5 pr-0 lg:pr-4 py-1 space-y-2 border-l border-branding-brown/30">
            {group.items.map((item) => {
              const isExternal = item.href.startsWith("http");
              const isPlaceholder = item.href === "#";
              return (
                <li key={item.label} className="list-none">
                  {isPlaceholder ? (
                    <span className="font-['Helvetica Neue'] text-[15px] lg:text-[16px] leading-[1.35] text-[#b4b4b4] font-medium cursor-not-allowed">
                      {item.label}
                    </span>
                  ) : isExternal ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-['Helvetica Neue'] text-[15px] lg:text-[16px] leading-[1.35] text-[#747474] font-medium hover:text-branding-brown transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="font-['Helvetica Neue'] text-[15px] lg:text-[16px] leading-[1.35] text-[#747474] font-medium hover:text-branding-brown transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col items-center max-width w-full">
      <div className="w-full mb-20 px-4 md:px-0">
        <PageHeader
          title={t("Tools.ca-dao-tuc-ngu.name")}
          subtitle=""
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            { label: t("Tools.ca-dao-tuc-ngu.name") },
          ]}
          locale={locale}
        />

        <div className="mt-12 flex flex-col lg:flex-row gap-12 justify-center w-full">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            <nav className="lg:sticky lg:top-32">{tocList}</nav>
          </aside>

          {/* Main Content */}
          <main className="flex flex-col gap-10 max-w-5xl w-full">
            {/* Hero Section */}
            <section id="intro" className="scroll-mt-32">
              <h2
                className={`${merriweather.className} text-3xl md:text-5xl text-branding-black font-normal mb-3 leading-tight`}
              >
                {t("Tools.ca-dao-tuc-ngu.hero.title")}
              </h2>
              <p
                className={`${merriweather.className} text-xl md:text-2xl text-branding-brown italic font-normal mb-8 leading-relaxed`}
              >
                {t("Tools.ca-dao-tuc-ngu.hero.subtitle")}
              </p>
              <p className="text-base text-branding-black/80 font-light leading-relaxed">
                {t("Tools.ca-dao-tuc-ngu.hero.intro")}
              </p>
            </section>

            {/* Mobile Sidebar */}
            <section className="lg:hidden">
              <nav className="rounded-2xl border border-branding-brown/15 bg-white/60 p-5">
                {tocList}
              </nav>
            </section>

            {/* 2x2 Grid of Cards */}
            <section id="grid-content" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                {/* Card 01 */}
                <div className="bg-white p-8 rounded-3xl border border-branding-brown/10 shadow-sm flex flex-col justify-between min-h-[320px]">
                  <div>
                    <span className="block text-4xl md:text-5xl font-normal text-branding-brown mb-4">
                      01
                    </span>
                    <h3
                      className={`${merriweather.className} text-xl md:text-2xl text-branding-black font-bold mb-4 leading-snug`}
                    >
                      {t("Tools.ca-dao-tuc-ngu.cards.dictionary.title")}
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 text-branding-black/80 font-light text-[15px] leading-relaxed mb-6">
                      <li>
                        {t("Tools.ca-dao-tuc-ngu.cards.dictionary.bullet1")}
                      </li>
                      <li>
                        {t("Tools.ca-dao-tuc-ngu.cards.dictionary.bullet2")}
                      </li>
                      <li>
                        {t("Tools.ca-dao-tuc-ngu.cards.dictionary.bullet3")}
                      </li>
                    </ul>
                  </div>
                  <Link
                    href="/research/ca-dao-tuc-ngu/tu-dien"
                    className="self-start inline-flex items-center gap-2 px-6 py-3 bg-branding-black text-white text-sm font-bold rounded-lg hover:bg-branding-black/90 transition-colors"
                  >
                    {t("Tools.ca-dao-tuc-ngu.cards.dictionary.cta")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Card 02 */}
                <div className="bg-white p-8 rounded-3xl border border-branding-brown/10 shadow-sm flex flex-col justify-between min-h-[320px]">
                  <div>
                    <span className="block text-4xl md:text-5xl font-normal text-branding-brown mb-4">
                      02
                    </span>
                    <h3
                      className={`${merriweather.className} text-xl md:text-2xl text-branding-black font-bold mb-4 leading-snug`}
                    >
                      {t("Tools.ca-dao-tuc-ngu.cards.fairy-tales.title")}
                    </h3>
                    <p className="text-branding-black/80 font-light text-[15px] leading-relaxed mb-6">
                      {t("Tools.ca-dao-tuc-ngu.cards.fairy-tales.description")}
                    </p>
                  </div>
                  <button
                    disabled
                    className="self-start inline-flex items-center gap-2 px-6 py-3 bg-branding-gray text-branding-black/35 text-sm font-bold rounded-lg cursor-not-allowed"
                  >
                    {t("Tools.ca-dao-tuc-ngu.cards.fairy-tales.cta")}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Card 03 */}
                <div className="bg-white p-8 rounded-3xl border border-branding-brown/10 shadow-sm flex flex-col justify-between min-h-[320px]">
                  <div>
                    <span className="block text-4xl md:text-5xl font-normal text-branding-brown mb-4">
                      03
                    </span>
                    <h3
                      className={`${merriweather.className} text-xl md:text-2xl text-branding-black font-bold mb-4 leading-snug`}
                    >
                      {t("Tools.ca-dao-tuc-ngu.cards.qa.title")}
                    </h3>
                    <p className="text-branding-black/80 font-light text-[15px] leading-relaxed mb-6">
                      {t("Tools.ca-dao-tuc-ngu.cards.qa.description")}
                    </p>
                  </div>
                  <a
                    href="https://ca-dao.richardhoa.io.vn/qa-page"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start inline-flex items-center gap-2 px-6 py-3 bg-branding-black text-white text-sm font-bold rounded-lg hover:bg-branding-black/90 transition-colors"
                  >
                    {t("Tools.ca-dao-tuc-ngu.cards.qa.cta")}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>

                {/* Card 04 */}
                <div className="bg-white p-8 rounded-3xl border border-branding-brown/10 shadow-sm flex flex-col justify-between min-h-[320px]">
                  <div>
                    <span className="block text-4xl md:text-5xl font-normal text-branding-brown mb-4">
                      04
                    </span>
                    <h3
                      className={`${merriweather.className} text-xl md:text-2xl text-branding-black font-bold mb-4 leading-snug`}
                    >
                      {t("Tools.ca-dao-tuc-ngu.cards.learning.title")}
                    </h3>
                    <p className="text-branding-black/80 font-light text-[15px] leading-relaxed mb-6">
                      {t("Tools.ca-dao-tuc-ngu.cards.learning.description")}
                    </p>
                  </div>
                  <Link
                    href="/research/ca-dao-tuc-ngu/hoc-ca-dao"
                    className="self-start inline-flex items-center gap-2 px-6 py-3 bg-branding-black text-white text-sm font-bold rounded-lg hover:bg-branding-black/90 transition-colors"
                  >
                    {t("Tools.ca-dao-tuc-ngu.cards.learning.cta")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
