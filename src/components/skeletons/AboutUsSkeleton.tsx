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
      <div className="flex flex-col mb-5">
        {[...Array(1)].map((_, index) => (
          <div key={index} className="mb-5">
            <div className="bg-gray-300 h-4 w-full rounded mb-2"></div>
            <div className="bg-gray-300 h-4 w-5/6 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 w-4/5 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 w-4/5 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 w-4/5 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 w-3/4 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutUsSkeleton;
