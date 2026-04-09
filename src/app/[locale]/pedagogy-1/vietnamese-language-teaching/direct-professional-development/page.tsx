import VltPageShell from "../VltPageShell";
import VltResourceBrowser from "../VltResourceBrowser";
import { professionalDevelopmentItems } from "../_shared";

export default async function DirectProfessionalDevelopmentPage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <VltPageShell
      locale={params.locale}
      activeKey="direct-professional-development"
    >
      <VltResourceBrowser
        sectionTitle="Professional Development"
        sectionDescription="Current dummy records focus on newsletter-style professional development resources."
        items={professionalDevelopmentItems}
        filterConfig={[
          { key: "institutionAuthor", label: "Institution/Author's Name" },
          { key: "semester", label: "Issue/Date" },
          { key: "tags", label: "Type" },
        ]}
        itemDetailPath="/pedagogy-1/vietnamese-language-teaching/direct-professional-development"
      />
    </VltPageShell>
  );
}
