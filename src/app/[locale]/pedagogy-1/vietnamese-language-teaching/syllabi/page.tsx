import VltPageShell from "../VltPageShell";
import VltResourceBrowser from "../VltResourceBrowser";
import { syllabiItems } from "../_shared";

export default async function SyllabiPage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <VltPageShell locale={params.locale} activeKey="syllabi">
      <VltResourceBrowser
        sectionTitle="Syllabi"
        sectionDescription="Browse and refine dummy syllabi entries by institution, term, level, and tags."
        items={syllabiItems}
        filterConfig={[
          { key: "institutionAuthor", label: "Institution/Designer's Name" },
          { key: "level", label: "Level" },
          { key: "semester", label: "Semester" },
          { key: "tags", label: "Tags" },
        ]}
        itemDetailPath="/pedagogy-1/vietnamese-language-teaching/syllabi"
      />
    </VltPageShell>
  );
}
