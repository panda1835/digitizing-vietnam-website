import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { getTranslations } from "next-intl/server";

import { Merriweather } from "next/font/google";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const Tools = async ({ params: { locale } }) => {
  const t = await getTranslations();

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
        <p className="mt-10 text-muted-foreground">To be updated soon</p>
      </div>
    </div>
  );
};

export default Tools;
