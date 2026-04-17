import VltPageShell from "../VltPageShell";
import VltResourceBrowser from "../VltResourceBrowser";
import { getTranslations } from "next-intl/server";
import { instructionalMaterialItems } from "../_shared";

export default async function InstructionalMaterialsPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("PedagogyVlt");

  return (
    <VltPageShell locale={params.locale} activeKey="instructional-materials">
      <VltResourceBrowser
        sectionTitle={t("sections.instructionalMaterials.title")}
        // sectionDescription="Search and filter instructional materials by institution/author and proficiency metadata."
        items={instructionalMaterialItems}
        filterConfig={[
          { key: "materialType", label: t("filters.type") },
          { key: "author", label: t("filters.author") },
          { key: "level", label: t("filters.level") },
          { key: "tags", label: t("filters.tags") },
        ]}
        itemDetailPath="/pedagogy/teaching-vietnamese-language/instructional-materials"
      />
    </VltPageShell>
  );
}
