import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import VltPdfDetailPage from "../../VltPdfDetailPage";
import { professionalDevelopmentById } from "../../_shared";

export default async function ProfessionalDevelopmentItemPage({
  params,
}: {
  params: { locale: string; itemId: string };
}) {
  const t = await getTranslations("PedagogyVlt");
  const item = professionalDevelopmentById[params.itemId];
  if (!item) {
    notFound();
  }

  return (
    <VltPdfDetailPage
      locale={params.locale}
      activeKey="direct-professional-development"
      item={item}
      backHref="/pedagogy/teaching-vietnamese-language/direct-professional-development"
      backLabel={t("detail.backToProfessionalDevelopment")}
      metadataRows={[
        { label: t("metadata.title"), value: item.title },
        { label: t("metadata.institution"), value: item.institution },
        { label: t("metadata.author"), value: item.author?.join(", ") },
        { label: t("metadata.newsletter"), value: item.tags?.join(", ") },
      ]}
    />
  );
}
