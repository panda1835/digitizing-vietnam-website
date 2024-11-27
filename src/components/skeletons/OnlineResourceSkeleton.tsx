import { useTranslations } from "next-intl";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const OnlineResourceSkeleton = () => {
  const t = useTranslations();

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{t("Header.home")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("OnlineResource.title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* Header */}
        <section className="flex-col text-center my-8">
          <h1>{t("OnlineResource.title")}</h1>
          <p className="text-gray-500">{t("OnlineResource.subtitle")}</p>
        </section>

        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(7)].map((_, index) => (
            <div key={index} className="mb-5">
              <div className="bg-gray-300 h-8 w-1/4 rounded mb-2"></div>
              <div className="bg-gray-300 h-8 w-2/3 rounded mb-2"></div>
              <div className="bg-gray-300 h-40  rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnlineResourceSkeleton;
