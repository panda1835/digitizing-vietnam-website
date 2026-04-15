import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("Pedagogy.items.teaching-vietnamese-language.title")} | Digitizing Việt Nam`,
  };
}

export default function TeachingVietnameseLanguageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

