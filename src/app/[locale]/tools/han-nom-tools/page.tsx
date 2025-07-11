import { ToolList } from "../ToolList";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/common/PageHeader";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: `${t("Tools.han-nom-tools.name")} | Digitizing Việt Nam`,
    description: t("Tools.han-nom-tools.description"),
  };
}

export const dynamic = "force-static";

export default async function HanNomTools({ params: { locale } }) {
  const t = await getTranslations();
  const tools = [
    {
      href: "/tools/han-nom-tools/nom-character-classification-and-analysis-tool",
      title: t(
        "Tools.han-nom-tools.tools.nom-character-classification-and-analysis-tool.name"
      ),
      description: t(
        "Tools.han-nom-tools.tools.nom-character-classification-and-analysis-tool.description"
      ),
      target: "",
      rel: "",
    },
    {
      href: "/tools/han-nom-tools/han-nom-input-method-editor",
      title: t("Tools.han-nom-tools.tools.han-nom-input-method-editor.name"),
      description: t(
        "Tools.han-nom-tools.tools.han-nom-input-method-editor.description"
      ),
      target: "",
      rel: "",
    },
  ];
  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("Tools.han-nom-tools.name")}
          subtitle={t("Tools.han-nom-tools.description")}
          breadcrumbItems={[
            { label: t("NavigationBar.tools"), href: "tools" },
            { label: t("Tools.han-nom-tools.name") },
          ]}
          locale={locale}
        />
        <div className="mt-10">
          <ToolList tools={tools} />
        </div>
      </div>
    </div>
  );
}
