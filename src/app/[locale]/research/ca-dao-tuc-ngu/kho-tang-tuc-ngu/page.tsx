import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/common/PageHeader";
import { IntroContent } from "@/components/tools/kho-tang-tuc-ngu/IntroContent";
import {
  AVAILABLE_LETTERS,
  EXPORTED_PARTS,
  TOTAL_PARTS,
} from "@/components/tools/kho-tang-tuc-ngu/data";
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
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="w-full mb-20">
        <PageHeader
          title={t("Tools.ca-dao-tuc-ngu.kho-tang.title")}
          subtitle={t("Tools.ca-dao-tuc-ngu.kho-tang.intro-subtitle")}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "research" },
            {
              label: t("Tools.ca-dao-tuc-ngu.name"),
              href: "research/ca-dao-tuc-ngu",
            },
            { label: t("Tools.ca-dao-tuc-ngu.kho-tang.title") },
          ]}
          locale={locale}
        />

        <div className="mt-8 w-full">
          <IntroContent
            enterLabel={t("Tools.ca-dao-tuc-ngu.kho-tang.enter-list")}
            tocLabel={t("Tools.ca-dao-tuc-ngu.kho-tang.toc")}
            progressLabel={t("Tools.ca-dao-tuc-ngu.kho-tang.progress", {
              parts: EXPORTED_PARTS,
              total: TOTAL_PARTS,
              letters: `${AVAILABLE_LETTERS[0]}–${
                AVAILABLE_LETTERS[AVAILABLE_LETTERS.length - 1]
              }`,
            })}
          />
        </div>
      </div>
    </div>
  );
}
