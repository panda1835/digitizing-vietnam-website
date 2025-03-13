"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import SearchBarResultItem from "@/components/search/SearchBarResultItem";
import { generateCollectionFilters } from "./filter";
import FilterSidebar from "@/components/FilterSidebar";

const SearchResultView = ({ hits, locale }) => {
  const t = useTranslations();

  const [filteredResults, setFilteredResults] = useState(hits);

  const filter = generateCollectionFilters(hits, locale);

  const handleFilterChange = (selectedFilters: Record<string, string[]>) => {
    const filtered = hits.filter((item) => {
      console.log("Item", item);
      return Object.entries(selectedFilters).every(
        ([filterName, selectedOptions]) => {
          if (selectedOptions.length === 0) return true;

          switch (filterName) {
            case "part_of":
              if (item.collection_location) {
                return selectedOptions.includes(
                  locale == "en" ? "Collections" : "Bộ sưu tập"
                );
              } else if (item.online_resource_types) {
                return selectedOptions.includes(
                  locale == "en" ? "Online resources" : "Tài nguyên trực tuyến"
                );
              } else {
                return false;
              }
            case "collections":
              return (
                item.collections?.some((collection) =>
                  selectedOptions.includes(collection)
                ) ?? false
              );
            case "languages":
              return (
                item.languages?.some((lang) =>
                  selectedOptions.includes(lang)
                ) ?? false
              );
            case "resource_types":
              return item.resource_types?.some(
                (resource_type) =>
                  selectedOptions.includes(resource_type) ?? false
              );
            case "subjects":
              return item.subjects?.some(
                (subject) => selectedOptions.includes(subject) ?? false
              );
            case "publishers":
              return selectedOptions?.includes(item.publisher) ?? false;
            case "online_resource_types":
              return item.online_resource_types?.some(
                (type) => selectedOptions.includes(type) ?? false
              );
            default:
              return true;
          }
        }
      );
    });
    setFilteredResults(filtered);
  };

  return (
    <div className="flex-col mb-20 w-full">
      <BreadcrumbAndSearchBar
        locale={locale}
        breadcrumbItems={[{ label: t("SearchResult.title") }]}
      />
      <div className="flex">
        <div className="">
          <FilterSidebar
            filters={filter}
            onFilterChange={handleFilterChange}
            numberOfResults={filteredResults.length}
          />
        </div>
        <div className="w-full">
          {filteredResults.map((hit) => (
            <div
              key={hit.id}
              className="border w-full bg-branding-white hover:bg-gray-100 rounded-lg overflow-hidden shadow-lg hover:shadow-xl mb-4"
            >
              <div>
                <SearchBarResultItem hit={hit} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchResultView;
