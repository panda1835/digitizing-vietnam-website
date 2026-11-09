import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/common/PageHeader";
import { IntroContent } from "@/components/tools/kho-tang-tuc-ngu/IntroContent";
import { routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("Tools.ca-dao-tuc-ngu.kho-tang.title")} | Digitizing Việt Nam`,
  };
}

// Prerendered, so intro.md is read from disk at build time only.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function KhoTangTucNguPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="flex flex-col items-center max-width w-full">
      <div className="w-full mb-20 px-4 md:px-0">
        <PageHeader
          title={t("Tools.ca-dao-tuc-ngu.kho-tang.title")}
          subtitle={t("Tools.ca-dao-tuc-ngu.kho-tang.intro-subtitle")}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            {
              label: t("Tools.ca-dao-tuc-ngu.name"),
              href: "/research/ca-dao-tuc-ngu",
            },
            { label: t("Tools.ca-dao-tuc-ngu.kho-tang.title") },
          ]}
          locale={locale}
        />

        <div className="mt-8 w-full">
          <IntroContent
            enterLabel={t("Tools.ca-dao-tuc-ngu.kho-tang.enter-list")}
            tocLabel={t("Tools.ca-dao-tuc-ngu.kho-tang.toc")}
          />
        </div>
      </div>
    </div>
  );
}
