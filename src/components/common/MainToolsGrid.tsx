import { getTranslations } from "next-intl/server";

import { InfoCard } from "@/components/common/InfoCard";

interface MainTool {
  href: string;
  name: string;
  description: string;
  target?: "_blank";
}

export async function MainToolsGrid() {
  const t = await getTranslations();

  const tools: MainTool[] = [
    {
      href: "https://ocr.digitizingvietnam.com",
      target: "_blank",
      name: t("Tools.image-ocr-platform.name"),
      description: t("Tools.image-ocr-platform.description"),
    },
    {
      href: "/tools/han-nom-dictionaries",
      name: t("Tools.han-nom-dictionaries.name"),
      description: t("Tools.han-nom-dictionaries.description"),
    },
    {
      href: "/tools/kieu-tools",
      name: t("Tools.kieu-tools.name"),
      description: t("Tools.kieu-tools.description"),
    },
    {
      href: "/tools/han-nom-tools",
      name: t("Tools.han-nom-tools.name"),
      description: t("Tools.han-nom-tools.description"),
    },
    {
      href: "/tools/digital-humanities-tools",
      name: t("Tools.digital-humanities-tools.name"),
      description: t("Tools.digital-humanities-tools.description"),
    },
    {
      href: "/tools/date-converter",
      name: t("Tools.date-converter.name"),
      description: t("Tools.date-converter.description"),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
      {tools.map((tool) => (
        <div key={tool.name}>
          <InfoCard
            name={tool.name}
            description={tool.description}
            url={tool.href}
            newTab={tool.target === "_blank"}
          />
        </div>
      ))}
    </div>
  );
}

