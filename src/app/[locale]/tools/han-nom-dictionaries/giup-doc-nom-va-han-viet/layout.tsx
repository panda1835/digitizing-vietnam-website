import type React from "react";
import { getTranslations } from "next-intl/server";

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import NavLink from "../NavLink";

import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: `${t(
      "Tools.han-nom-dictionaries.dictionaries.giup-doc-nom-va-han-viet.name"
    )} | Digitizing Việt Nam`,
    description: t(
      "Tools.han-nom-dictionaries.dictionaries.giup-doc-nom-va-han-viet.description"
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
              label: t(
                "Tools.han-nom-dictionaries.dictionaries.giup-doc-nom-va-han-viet.name"
              ),
            },
          ]}
        />
      </div>
      <div className="w-full pb-16 flex flex-col lg:flex-row gap-16 lg:gap-8">
        {/* Sidebar navigation */}
        <aside className="w-full lg:w-96 shrink-0 font-light font-['Helvetica Neue']">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="text-lg font-normal text-branding-brown">
                {t(
                  "Tools.han-nom-dictionaries.dictionaries.giup-doc-nom-va-han-viet.name"
                )}
              </div>
            </div>

            <nav className="flex flex-col">
              <NavLink href="/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet/introduction">
                {locale === "en" ? "Introduction" : "Lời dẫn"}
              </NavLink>

              <NavLink href="/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet">
                {locale === "en" ? "Dictionary" : "Từ điển"}
              </NavLink>
            </nav>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
