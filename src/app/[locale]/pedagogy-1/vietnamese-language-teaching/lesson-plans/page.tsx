import VltPageShell from "../VltPageShell";
import VltResourceBrowser from "../VltResourceBrowser";
import { lessonPlanItems } from "../_shared";

export default async function LessonPlansPage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <VltPageShell locale={params.locale} activeKey="lesson-plans">
      <VltResourceBrowser
        sectionTitle="Lesson Plans"
        sectionDescription="Filter and search dummy lesson-plan records using the metadata template fields from your document."
        items={lessonPlanItems}
        filterConfig={[
          { key: "institutionAuthor", label: "Institution/Author's Name" },
          { key: "level", label: "Level" },
          { key: "semester", label: "Semester" },
          { key: "tags", label: "Tags" },
        ]}
        itemDetailPath="/pedagogy-1/vietnamese-language-teaching/lesson-plans"
      />
    </VltPageShell>
  );
}
