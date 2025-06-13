import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import HanNomFrequency from "./HanNomFrequency";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: `${t(
      "Tools.han-nom-tools.tools.nom-character-classification-and-analysis-tool.name"
    )} | Digitizing Việt Nam`,
    description: t(
      "Tools.han-nom-tools.tools.nom-character-classification-and-analysis-tool.description"
    ),
  };
}

export default function HanNomFrequencyPage() {
  return (
    <div>
      <HanNomFrequency />
    </div>
  );
}
