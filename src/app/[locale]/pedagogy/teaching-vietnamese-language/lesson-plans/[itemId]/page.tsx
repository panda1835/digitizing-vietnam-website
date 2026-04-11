import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import VltPdfDetailPage from "../../VltPdfDetailPage";
import { lessonPlanById } from "../../_shared";

export default async function LessonPlanItemPage({
  params,
}: {
  params: { locale: string; itemId: string };
}) {
  const t = await getTranslations("PedagogyVlt");
  const item = lessonPlanById[params.itemId];
  if (!item) {
    notFound();
  }

  return (
    <VltPdfDetailPage
      locale={params.locale}
      activeKey="lesson-plans"
      item={item}
      backHref="/pedagogy/teaching-vietnamese-language/lesson-plans"
      backLabel={t("detail.backToLessonPlans")}
      metadataRows={[
        { label: t("metadata.title"), value: item.title },
        { label: t("metadata.institution"), value: item.institution },
        { label: t("metadata.author"), value: item.author?.join(", ") },
        { label: t("metadata.semester"), value: item.semester },
        { label: t("metadata.level"), value: item.level },
      ]}
    />
  );
}
