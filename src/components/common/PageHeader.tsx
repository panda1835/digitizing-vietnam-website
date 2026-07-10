import type { ReactNode } from "react";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { Separator } from "@/components/ui/separator";

export function PageHeader({
  subtitle,
  breadcrumbItems,
  locale,
}: {
  // Kept for call-site compatibility; the title now renders as the current
  // (last) breadcrumb crumb rather than a separate headline.
  title?: ReactNode;
  subtitle: ReactNode;
  breadcrumbItems: { label: string; href?: string }[];
  locale: string;
}) {
  return (
    <div className=" w-full">
      {/* The last breadcrumb crumb doubles as the page title (see emphasizeCurrent). */}
      <BreadcrumbAndSearchBar
        locale={locale}
        breadcrumbItems={breadcrumbItems}
        emphasizeCurrent
      />

      {/* Subheadline */}
      <div
        className={`text-base text-[#191919] font-light font-['Helvetica Neue'] mt-[12px]`}
      >
        {subtitle}
      </div>

      <div className="mt-[32px]">
        <Separator />
      </div>
    </div>
  );
}
