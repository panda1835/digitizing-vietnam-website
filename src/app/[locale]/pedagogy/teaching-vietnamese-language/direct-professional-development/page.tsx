import VltPageShell from "../VltPageShell";
import VltResourceBrowser from "../VltResourceBrowser";
import { getTranslations } from "next-intl/server";
import { professionalDevelopmentItems } from "../_shared";

export default async function DirectProfessionalDevelopmentPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("PedagogyVlt");

  return (
    <VltPageShell
      locale={params.locale}
      activeKey="direct-professional-development"
    >
      <VltResourceBrowser
        sectionTitle={t("sections.professionalDevelopment.title")}
        // sectionDescription="Browse professional development resources and filter by organization, issue/date, and type."
        items={professionalDevelopmentItems}
        filterConfig={[
          { key: "institution", label: t("filters.institution") },
          { key: "semester", label: t("filters.issueDate") },
        ]}
        itemDetailPath="/pedagogy/teaching-vietnamese-language/direct-professional-development"
      />
    </VltPageShell>
  );
}
