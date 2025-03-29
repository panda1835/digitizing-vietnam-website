import { Link } from "@/i18n/routing";

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { getTranslations } from "next-intl/server";

import { Merriweather } from "next/font/google";
import { Separator } from "@/components/ui/separator";

import { ChevronRight } from "lucide-react";

interface ToolLinkProps {
  title: string;
  description: string;
  href: string;
}

const ToolLink = ({ title, description, href }: ToolLinkProps) => {
  return (
    <Link
      href={href}
      className={`font-light font-['Helvetica Neue'] block py-6 transition-colors`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-normal text-branding-black hover:underline">
            {title}
          </h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex-shrink-0 h-6 w-6">
          <ChevronRight className="h-full w-full text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
};

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const HanNomDictionaries = async ({ params: { locale } }) => {
  const t = await getTranslations();

  const dictionaries = [
    {
      href: "/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai",
      title: t(
        "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.name"
      ),
      description: t(
        "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.description"
      ),
      target: "",
      rel: "",
    },
    {
      href: "/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet",
      title: t(
        "Tools.han-nom-dictionaries.dictionaries.giup-doc-nom-va-han-viet.name"
      ),
      description: t(
        "Tools.han-nom-dictionaries.dictionaries.giup-doc-nom-va-han-viet.description"
      ),
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
            { label: t("Tools.han-nom-dictionaries.name") },
          ]}
        />
        {/* Headline */}
        <div
          className={`${merriweather.className} text-branding-black text-4xl`}
        >
          {t("Tools.han-nom-dictionaries.name")}
        </div>

        {/* Subheadline */}
        <div
          className={`font-light font-['Helvetica Neue'] text-muted-foreground leading-relaxed mt-8 max-w-4xl`}
        >
          {t("Tools.han-nom-dictionaries.description")}
        </div>

        <div className="mt-28">
          <Separator />
        </div>
        <div className="mt-10 ">
          <div className="px-10 rounded-lg border border-gray-200 bg-transparent overflow-hidden">
            {dictionaries.map((tool, index) => (
              <div key={tool.href}>
                <ToolLink
                  title={tool.title}
                  description={tool.description}
                  href={tool.href}
                />
                {index < dictionaries.length - 1 && (
                  <div className="h-px bg-gray-200 mx-6" />
                )}
              </div>
            ))}
          </div>
          {/* {dictionaries.map((tool, index) => (
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
          ))} */}
        </div>
      </div>
    </div>
  );
};

export default HanNomDictionaries;
