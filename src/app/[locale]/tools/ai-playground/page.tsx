import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/common/PageHeader";
import Playground from "./Playground";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AIPlayground");
  return {
    title: `${t("title")} | Digitizing Việt Nam`,
    description: t("subtitle"),
  };
}

export default async function AIPlaygroundPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();
  return (
    <div className="relative mb-20 w-full">
      <PageHeader
        title={t("AIPlayground.title")}
        subtitle={t("AIPlayground.subtitle")}
        breadcrumbItems={[
          { label: t("NavigationBar.tools"), href: "tools" },
          { label: t("AIPlayground.title") },
        ]}
        locale={locale}
      />
      <p className="mt-4 max-w-3xl leading-relaxed">
        {t("AIPlayground.howItWorks")}
      </p>
      <Playground />
    </div>
  );
}
