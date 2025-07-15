import SelectVersion from "./SelectVersion";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/common/PageHeader";

import glossaryData1866 from "./1866_glossary.json";
import glossaryData1870 from "./1870_glossary.json";
import glossaryData1871 from "./1871_glossary.json";
import glossaryData1872 from "./1872_glossary.json";
import glossaryData1902 from "./1902_glossary.json";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
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
      <PageHeader
        title={t("Tools.kieu-tools.tools.glossary.name")}
        subtitle={t("Tools.kieu-tools.tools.glossary.description")}
        breadcrumbItems={[
          { label: t("NavigationBar.tools"), href: "tools" },
          { label: t("Tools.kieu-tools.name"), href: "tools/kieu-tools" },
          { label: t("Tools.kieu-tools.tools.glossary.name") },
        ]}
        locale={locale}
      />

      <div className="flex-col mb-20 max-w-5xl w-full items-start">
        <div className="flex justify-between items-center w-full my-6">
          <SelectVersion currentVersion={version} />

          {glossaryData && (
            <div className="text-xl font-['Helvetica Neue'] text-muted-foreground">
              {glossaryData.summary.total_entries}{" "}
              {t("Tools.kieu-tools.tools.glossary.entries")}
            </div>
          )}
        </div>

        {glossaryData && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-branding-brown text-white p-3 text-lg font-[Helvetica Neue] font-light">
                    {t("Tools.kieu-tools.tools.glossary.nom")}
                  </th>
                  <th className="bg-branding-brown text-white p-3 text-lg text-left font-[Helvetica Neue] font-light">
                    {t("Tools.kieu-tools.tools.glossary.quoc-ngu")}
                  </th>
                  <th className="bg-branding-brown text-white p-3 text-lg text-right font-[Helvetica Neue] font-light">
                    {t("Tools.kieu-tools.tools.glossary.frequency")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {glossaryData.data.map((entry, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
                  >
                    <td className={`border p-4 text-center`}>
                      <LookupableHanNomText
                        text={entry.character}
                        className="text-2xl"
                      />
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
