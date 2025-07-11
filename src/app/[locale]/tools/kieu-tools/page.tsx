import { ToolList } from "../ToolList";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/common/PageHeader";

import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: `${t("Tools.kieu-tools.name")} | Digitizing Việt Nam`,
    description: t("Tools.kieu-tools.description"),
  };
}

export const dynamic = "force-static";

const KieuTools = async ({ params: { locale } }) => {
  const t = await getTranslations();
  const tools = [
    {
      href: "/tools/kieu-tools/character-frequency",
      title: t("Tools.kieu-tools.tools.glossary.name"),
      description: t("Tools.kieu-tools.tools.glossary.description"),
      target: "",
      rel: "",
    },
  ];
  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("Tools.kieu-tools.name")}
          subtitle={t("Tools.kieu-tools.description")}
          breadcrumbItems={[
            { label: t("NavigationBar.tools"), href: "tools" },
            { label: t("Tools.kieu-tools.name") },
          ]}
          locale={locale}
        />
        <div className="mt-10">
          <ToolList tools={tools} />
        </div>
      </div>
    </div>
  );
};

export default KieuTools;
