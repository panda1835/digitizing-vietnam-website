"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { CollectionItem } from "./CollectionItem";

import FilterSidebar from "@/components/FilterSidebar";
import { generateCollectionFilters } from "./filter";

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
              return item.resourceTypes.some((resource_type) =>
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
    <div className="flex flex-col w-full items-center">
      <div className="flex-col mb-20 w-full">
        <div className="flex">
          {/* <div className="mt-10">
            <FilterSidebar
              filters={filter}
              onFilterChange={handleFilterChange}
              numberOfResults={filteredResults.length}
            />
          </div> */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10 gap-y-12">
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
