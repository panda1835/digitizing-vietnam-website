"use client";
import { useState } from "react";

import { CollectionItem } from "./CollectionItem";
import FilterSidebar from "@/components/FilterSidebar";
import { generateCollectionFilters } from "./filter";
import { Merriweather } from "next/font/google";
import { Separator } from "@/components/ui/separator";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const CollectionItemView = ({ collectionItems, collectionMetadata }) => {
  const [filteredResults, setFilteredResults] = useState(collectionItems);
  const noCategory = "NO_CATEGORY";
  const filter = generateCollectionFilters(collectionItems);

  const handleFilterChange = (selectedFilters: Record<string, string[]>) => {
    const filtered = collectionItems.filter((item) => {
      return Object.entries(selectedFilters).every(
        ([filterName, selectedOptions]) => {
          if (selectedOptions.length === 0) return true;

          switch (filterName) {
            case "languages":
              return item.languages.some((lang) =>
                selectedOptions.includes(lang.name)
              );

            case "subjects":
              return item.subjects.some((subject) =>
                selectedOptions.includes(subject.name)
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

  const groupByCategory = (items: typeof collectionItems) => {
    return items.reduce((acc, item) => {
      const category = item.display_category || noCategory;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  };

  const groupedResults = groupByCategory(filteredResults);

  // Sort categories to ensure "No category" is always on top
  const sortedCategories: [string, typeof collectionItems][] = Object.entries(
    groupedResults
  ).sort(([a], [b]) => {
    if (a === noCategory) return -1;
    if (b === noCategory) return 1;
    return a.localeCompare(b);
  });

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
          <div className="flex flex-col gap-8 mt-10">
            {sortedCategories.map(([category, items]) => (
              <div key={category} className="w-full">
                {category !== noCategory && (
                  <div
                    className={`${merriweather.className} text-branding-black text-3xl mb-6`}
                  >
                    {category}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 gap-y-12">
                  {items.map((item) => (
                    <CollectionItem
                      collectionItem={item}
                      collectionSlug={collectionMetadata.slug}
                      key={item.slug}
                    />
                  ))}
                </div>
                {sortedCategories[sortedCategories.length - 1][0] !==
                  category && <Separator className="mt-10 w-full" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionItemView;
