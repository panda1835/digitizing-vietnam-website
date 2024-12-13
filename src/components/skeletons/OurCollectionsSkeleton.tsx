"use client";
import { useTranslations } from "next-intl";

import ItemSkeleton from "@/components/skeletons/ItemSkeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const OurCollectionsSkeleton = () => {
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
              <BreadcrumbPage>{t("Header.our-collections")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <section className="flex flex-col items-center justify-center mt-8">
          <h1 className="">{t("Collection.title")}</h1>
          <p className="text-gray-500 mb-5 text-center">
            {t("Collection.subtitle")}
          </p>
        </section>

        {/* Collection gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-5">
          {[1, 2, 3].map((item) => (
            <ItemSkeleton key={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OurCollectionsSkeleton;
