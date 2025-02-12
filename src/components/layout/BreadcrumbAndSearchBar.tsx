import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import SearchBar from "@/components/SearchBar";
import { House } from "lucide-react";

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
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
            </BreadcrumbList>
          ))}
          <BreadcrumbItem>
            <BreadcrumbPage>
              {breadcrumbItems.slice(-1)[0].label}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex justify-center items-center w-full mb-8">
        <SearchBar locale={locale} />
      </div>
    </div>
  );
}
