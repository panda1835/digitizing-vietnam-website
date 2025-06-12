import type React from "react";
import { getTranslations } from "next-intl/server";

import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: `${t(
      "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.name"
    )} | Digitizing Việt Nam`,
    description: t(
      "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.description"
    ),
  };
}

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import NavLink from "../NavLink";
export default async function DictionaryLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const t = await getTranslations();
  return (
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
                "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.name"
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
                  "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.name"
                )}
              </div>
            </div>

            <nav className="flex flex-col">
              <NavLink href="/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/about-digital-version">
                {locale === "en"
                  ? "About the Digital Version"
                  : "Về phiên bản số thức"}
              </NavLink>
              <NavLink href="/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/introduction">
                {locale === "en" ? "Introduction" : "Lời dẫn"}
              </NavLink>
              <NavLink href="/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/arrangement-of-entries">
                {locale === "en"
                  ? "Arrangement of Entries"
                  : "Thể lệ biên soạn"}
              </NavLink>
              <NavLink href="/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai">
                {locale === "en" ? "Dictionary" : "Tự điển"}
              </NavLink>
              <NavLink href="/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/chu-nom-structure">
                {locale === "en"
                  ? "Chữ Nôm Structure"
                  : "Sơ đồ phân loại cấu trúc chữ Nôm"}
              </NavLink>
              <NavLink href="/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/source-texts">
                {locale === "en" ? "Source Texts" : "Nguồn dẫn chữ Nôm"}
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

// function NavLink({
//   href,
//   children,
// }: {
//   href: string;
//   children: React.ReactNode;
// }) {
//   const pathname = usePathname();
//   const isActive = pathname === href;

//   return (
//     <Link
//       href={href}
//       className={`py-3 px-6 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors relative group ${
//         isActive ? "bg-branding-brown text-white" : ""
//       }`}
//     >
//       <span className="text-gray-800">{children}</span>
//       <span className="absolute left-0 top-0 bottom-0 w-1 bg-branding-brown opacity-0 group-hover:opacity-100 transition-opacity" />
//     </Link>
//   );
// }
