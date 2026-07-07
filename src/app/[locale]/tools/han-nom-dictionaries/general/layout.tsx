import type React from "react";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: `${t(
      "Tools.han-nom-dictionaries.dictionaries.general.name"
    )} | Digitizing Việt Nam`,
    description: t(
      "Tools.han-nom-dictionaries.dictionaries.general.description"
    ),
  };
}

export default async function DictionaryLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const t = await getTranslations();
  return (
    // <div className="min-h-screen relative overflow-hidden">
    <div className="flex flex-col items-center max-width">
      <div className="flex-col  w-full">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[
            { label: t("NavigationBar.tools"), href: "tools" },
            {
              label: t("Tools.han-nom-dictionaries.name"),
              href: "tools/han-nom-dictionaries",
            },
            {
              label: t("Tools.han-nom-dictionaries.dictionaries.general.name"),
            },
          ]}
        />
      </div>
      {/* Jump-to-source + filter now live in a sticky gutter sidebar / collapsed
          control rendered by the results component, so the main content spans the
          full max-width here. */}
      <div className="w-full pb-16">
        <main>{children}</main>
      </div>
    </div>
  );
}
