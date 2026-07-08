import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/common/PageHeader";
import { HocCaDaoContent } from "@/components/tools/ca-dao-tuc-ngu/HocCaDaoContent";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("Tools.ca-dao-tuc-ngu.hoc-ca-dao.title")} | Digitizing Việt Nam`,
  };
}

export default async function HocCaDaoSubpage({
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
          title={t("Tools.ca-dao-tuc-ngu.hoc-ca-dao.title")}
          subtitle=""
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            {
              label: t("Tools.ca-dao-tuc-ngu.name"),
              href: "/research/ca-dao-tuc-ngu",
            },
            { label: t("Tools.ca-dao-tuc-ngu.hoc-ca-dao.title") },
          ]}
          locale={locale}
        />

        <div className="mt-8 w-full">
          <HocCaDaoContent locale={locale} />
        </div>
      </div>
    </div>
  );
}
