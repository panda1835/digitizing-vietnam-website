"use client";
import { useTranslations } from "next-intl";

import { useState } from "react";

import { CollectionItem } from "./CollectionItem";
import { Merriweather } from "next/font/google";

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { Separator } from "@/components/ui/separator";
import FilterSidebar from "@/components/FilterSidebar";
import { generateCollectionFilters } from "./filter";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const CollectionItemView = ({ collection, collectionItems, locale }) => {
  const t = useTranslations();

  const [filteredResults, setFilteredResults] = useState(collectionItems);

  //   console.log("collectionItems", collectionItems);
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

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex-col mb-20 w-full">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[
            {
              label: t("NavigationBar.our-collections"),
              href: "our-collections",
            },
            { label: collection.title },
          ]}
        />

        {/* Headline */}
        <div
          className={`${merriweather.className} text-branding-black text-4xl max-w-5xl`}
        >
          {collection.title}
        </div>

        {/* Subheadline */}
        <div
          className={`font-['Helvetica_Neue'] font-light text-lg mt-8 max-w-5xl`}
        >
          {collection.abstract}
        </div>

        <div className="mt-28">
          <Separator />
        </div>
        <div className="flex">
          {/* <div className="mt-10">
            <FilterSidebar
              filters={filter}
              onFilterChange={handleFilterChange}
              numberOfResults={filteredResults.length}
            />
          </div> */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10 gap-y-12">
            {filteredResults.map((item) => (
              <CollectionItem
                collectionItem={item}
                collectionSlug={collection.slug}
                key={item.slug}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionItemView;
