import { notFound } from "next/navigation";

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
  const item = syllabiById[params.itemId];
  if (!item) {
    notFound();
  }

  return (
    <VltPdfDetailPage
      locale={params.locale}
      activeKey="syllabi"
      item={item}
      backHref="/pedagogy-1/vietnamese-language-teaching/syllabi"
      backLabel="Back to Syllabi"
      metadataRows={[
        { label: "Title", value: item.title },
        { label: "Institution/Designer's name", value: item.institutionAuthor },
        { label: "Semester", value: item.semester },
        { label: "Level", value: item.level },
      ]}
    />
  );
}
