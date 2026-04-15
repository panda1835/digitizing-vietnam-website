import VltPageShell from "../VltPageShell";
import VltResourceBrowser from "../VltResourceBrowser";
import { getTranslations } from "next-intl/server";
import { syllabiItems } from "../_shared";

export default async function SyllabiPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("PedagogyVlt");
  const syllabiItemsWithMergedLevels = syllabiItems.map((item) => {
    const mergedLevels = Array.from(
      new Set([...(item.level || []), ...(item.tags || [])])
    );

    return {
      ...item,
      level: mergedLevels,
      tags: null,
    };
  });

  return (
    <VltPageShell locale={params.locale} activeKey="syllabi">
      <VltResourceBrowser
        sectionTitle={t("sections.syllabi.title")}
        // sectionDescription="Browse and refine syllabi by institution/author, year, proficiency level, and tags."
        items={syllabiItemsWithMergedLevels}
        filterConfig={[
          { key: "institution", label: t("filters.institution") },
          { key: "author", label: t("filters.designerAuthor") },
          { key: "level", label: t("filters.level") },
          { key: "semester", label: t("filters.semester") },
        ]}
        itemDetailPath="/pedagogy/teaching-vietnamese-language/syllabi"
      />
    </VltPageShell>
  );
}
