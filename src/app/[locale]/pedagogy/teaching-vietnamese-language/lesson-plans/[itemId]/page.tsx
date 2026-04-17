import { redirect } from "next/navigation";

export default async function LessonPlanItemPage({
  params,
}: {
  params: { locale: string; itemId: string };
}) {
  redirect(
    `/${params.locale}/pedagogy/teaching-vietnamese-language/instructional-materials/${params.itemId}`
  );
}
