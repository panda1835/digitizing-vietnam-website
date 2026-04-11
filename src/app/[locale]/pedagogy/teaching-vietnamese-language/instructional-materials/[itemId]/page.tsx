import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import VltPdfDetailPage from "../../VltPdfDetailPage";
import { instructionalMaterialById } from "../../_shared";

export default async function InstructionalMaterialItemPage({
  params,
}: {
  params: { locale: string; itemId: string };
}) {
  const t = await getTranslations("PedagogyVlt");
  const item = instructionalMaterialById[params.itemId];
  if (!item) {
    notFound();
  }

  return (
    <VltPdfDetailPage
      locale={params.locale}
      activeKey="instructional-materials"
      item={item}
      backHref="/pedagogy/teaching-vietnamese-language/instructional-materials"
      backLabel={t("detail.backToInstructionalMaterials")}
      metadataRows={[
        { label: t("metadata.title"), value: item.title },
        { label: t("metadata.institution"), value: item.institution },
        { label: t("metadata.author"), value: item.author?.join(", ") },
        { label: t("metadata.level"), value: item.level },
        { label: t("metadata.skills"), value: (item.skills || []).join(", ") },
      ]}
    />
  );
}
