import { useState } from "react";
import { Link } from "@/i18n/routing";
import { Collection } from "@/types/collection";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { getImageByKey } from "@/utils/image";
import { Merriweather } from "next/font/google";
import { useLocale } from "next-intl";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

interface CollectionTOCProps {
  collections: Collection[];
}

export const CollectionTOC = ({ collections }: CollectionTOCProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const locale = useLocale();

  // Group collections by category
  const groupedCollections = collections.reduce((acc, collection) => {
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
  }, {} as Record<string, { category: any; collections: Collection[] }>);

  // Sort categories by display_order
  const sortedCategories = Object.entries(groupedCollections).sort(
    ([, a], [, b]) => {
      const orderA = parseInt(a.category.display_order) || 999;
      const orderB = parseInt(b.category.display_order) || 999;
      return orderA - orderB;
    }
  );

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="w-full mt-10">
      <div className="space-y-8">
        {sortedCategories.map(([categoryName, { category, collections }]) => (
          <div
            key={categoryName}
            className="border-b border-gray-200 pb-6 last:border-b-0"
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(categoryName)}
              className="flex items-center justify-between w-full text-left group hover:bg-gray-50 p-3 -m-3 rounded-lg transition-colors"
            >
              <div>
                <h2
                  className={`${merriweather.className} text-2xl font-semibold text-branding-black group-hover:text-branding-brown mb-1`}
                >
                  {categoryName}
                </h2>
                {category.description && (
                  <p className="text-gray-600 text-sm font-['Helvetica Neue'] font-light">
                    {category.description}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {collections.length}{" "}
                  {locale === "vi"
                    ? "bộ sưu tập"
                    : collections.length === 1
                    ? "collection"
                    : "collections"}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedCategories.has(categoryName) ? "rotate-90" : ""
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </button>

            {/* Collections List */}
            {expandedCategories.has(categoryName) && (
              <div className="mt-4 ml-4 space-y-2">
                {collections.map((collection) => {
                  const thumbnail = getImageByKey(
                    collection.thumbnail.formats,
                    "large"
                  );
                  return (
                    <div key={collection.slug} className="py-2">
                      <HoverCard>
                        <HoverCardTrigger>
                          <Link href={`/our-collections/${collection.slug}`}>
                            <div
                              className={`${merriweather.className} text-lg text-branding-black hover:text-branding-brown hover:underline cursor-pointer`}
                            >
                              {collection.title}
                            </div>
                          </Link>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-[400px] p-4">
                          <div className="flex flex-col gap-4">
                            <Image
                              unoptimized
                              src={thumbnail!.url}
                              alt={collection.title}
                              width={thumbnail!.width}
                              height={thumbnail!.height}
                              className="object-cover rounded w-full h-48"
                            />
                            <ScrollArea className="h-[150px]">
                              <div className="font-['Helvetica Neue'] font-light text-sm">
                                {collection.abstract}
                              </div>
                            </ScrollArea>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
