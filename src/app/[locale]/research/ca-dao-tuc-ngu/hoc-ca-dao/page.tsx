import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/common/PageHeader";
import { HocCaDaoContent } from "@/components/tools/ca-dao-tuc-ngu/HocCaDaoContent";
import path from "path";
import fs from "fs/promises";

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

  let initialData = [];
  try {
    const dataFilePath = path.join(
      process.cwd(),
      "public/data/ca-dao-tuc-ngu/learning-data.json"
    );
    const fileContents = await fs.readFile(dataFilePath, "utf8");
    initialData = JSON.parse(fileContents);
  } catch (error) {
    console.error("Failed to load learning data on server:", error);
  }

  return (
    <div className="flex flex-col items-center max-width w-full">
      <div className="w-full mb-20 px-4 md:px-0">
        <PageHeader
          title={t("Tools.ca-dao-tuc-ngu.hoc-ca-dao.title")}
          subtitle={t("Tools.ca-dao-tuc-ngu.hoc-ca-dao.subtitle")}
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
          <HocCaDaoContent locale={locale} initialData={initialData} />
        </div>
      </div>
    </div>
  );
}
