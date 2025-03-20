import { Link } from "@/i18n/routing";

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { getTranslations } from "next-intl/server";

import { Merriweather } from "next/font/google";

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
  ];
  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[{ label: t("NavigationBar.tools") }]}
        />
        <div
          className={`${merriweather.className} text-branding-black text-4xl`}
        >
          {t("NavigationBar.tools")}
        </div>
        <div className="flex flex-col mt-10 space-y-3">
          {tools.map((tool, index) => (
            <div key={index}>
              <Link
                className="hover:cursor-pointer hover:underline"
                href={tool.href}
                target={tool.target}
                rel={tool.rel}
              >
                <div>{tool.name}</div>
              </Link>
              {tool.description && (
                <div className="text-muted-foreground text-sm mt-2">
                  {tool.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tools;
