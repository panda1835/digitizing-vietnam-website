import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/common/PageHeader";
import { vltNavItems, VltNavItem } from "./_shared";

export default async function VltPageShell({
  locale,
  activeKey,
  children,
}: {
  locale: string;
  activeKey: VltNavItem["key"];
  children: React.ReactNode;
}) {
  const t = await getTranslations("PedagogyVlt");
  const navLabels: Record<VltNavItem["key"], string> = {
    "lesson-plans": t("nav.lessonPlans"),
    syllabi: t("nav.syllabi"),
    "instructional-materials": t("nav.instructionalMaterials"),
    "direct-professional-development": t("nav.professionalDevelopment"),
    directory: t("nav.directory"),
  };

  return (
    <div className="flex flex-col items-center max-width w-full">
      <div className="w-full mb-20">
        <PageHeader
          title={t("header.title")}
          subtitle={t("header.subtitle")}
          breadcrumbItems={[
            { label: t("header.breadcrumbPedagogy"), href: "pedagogy" },
            { label: t("header.breadcrumbCurrent") },
          ]}
          locale={locale}
        />

        <nav className="mt-10 border-b border-branding-black/10">
          <ul className="flex flex-wrap gap-2 md:gap-4 pb-3">
            {vltNavItems.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={[
                    "inline-flex px-3 py-2 rounded-t-md border-b-2 text-sm md:text-base font-['Helvetica Neue']",
                    item.key === activeKey
                      ? "border-branding-brown text-branding-brown font-medium"
                      : "border-transparent text-[#747474] hover:text-branding-black",
                  ].join(" ")}
                >
                  {navLabels[item.key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
