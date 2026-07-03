import type React from "react";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import JumpToSourceMenu from "./JumpToSourceMenu";

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
      <div className="w-full pb-16 flex flex-col lg:flex-row gap-16 lg:gap-8">
        <aside className="hidden lg:block shrink-0 font-light font-['Helvetica Neue'] lg:sticky lg:top-20 self-start">
          <JumpToSourceMenu locale={locale} />
        </aside>

        {/* Main content area */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
