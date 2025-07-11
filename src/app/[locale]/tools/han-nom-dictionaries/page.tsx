import { getTranslations } from "next-intl/server";

import { ToolList } from "../ToolList";
import { PageHeader } from "@/components/common/PageHeader";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: `${t("Tools.han-nom-dictionaries.name")} | Digitizing Việt Nam`,
    description: t("Tools.han-nom-dictionaries.description"),
  };
}

export const dynamic = "force-static";

const HanNomDictionaries = async ({ params: { locale } }) => {
  const t = await getTranslations();

  const dictionaries = [
    {
      href: "/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai",
      title: t(
        "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.name"
      ),
      description: t(
        "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.description"
      ),
      target: "",
      rel: "",
    },
    {
      href: "/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet",
      title: t(
        "Tools.han-nom-dictionaries.dictionaries.giup-doc-nom-va-han-viet.name"
      ),
      description: t(
        "Tools.han-nom-dictionaries.dictionaries.giup-doc-nom-va-han-viet.description"
      ),
      target: "",
      rel: "",
    },
    {
      href: "/tools/han-nom-dictionaries/nguyen-trai-quoc-am-tu-dien",
      title: t(
        "Tools.han-nom-dictionaries.dictionaries.nguyen-trai-quoc-am-tu-dien.name"
      ),
      description: t(
        "Tools.han-nom-dictionaries.dictionaries.nguyen-trai-quoc-am-tu-dien.description"
      ),
      target: "",
      rel: "",
    },
  ];

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("Tools.han-nom-dictionaries.name")}
          subtitle={t("Tools.han-nom-dictionaries.description")}
          breadcrumbItems={[
            { label: t("NavigationBar.tools"), href: "tools" },
            { label: t("Tools.han-nom-dictionaries.name") },
          ]}
          locale={locale}
        />
        <div className="mt-10 ">
          <ToolList tools={dictionaries} />
        </div>
      </div>
    </div>
  );
};

export default HanNomDictionaries;
