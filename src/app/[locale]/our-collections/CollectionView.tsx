"use client";
import { useTranslations } from "next-intl";

import { useState } from "react";

import { CollectionItem } from "./CollectionItem";

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";

import { Merriweather } from "next/font/google";
import { Separator } from "@/components/ui/separator";
import FilterSidebar from "@/components/FilterSidebar";
import { generateCollectionFilters } from "./filter";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const OurCollections = ({ collections, locale }) => {
  const t = useTranslations();

  const [filteredResults, setFilteredResults] = useState(collections);

  //   console.log("collections", collections);
  const filter = generateCollectionFilters(collections);

  const handleFilterChange = (selectedFilters: Record<string, string[]>) => {
    const filtered = collections.filter((item) => {
      return Object.entries(selectedFilters).every(
        ([filterName, selectedOptions]) => {
          if (selectedOptions.length === 0) return true;

          switch (filterName) {
            case "languages":
              return item.languages.some((lang) =>
                selectedOptions.includes(lang)
              );
            case "resourceTypes":
              return item.resource_types.some((resource_type) =>
                selectedOptions.includes(resource_type)
              );
            case "subjects":
              return item.subjects.some((subject) =>
                selectedOptions.includes(subject)
              );
            case "collections":
              return item.collections.some((collection) =>
                selectedOptions.includes(collection.title)
              );
            case "publishers":
              return selectedOptions.includes(item.publisher);
            default:
              return true;
          }
        }
      );
    });
    setFilteredResults(filtered);
  };

  return (
    <div className="flex flex-col max-width items-center">
      <div className="flex-col mb-20 w-full">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[{ label: t("NavigationBar.our-collections") }]}
        />

        {/* Headline */}
        <div
          className={`${merriweather.className} text-branding-black text-4xl`}
        >
          {t("NavigationBar.our-collections")}
        </div>

        {/* Subheadline */}
        <div className={`${merriweather.className} mt-6`}>
          {locale === "en"
            ? "Explore our digital archive dedicated to the preservation and academic exploration of Vietnam's historical and intellectual heritage."
            : "Khám phá bộ sưu tập kỹ thuật số của chúng tôi, dành riêng cho việc bảo tồn và khám phá học thuật về di sản lịch sử và trí tuệ của Việt Nam."}
        </div>

        <div className="mt-28">
          <Separator />
        </div>
        <div className="flex">
          <div className="mt-10">
            <FilterSidebar
              filters={filter}
              onFilterChange={handleFilterChange}
              numberOfResults={filteredResults.length}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10 gap-y-12">
            {filteredResults.map((collection) => (
              <CollectionItem collection={collection} key={collection.slug} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurCollections;
