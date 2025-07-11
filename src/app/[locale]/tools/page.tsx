import { getTranslations } from "next-intl/server";

import { Merriweather } from "next/font/google";
import { Metadata } from "next";

import { InfoCard } from "@/components/common/InfoCard";
import { PageHeader } from "@/components/common/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("NavigationBar.tools")} | Digitizing Việt Nam`,
  };
}

export const dynamic = "force-static";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const Tools = async ({ params: { locale } }) => {
  const t = await getTranslations();
  const tools = [
    {
      href: "https://ocr.digitizingvietnam.com",
      target: "_blank",
      rel: "noopener noreferrer",
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
  ];
  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("NavigationBar.tools")}
          subtitle={t("Tools.subtitle")}
          breadcrumbItems={[{ label: t("NavigationBar.tools") }]}
          locale={locale}
        />
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

        {/* <iframe
          src="https://kimtudien.com.vn"
          width="100%"
          height="600"
          frameBorder="0"
          title="Embedded Website"
        ></iframe> */}
      </div>
    </div>
  );
};

export default Tools;
