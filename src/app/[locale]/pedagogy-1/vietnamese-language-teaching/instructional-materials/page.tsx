import VltPageShell from "../VltPageShell";
import VltResourceBrowser from "../VltResourceBrowser";
import { instructionalMaterialItems } from "../_shared";

export default async function InstructionalMaterialsPage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <VltPageShell locale={params.locale} activeKey="instructional-materials">
      <VltResourceBrowser
        sectionTitle="Instructional Materials"
        sectionDescription="Search and filter sample instructional materials using the metadata structure from the Google Doc."
        items={instructionalMaterialItems}
        filterConfig={[
          { key: "institutionAuthor", label: "Institution/Author's Name" },
          { key: "tags", label: "Tags" },
        ]}
        itemDetailPath="/pedagogy-1/vietnamese-language-teaching/instructional-materials"
      />
    </VltPageShell>
  );
}
