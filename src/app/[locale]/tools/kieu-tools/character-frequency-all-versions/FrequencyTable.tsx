"use client";
import { PageHeader } from "@/components/common/PageHeader";
import { useTranslations, useLocale } from "next-intl";
import glossary from "./all_glossary.json";

import LookupableHanNomText from "@/components/common/LookupableHanNomText";
export default function FrequencyTable() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="flex flex-col max-width">
      <PageHeader
        title={t("Tools.kieu-tools.tools.glossary-all.name")}
        subtitle={t("Tools.kieu-tools.tools.glossary-all.description")}
        breadcrumbItems={[
          { label: t("NavigationBar.tools"), href: "tools" },
          { label: t("Tools.kieu-tools.name"), href: "tools/kieu-tools" },
          { label: t("Tools.kieu-tools.tools.glossary-all.name") },
        ]}
        locale={locale}
      />

      <div className="flex-col mb-20 max-w-5xl w-full items-start">
        <div className="flex justify-between items-center w-full my-6">
          <div className="text-xl font-['Helvetica Neue'] text-muted-foreground">
            {glossary[0][7]} {t("Tools.kieu-tools.tools.glossary.entries")}
          </div>
        </div>

        {glossary && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-branding-brown/70 text-white p-3 text-lg font-[Helvetica Neue] font-light"></th>
                  <th className="bg-branding-brown/70 text-white p-3 text-lg text-left font-[Helvetica Neue] font-light">
                    {t("Tools.kieu-tools.tools.glossary.version")}
                  </th>
                  <th className="bg-branding-brown/70 text-white p-3 text-lg text-right font-[Helvetica Neue] font-light">
                    1866
                  </th>
                  <th className="bg-branding-brown/70 text-white p-3 text-lg text-right font-[Helvetica Neue] font-light">
                    1870
                  </th>
                  <th className="bg-branding-brown/70 text-white p-3 text-lg text-right font-[Helvetica Neue] font-light">
                    1871
                  </th>
                  <th className="bg-branding-brown/70 text-white p-3 text-lg text-right font-[Helvetica Neue] font-light">
                    1872
                  </th>
                  <th className="bg-branding-brown/70 text-white p-3 text-lg text-right font-[Helvetica Neue] font-light">
                    1902
                  </th>
                </tr>
              </thead>
              <thead>
                <tr>
                  <th className="bg-branding-brown text-white p-3 text-lg font-[Helvetica Neue] font-light">
                    Nôm
                  </th>
                  <th className="bg-branding-brown text-white p-3 text-lg text-left font-[Helvetica Neue] font-light">
                    Quốc Ngữ
                  </th>
                  <th className="bg-branding-brown text-white p-3 text-lg text-right font-[Helvetica Neue] font-light">
                    {glossary[1][2]}
                  </th>
                  <th className="bg-branding-brown text-white p-3 text-lg text-right font-[Helvetica Neue] font-light">
                    {glossary[1][3]}
                  </th>
                  <th className="bg-branding-brown text-white p-3 text-lg text-right font-[Helvetica Neue] font-light">
                    {glossary[1][4]}
                  </th>
                  <th className="bg-branding-brown text-white p-3 text-lg text-right font-[Helvetica Neue] font-light">
                    {glossary[1][5]}
                  </th>
                  <th className="bg-branding-brown text-white p-3 text-lg text-right font-[Helvetica Neue] font-light">
                    {glossary[1][6]}
                  </th>
                </tr>
              </thead>
              <tbody>
                {glossary.slice(2, glossary.length - 1).map((entry, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
                  >
                    <td className={`border p-4 text-center`}>
                      <LookupableHanNomText
                        text={entry[0]}
                        className="text-2xl"
                      />
                    </td>
                    <td className="border p-4">{entry[1]}</td>
                    <td className="border p-4 text-right">{entry[2]}</td>
                    <td className="border p-4 text-right">{entry[3]}</td>
                    <td className="border p-4 text-right">{entry[4]}</td>
                    <td className="border p-4 text-right">{entry[5]}</td>
                    <td className="border p-4 text-right">{entry[6]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
