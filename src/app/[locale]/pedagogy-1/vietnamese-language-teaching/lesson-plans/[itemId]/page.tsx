import { notFound } from "next/navigation";

import VltPdfDetailPage from "../../VltPdfDetailPage";
import { lessonPlanById } from "../../_shared";

export default async function LessonPlanItemPage({
  params,
}: {
  params: { locale: string; itemId: string };
}) {
  const item = lessonPlanById[params.itemId];
  if (!item) {
    notFound();
  }

  return (
    <VltPdfDetailPage
      locale={params.locale}
      activeKey="lesson-plans"
      item={item}
      backHref="/pedagogy-1/vietnamese-language-teaching/lesson-plans"
      backLabel="Back to Lesson Plans"
      metadataRows={[
        { label: "Title", value: item.title },
        { label: "Institution/Author's name", value: item.institutionAuthor },
        { label: "Semester", value: item.semester },
        { label: "Level", value: item.level },
      ]}
    />
  );
}
