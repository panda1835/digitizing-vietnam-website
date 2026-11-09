import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/common/PageHeader";
import { TraCuuContent } from "@/components/tools/kho-tang-tuc-ngu/TraCuuContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("Tools.ca-dao-tuc-ngu.kho-tang.list-title")} | ${t("Tools.ca-dao-tuc-ngu.kho-tang.title")} | Digitizing Việt Nam`,
  };
}

export default async function KhoTangTraCuuPage({
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
          title={t("Tools.ca-dao-tuc-ngu.kho-tang.list-title")}
          subtitle={t("Tools.ca-dao-tuc-ngu.kho-tang.list-subtitle")}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            {
              label: t("Tools.ca-dao-tuc-ngu.name"),
              href: "/research/ca-dao-tuc-ngu",
            },
            {
              label: t("Tools.ca-dao-tuc-ngu.kho-tang.title"),
              href: "/research/ca-dao-tuc-ngu/kho-tang-tuc-ngu",
            },
            { label: t("Tools.ca-dao-tuc-ngu.kho-tang.list-title") },
          ]}
          locale={locale}
        />

        <div className="mt-8 w-full">
          {/* The filters live in the URL query, read with useSearchParams. */}
          <Suspense>
            <TraCuuContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
