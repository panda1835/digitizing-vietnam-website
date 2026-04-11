import VltPageShell from "../VltPageShell";
import VltResourceBrowser from "../VltResourceBrowser";
import { getTranslations } from "next-intl/server";
import { lessonPlanItems } from "../_shared";

export default async function LessonPlansPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("PedagogyVlt");

  return (
    <VltPageShell locale={params.locale} activeKey="lesson-plans">
      <VltResourceBrowser
        sectionTitle={t("sections.lessonPlans.title")}
        // sectionDescription="Filter and search lesson-plan records by institution/author, level, year, and tags."
        items={lessonPlanItems}
        filterConfig={[
          { key: "institution", label: t("filters.institution") },
          { key: "author", label: t("filters.author") },
          { key: "level", label: t("filters.level") },
          { key: "semester", label: t("filters.semester") },
          { key: "tags", label: t("filters.tags") },
        ]}
        itemDetailPath="/pedagogy/teaching-vietnamese-language/lesson-plans"
      />
    </VltPageShell>
  );
}
