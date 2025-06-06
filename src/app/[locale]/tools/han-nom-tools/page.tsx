import { ToolList } from "../ToolList";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/common/PageHeader";

const KieuTools = async ({ params: { locale } }) => {
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
