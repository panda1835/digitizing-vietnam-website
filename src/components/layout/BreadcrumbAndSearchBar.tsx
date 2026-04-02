import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { House } from "lucide-react";
import { Merriweather } from "next/font/google";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export default function BreadcrumbAndSearchBar({ locale, breadcrumbItems }) {
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
            <BreadcrumbPage className={`${merriweather.className} text-2xl text-foreground`}>
              {breadcrumbItems.slice(-1)[0].label}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
