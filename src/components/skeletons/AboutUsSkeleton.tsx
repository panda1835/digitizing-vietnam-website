import { useTranslations } from "next-intl";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const AboutUsSkeleton = () => {
  const t = useTranslations();
  return (
    <div className="flex flex-col max-width animate-pulse px-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">{t("Header.home")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("AboutUs.title")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="flex justify-center my-8">{t("AboutUs.title")}</h1>
      {/* Team Members Skeleton */}
      <div className="flex flex-col mb-5">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="mb-5">
            <div className="bg-gray-300 h-6 w-1/2 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 w-1/3 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 w-3/4 rounded"></div>
          </div>
        ))}
      </div>

      {/* Institutional Support Skeleton */}
      <h2 className="bg-gray-300 h-6 w-1/4 rounded mb-2"></h2>
      <div className="bg-gray-300 h-20 w-full rounded mb-5"></div>

      {/* Funding Skeleton */}
      <h2 className="bg-gray-300 h-6 w-1/4 rounded mb-2"></h2>
      <div className="bg-gray-300 h-20 w-full rounded mb-5"></div>

      {/* Our Collections Skeleton */}
      <h2 className="bg-gray-300 h-6 w-1/4 rounded mb-2"></h2>
      <div className="bg-gray-300 h-20 w-full rounded"></div>
      <div className="mb-20"></div>
    </div>
  );
};

export default AboutUsSkeleton;
