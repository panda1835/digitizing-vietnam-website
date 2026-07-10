import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { House } from "lucide-react";

export default function BreadcrumbAndSearchBar({
  locale,
  breadcrumbItems,
  // When true, the current (last) crumb doubles as the page title: rendered a
  // little larger than the rest of the breadcrumb. Used by PageHeader so the
  // title lives in the breadcrumb instead of a separate headline below it.
  emphasizeCurrent = false,
}) {
  return (
    <div className="mb-10 mt-16">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <House />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          {breadcrumbItems.slice(0, -1).map((item, index) => (
            <BreadcrumbList key={index}>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${locale}/${item.href}`}>
                  {item.label}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
            </BreadcrumbList>
          ))}
          <BreadcrumbItem>
            <BreadcrumbPage
              className={
                emphasizeCurrent
                  ? "text-xl font-semibold text-branding-black"
                  : undefined
              }
            >
              {breadcrumbItems.slice(-1)[0].label}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
