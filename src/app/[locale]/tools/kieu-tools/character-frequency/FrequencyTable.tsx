import { Merriweather } from "next/font/google";

import SelectVersion from "./SelectVersion";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { Separator } from "@/components/ui/separator";
import { getTranslations } from "next-intl/server";

import localFont from "next/font/local";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

import glossaryData1866 from "./1866_glossary.json";
import glossaryData1870 from "./1870_glossary.json";
import glossaryData1871 from "./1871_glossary.json";
import glossaryData1872 from "./1872_glossary.json";
import glossaryData1902 from "./1902_glossary.json";

export default async function FrequencyTable({
  version,
  locale,
}: {
  version: string;
  locale: string;
}) {
  let glossaryData;
  const t = await getTranslations();

  if (version == "1866") {
    glossaryData = glossaryData1866;
  } else if (version == "1870") {
    glossaryData = glossaryData1870;
  } else if (version == "1871") {
    glossaryData = glossaryData1871;
  } else if (version == "1872") {
    glossaryData = glossaryData1872;
  } else if (version == "1902") {
    glossaryData = glossaryData1902;
  } else {
    return (
      <div className="">
        {t("Tools.kieu-tools.tools.glossary.version-not-found")}
      </div>
    );
  }

  return (
    <div className="flex flex-col max-width">
      <div className="w-full">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[
            { label: t("NavigationBar.tools"), href: "tools" },
            { label: t("Tools.kieu-tools.name"), href: "tools/kieu-tools" },
            { label: t("Tools.kieu-tools.tools.glossary.name") },
          ]}
        />
        <div
          className={`${merriweather.className} text-branding-black text-4xl`}
        >
          {t("Tools.kieu-tools.tools.glossary.name")}
        </div>
        <div className="md:col-span-2 font-['Helvetica Neue'] text-branding-black max-w-5xl mt-6">
          {t("Tools.kieu-tools.tools.glossary.description")}
        </div>

        <div className="mt-28">
          <Separator />
        </div>
      </div>
      <div className="flex-col mb-20 max-w-5xl w-full items-start">
        <div className="flex justify-between items-center w-full my-6">
          <SelectVersion currentVersion={version} />

          {glossaryData && (
            <div className="text-xl font-['Helvetica Neue'] text-muted-foreground">
              {glossaryData.summary.total_entries} entries
            </div>
          )}
        </div>

        {glossaryData && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-branding-brown text-white p-3 text-lg font-[Helvetica Neue] font-light">
                    Nôm
                  </th>
                  <th className="bg-branding-brown text-white p-3 text-lg text-left font-[Helvetica Neue] font-light">
                    Quốc ngữ
                  </th>
                  <th className="bg-branding-brown text-white p-3 text-lg text-right font-[Helvetica Neue] font-light">
                    Frequency
                  </th>
                </tr>
              </thead>
              <tbody>
                {glossaryData.data.map((entry, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
                  >
                    <td
                      className={`${NomNaTong.className} border p-4 text-2xl text-center`}
                    >
                      {entry.character}
                    </td>
                    <td className="border p-4">{entry.meaning.join(", ")}</td>
                    <td className="border p-4 text-right">{entry.frequency}</td>
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
