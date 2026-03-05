"use client";
import type { ReactNode } from "react";
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
  title: ReactNode;
  subtitle: ReactNode;
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
        className={`${merriweather.className} text-branding-black text-[32px]`}
      >
        {title}
      </div>

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
