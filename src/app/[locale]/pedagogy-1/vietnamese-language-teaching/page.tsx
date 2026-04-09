import { redirect } from "next/navigation";

export default async function VietnameseLanguageTeachingIndex({
  params,
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}/pedagogy-1/vietnamese-language-teaching/lesson-plans`);
}
