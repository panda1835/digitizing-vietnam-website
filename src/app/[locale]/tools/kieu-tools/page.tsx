import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { ToolList } from "../ToolList";
import { getTranslations } from "next-intl/server";

import { Merriweather } from "next/font/google";
import { Separator } from "@/components/ui/separator";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

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
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[
            { label: t("NavigationBar.tools"), href: "tools" },
            { label: t("Tools.kieu-tools.name") },
          ]}
        />
        {/* Headline */}
        <div
          className={`${merriweather.className} text-branding-black text-4xl`}
        >
          {t("Tools.kieu-tools.name")}
        </div>

        {/* Subheadline */}
        <div
          className={`font-light font-['Helvetica Neue'] leading-relaxed mt-8 max-w-4xl`}
        >
          {t("Tools.kieu-tools.description")}
        </div>

        <div className="mt-28">
          <Separator />
        </div>

        <div className="mt-10">
          <ToolList tools={tools} />
        </div>
      </div>
    </div>
  );
};

export default KieuTools;
