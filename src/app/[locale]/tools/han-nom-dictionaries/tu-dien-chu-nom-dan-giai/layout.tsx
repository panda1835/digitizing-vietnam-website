import type React from "react";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";

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
            { label: t("Tools.han-nom-dictionaries.name") },
          ]}
        />
      </div>
      <div className="container pb-16 flex flex-col md:flex-row gap-8">
        {/* Sidebar navigation */}
        <aside className="w-full md:w-96 shrink-0 font-light font-['Helvetica Neue']">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="text-lg font-normal text-branding-brown">
                Từ Điển Chữ Nôm Dẫn Giải
              </div>
            </div>

            <nav className="flex flex-col">
              <NavLink href="/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/introduction">
                Introduction
              </NavLink>
              <NavLink href="/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai">
                Dictionary
              </NavLink>
              <NavLink href="/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/arrangement-of-entries">
                Arrangement of Entries
              </NavLink>
              <NavLink href="/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/chu-nom-structure">
                Chữ Nôm Structure
              </NavLink>
              <NavLink href="/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/source-texts">
                Source Texts
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

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="py-3 px-6 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors relative group"
    >
      <span className="text-gray-800">{children}</span>
      <span className="absolute left-0 top-0 bottom-0 w-1 bg-branding-brown opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
