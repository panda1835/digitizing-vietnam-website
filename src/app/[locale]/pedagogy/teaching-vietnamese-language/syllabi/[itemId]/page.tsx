import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import VltPdfDetailPage from "../../VltPdfDetailPage";
import { syllabiItems } from "../../_shared";

const syllabiById = Object.fromEntries(
  syllabiItems.map((item) => [item.id, item])
);

export default async function SyllabiItemPage({
  params,
}: {
  params: { locale: string; itemId: string };
}) {
  const t = await getTranslations("PedagogyVlt");
  const item = syllabiById[params.itemId];
  if (!item) {
    notFound();
  }

  return (
    <VltPdfDetailPage
      locale={params.locale}
      activeKey="syllabi"
      item={item}
      backHref="/pedagogy/teaching-vietnamese-language/syllabi"
      backLabel={t("detail.backToSyllabi")}
      metadataRows={[
        { label: t("metadata.title"), value: item.title },
        { label: t("metadata.institution"), value: item.institution },
        { label: t("metadata.designerAuthor"), value: item.author?.join(", ") },
        { label: t("metadata.semester"), value: item.semester },
        { label: t("metadata.level"), value: item.level },
      ]}
    />
  );
}
