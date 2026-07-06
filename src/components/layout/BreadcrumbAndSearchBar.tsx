import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { House } from "lucide-react";

export default function BreadcrumbAndSearchBar({ locale, breadcrumbItems }) {
  if (!breadcrumbItems || breadcrumbItems.length === 0) return null;

  return (
    <div className="mb-10 mt-16">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <House className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          {breadcrumbItems.slice(0, -1).map((item, index) => {
            const href = item.href ? (item.href.startsWith("/") ? item.href.slice(1) : item.href) : "";
            return (
              <Fragment key={index}>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/${locale}/${href}`}>
                    {item.label}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>
              </Fragment>
            );
          })}
          <BreadcrumbItem>
            <BreadcrumbPage>
              {breadcrumbItems.slice(-1)[0]?.label || ""}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
