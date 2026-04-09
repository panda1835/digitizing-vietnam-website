import { notFound } from "next/navigation";

import VltPdfDetailPage from "../../VltPdfDetailPage";
import { instructionalMaterialById } from "../../_shared";

export default async function InstructionalMaterialItemPage({
  params,
}: {
  params: { locale: string; itemId: string };
}) {
  const item = instructionalMaterialById[params.itemId];
  if (!item) {
    notFound();
  }

  return (
    <VltPdfDetailPage
      locale={params.locale}
      activeKey="instructional-materials"
      item={item}
      backHref="/pedagogy-1/vietnamese-language-teaching/instructional-materials"
      backLabel="Back to Instructional Materials"
      metadataRows={[
        { label: "Title", value: item.title },
        { label: "Institution/Author's name", value: item.institutionAuthor },
        { label: "Level", value: item.level },
        { label: "Skills", value: (item.skills || []).join(", ") },
      ]}
    />
  );
}
