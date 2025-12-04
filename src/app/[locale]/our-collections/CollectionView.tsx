"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { CollectionItem } from "./CollectionItem";
import { CollectionTOC } from "./CollectionTOC";
import { CollectionList } from "./CollectionList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import FilterSidebar from "@/components/FilterSidebar";
import { generateCollectionFilters } from "./filter";

const OurCollections = ({ collections, locale }) => {
  const t = useTranslations();

  const [filteredResults, setFilteredResults] = useState(collections);
  const [viewMode, setViewMode] = useState<"grid" | "toc" | "list">("grid");

  //   console.log("collections", collections);
  const filter = generateCollectionFilters(collections);

  // Group collections by category for grid view tabs
  const groupedCollections = filteredResults.reduce((acc, collection) => {
    if (
      collection.collection_categories &&
      collection.collection_categories.length > 0
    ) {
      collection.collection_categories.forEach((category) => {
        if (!acc[category.name]) {
          acc[category.name] = {
            category: category,
            collections: [],
          };
        }
        acc[category.name].collections.push(collection);
      });
    } else {
      // Handle collections without categories
      if (!acc["Uncategorized"]) {
        acc["Uncategorized"] = {
          category: {
            name: "Uncategorized",
            display_order: "999",
            description: "Collections without assigned categories",
          },
          collections: [],
        };
      }
      acc["Uncategorized"].collections.push(collection);
    }
    return acc;
  }, {} as Record<string, { category: any; collections: any[] }>);

  // Sort categories by display_order
  const sortedCategories = Object.entries(groupedCollections).sort(
    ([, aGroup], [, bGroup]) => {
      const a = aGroup as { category: any; collections: any[] };
      const b = bGroup as { category: any; collections: any[] };
      const orderA = parseInt(String(a.category.display_order)) || 999;
      const orderB = parseInt(String(b.category.display_order)) || 999;
      return orderA - orderB;
    }
  );

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
    console.log("filtered", filtered);
  };

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex-col mb-20 w-full">
        {/* View Toggle Buttons */}
        <div className="flex justify-end mt-6">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-branding-brown text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("toc")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "toc"
                  ? "bg-branding-brown text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
              title="Table of Contents View"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-branding-brown text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
              title="List View"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 4h18v2H3V4zm0 5h18v2H3V9zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex w-full">
          {/* <div className="mt-10">
            <FilterSidebar
              filters={filter}
              onFilterChange={handleFilterChange}
              numberOfResults={filteredResults.length}
            />
          </div> */}

          {viewMode === "grid" ? (
            sortedCategories.length > 0 ? (
              <Tabs
                defaultValue={sortedCategories[0][0]
                  .replace(/\s/g, "")
                  .toLowerCase()}
                className="w-full mt-10"
              >
                <TabsList className="h-auto p-0 bg-transparent gap-8">
                  {sortedCategories.map(([categoryName, categoryGroup]) => {
                    const { category } = categoryGroup as {
                      category: any;
                      collections: any[];
                    };
                    return (
                      <TabsTrigger
                        key={categoryName}
                        value={categoryName.replace(/\s/g, "").toLowerCase()}
                        className={[
                          "px-4 py-2 h-auto",
                          "data-[state=active]:bg-branding-white data-[state=active]:shadow-none",
                          "data-[state=active]:border-gray-200 data-[state=active]:text-foreground",
                          "data-[state=active]:border-b-branding-brown",
                          "rounded-t-lg rounded-b-none border border-b-2 border-transparent text-base font-normal",
                        ].join(" ")}
                      >
                        {categoryName}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {sortedCategories.map(([categoryName, categoryGroup]) => {
                  const { collections } = categoryGroup as {
                    category: any;
                    collections: any[];
                  };
                  return (
                    <TabsContent
                      value={categoryName.replace(/\s/g, "").toLowerCase()}
                      className="mt-6 space-y-4"
                      key={categoryName}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10 gap-y-12">
                        {collections.map((collection) => (
                          <CollectionItem
                            collection={collection}
                            key={collection.slug}
                          />
                        ))}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10 gap-y-12 w-full">
                {filteredResults.map((collection) => (
                  <CollectionItem
                    collection={collection}
                    key={collection.slug}
                  />
                ))}
              </div>
            )
          ) : viewMode === "toc" ? (
            <CollectionTOC collections={filteredResults} />
          ) : (
            <CollectionList collections={filteredResults} />
          )}
        </div>
      </div>
    </div>
  );
};

export default OurCollections;
