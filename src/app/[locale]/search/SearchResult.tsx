"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import FilterSidebar from "@/components/FilterSidebar";
import CollectionItem from "@/components/collection/CollectionItem";

export default function SearchResults({ searchResults, locale, searchQuery }) {
  const [filteredResults, setFilteredResults] = useState(searchResults);

  const t = useTranslations();

  const generateFilters = (results: typeof searchResults) => {
    const filterGroups = {
      languages: new Array<string>(),
      resource_types: new Array<string>(),
      subjects: new Array<string>(),
      collections: new Array<string>(),
      publishers: new Array<string>(),
      places_of_publication: new Array<string>(),
    };

    results.forEach((item) => {
      item.languages.forEach((lang) => filterGroups.languages.push(lang.name));
      item.resource_types.forEach((type) =>
        filterGroups.resource_types.push(type.name)
      );
      item.subjects.forEach((subject) =>
        filterGroups.subjects.push(subject.name)
      );
      item.collections.forEach((collection) =>
        filterGroups.collections.push(collection.title)
      );
      filterGroups.publishers.push(item.publisher.name);
      filterGroups.places_of_publication.push(item.place_of_publication.name);
    });

    const filterCounts = Object.entries(filterGroups).reduce(
      (acc, [name, options]) => {
        acc[name] = options.reduce((countMap, option) => {
          countMap[option] = (countMap[option] || 0) + 1;
          return countMap;
        }, {});
        return acc;
      },
      {}
    );

    return Object.entries(filterGroups).map(([name, options]) => ({
      name,
      options: Array.from(new Set(options)).map((option, index) => ({
        name: option,
        count: filterCounts[name][option],
      })),
    }));
  };

  const filters = generateFilters(searchResults);

  const handleFilterChange = (selectedFilters: Record<string, string[]>) => {
    const filtered = searchResults.filter((item) => {
      return Object.entries(selectedFilters).every(
        ([filterName, selectedOptions]) => {
          if (selectedOptions.length === 0) return true;

          switch (filterName) {
            case "languages":
              return item.languages.some((lang) =>
                selectedOptions.includes(lang.name)
              );
            case "resource_types":
              return item.resource_types.some((resource_type) =>
                selectedOptions.includes(resource_type.name)
              );
            case "subjects":
              return item.subjects.some((subject) =>
                selectedOptions.includes(subject.name)
              );
            case "collections":
              return item.collections.some((collection) =>
                selectedOptions.includes(collection.title)
              );
            case "publishers":
              return selectedOptions.includes(item.publisher.name);
            case "places_of_publication":
              return selectedOptions.includes(item.place_of_publication.name);
            default:
              return true;
          }
        }
      );
    });

    setFilteredResults(filtered);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row">
        <FilterSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          numberOfResults={0}
        />
        <div className="flex-grow">
          {/* Pagination */}
          {searchResults.length == 0 && (
            <p>{t("SearchResult.no-search-result")}</p>
          )}
          {searchResults.length > 0 && (
            // Pagination
            <>
              <p className="text-xl mb-5">
                {t("SearchResult.showing")} {filteredResults.length}{" "}
                {t("SearchResult.search-result-for")} &quot;
                {searchQuery}&quot;
              </p>
              <CollectionItem
                collectionItems={filteredResults}
                locale={locale}
                collectionSlug={"123"}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
