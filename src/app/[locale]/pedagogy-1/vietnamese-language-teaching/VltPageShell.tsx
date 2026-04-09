import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/common/PageHeader";
import { vltNavItems, VltNavItem } from "./_shared";

export default function VltPageShell({
  locale,
  activeKey,
  children,
}: {
  locale: string;
  activeKey: VltNavItem["key"];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center max-width w-full">
      <div className="w-full mb-20">
        <PageHeader
          title="Vietnamese Language Teaching"
          subtitle="Teaching resources and professional support for Vietnamese language instruction."
          breadcrumbItems={[
            { label: "Pedagogy", href: "/pedagogy-1" },
            { label: "Vietnamese Language Teaching" },
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
                  {item.label}
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
