import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { getTranslations } from "next-intl/server";

import { Merriweather } from "next/font/google";
import { Separator } from "@/components/ui/separator";
import { ToolList } from "../ToolList";

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
          <ToolList tools={dictionaries} />
        </div>
      </div>
    </div>
  );
};

export default HanNomDictionaries;
