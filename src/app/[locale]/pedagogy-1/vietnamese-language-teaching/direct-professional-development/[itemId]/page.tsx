import { notFound } from "next/navigation";

import VltPdfDetailPage from "../../VltPdfDetailPage";
import { professionalDevelopmentById } from "../../_shared";

export default async function ProfessionalDevelopmentItemPage({
  params,
}: {
  params: { locale: string; itemId: string };
}) {
  const item = professionalDevelopmentById[params.itemId];
  if (!item) {
    notFound();
  }

  return (
    <VltPdfDetailPage
      locale={params.locale}
      activeKey="direct-professional-development"
      item={item}
      backHref="/pedagogy-1/vietnamese-language-teaching/direct-professional-development"
      backLabel="Back to Professional Development"
      metadataRows={[
        { label: "Title", value: item.title },
        { label: "Institution/Author's name", value: item.institutionAuthor },
        { label: "Newsletter", value: item.tags?.join(", ") },
      ]}
    />
  );
}
