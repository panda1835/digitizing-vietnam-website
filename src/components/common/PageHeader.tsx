"use client";
import { useTranslations } from "next-intl";
import { Merriweather } from "next/font/google";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { Separator } from "@/components/ui/separator";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export function PageHeader({
  title,
  subtitle,
  breadcrumbItems,
  locale,
}: {
  title: string;
  subtitle: string;
  breadcrumbItems: { label: string; href?: string }[];
  locale: string;
}) {
  const t = useTranslations();
  return (
    <div className=" w-full">
      <BreadcrumbAndSearchBar
        locale={locale}
        breadcrumbItems={breadcrumbItems}
      />

      {/* Headline */}
      <div
        className={`${merriweather.className} text-branding-black text-4xl max-w-5xl`}
      >
        {title}
      </div>

      {/* Subheadline */}
      <div
        className={`font-['Helvetica_Neue'] font-light text-lg mt-8 max-w-5xl`}
      >
        {subtitle}
      </div>

      <div className="mt-28">
        <Separator />
      </div>
    </div>
  );
}
