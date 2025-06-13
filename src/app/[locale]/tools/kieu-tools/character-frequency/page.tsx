import { getTranslations } from "next-intl/server";
import FrequencyTable from "./FrequencyTable";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: `${t("Tools.kieu-tools.tools.glossary.name")} | Digitizing Việt Nam`,
    description: t("Tools.kieu-tools.tools.glossary.description"),
  };
}
export default function KieuCharacterFrequency({ params: { locale } }) {
  return (
    <main className="">
      <FrequencyTable version={"1866"} locale={locale} />
    </main>
  );
}
