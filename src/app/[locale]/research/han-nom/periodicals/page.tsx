import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Merriweather } from "next/font/google";

import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/common/PageHeader";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("Periodicals.title")} | Digitizing Việt Nam`,
  };
}

export default async function PeriodicalsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();

  const periodicals = [
    {
      name: t("Periodicals.list.jvs.name"),
      description: t("Periodicals.list.jvs.description"),
      url: t("Periodicals.list.jvs.url"),
    },
    {
      name: t("Periodicals.list.tap-chi-han-nom.name"),
      description: t("Periodicals.list.tap-chi-han-nom.description"),
      url: t("Periodicals.list.tap-chi-han-nom.url"),
      // The one periodical here whose contents we hold in full, so it gets a
      // second link straight into them rather than only out to the publisher.
      contents: {
        href: "/research/han-nom/periodicals/tap-chi-han-nom",
        label:
          locale === "vi"
            ? "Xem mục lục đầy đủ →"
            : "Browse the full table of contents →",
      },
    },
    {
      name: t("Periodicals.list.befeo.name"),
      description: t("Periodicals.list.befeo.description"),
      url: t("Periodicals.list.befeo.url"),
    },
    {
      name: t("Periodicals.list.tap-chi-ngon-ngu.name"),
      description: t("Periodicals.list.tap-chi-ngon-ngu.description"),
      url: t("Periodicals.list.tap-chi-ngon-ngu.url"),
    },
    {
      name: t("Periodicals.list.tap-chi-nghien-cuu-phat-hoc.name"),
      description: t("Periodicals.list.tap-chi-nghien-cuu-phat-hoc.description"),
      url: t("Periodicals.list.tap-chi-nghien-cuu-phat-hoc.url"),
    },
  ];
  const category = { resources: periodicals };

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("Periodicals.title")}
          subtitle={t("Periodicals.description")}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            { label: t("ResearchHub.HanNomHub.hero.title"), href: "/research/han-nom" },
            { label: t("Periodicals.title") },
          ]}
          locale={locale}
        />

        <div className="mt-10">
          {category.resources.map((resource) => (
            <div key={resource.name} className="mb-8">
              <div
                className={`${merriweather.className} text-branding-black text-2xl leading-relaxed`}
              >
                {resource.url ? (
                  <Link
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-branding-brown"
                  >
                    {resource.name}
                  </Link>
                ) : (
                  resource.name
                )}
              </div>
              <p className="text-branding-black text-base font-light font-['Helvetica Neue'] leading-relaxed mt-2">
                {resource.description}
              </p>
              {"contents" in resource && resource.contents && (
                <Link
                  href={resource.contents.href}
                  className="inline-block mt-2 text-branding-brown underline underline-offset-2 hover:opacity-80"
                >
                  {resource.contents.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
