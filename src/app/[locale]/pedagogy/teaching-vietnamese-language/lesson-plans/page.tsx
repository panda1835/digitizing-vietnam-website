import { redirect } from "next/navigation";

export default async function LessonPlansPage({
  params,
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}/pedagogy/teaching-vietnamese-language/instructional-materials`);
}
