"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface FilterOption {
  name: string;
  count: number;
}

interface FilterGroup {
  name: string;
  options: FilterOption[];
}

interface FilterSidebarProps {
  filters: FilterGroup[];
  onFilterChange: (filters: Record<string, string[]>) => void;
  numberOfResults: number;
}

/**
 * FilterSidebar component allows users to filter a collection of items based on various criteria.
 * It displays the number of results and provides a scrollable area with filter groups.
 * Each filter group can be expanded or collapsed to show more or fewer options.
 * Users can select or deselect filter options, and apply the selected filters.
 *
 * @param {FilterSidebarProps} props - The props for the FilterSidebar component.
 * @param {Array} props.filters - An array of filter groups, each containing a name and options, each option containing name and count.
 * @param {Function} props.onFilterChange - Callback function to handle filter changes.
 * @param {number} props.numberOfResults - The number of results to display.
 *
 * @returns {JSX.Element} The rendered FilterSidebar component.
 */
export default function FilterSidebar({
  filters,
  onFilterChange,
  numberOfResults,
}: FilterSidebarProps) {
  const t = useTranslations();

  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  const applyFilters = () => {
    onFilterChange(selectedFilters);
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Clean up filters by removing empty options (option name is null or "" due to CMS entry)
  // and groups with no options

  const excludeCategory = ["collection_slugs"];
  const cleanFilters = filters
    .map((group) => ({
      ...group,
      options: group.options.filter((option) => option.name),
    }))
    .filter(
      (group) =>
        group.options.length > 0 && !excludeCategory.includes(group.name)
    );

  return (
    <div className=" md:w-80 mb-8 md:mb-0 mr-8 bg-white p-4 rounded-lg shadow">
      <div className="mb-4 font-['Helvetica Neue'] text-branding-black">
        <span className="font-semibold text-4xl">{numberOfResults}</span>{" "}
        <span className="text-xl font-base">{t("Filter.result")}</span>
      </div>
      <ScrollArea className="h-[calc(100vh-200px)]">
        {cleanFilters.map((group) => {
          const isExpanded = expandedGroups[group.name] || false;
          const displayedOptions = isExpanded
            ? group.options
            : group.options.slice(0, 3);

          return (
            <div key={group.name} className="mb-6">
              <div className="text-lg font-medium mb-2 font-['Helvetica Neue'] ">
                {/* {group.name
                  .replace(/_/g, " ")
                  .replace(/^\w/, (c) => c.toUpperCase())} */}
                {t(`Filter.category.${group.name}`)}
              </div>
              <div className="mb-4">
                <Separator />
              </div>
              {displayedOptions.map(
                (option) =>
                  option.name != "" &&
                  option.name != null && (
                    <div
                      key={`${group.name}-${option.name}`}
                      className="flex items-center mb-2"
                    >
                      <Checkbox
                        id={`${group.name}-${option.name}`}
                        onCheckedChange={(checked) => {
                          setSelectedFilters((prevFilters) => {
                            const updatedGroup = [
                              ...(prevFilters[group.name] || []),
                            ];
                            if (checked) {
                              updatedGroup.push(option.name);
                            } else {
                              const index = updatedGroup.indexOf(option.name);
                              if (index > -1) {
                                updatedGroup.splice(index, 1);
                              }
                            }
                            return {
                              ...prevFilters,
                              [group.name]: updatedGroup,
                            };
                          });
                        }}
                      />
                      <label
                        htmlFor={`${group.name}-${option.name}`}
                        className="ml-2 text-sm font-base leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {option.name} ({option.count})
                      </label>
                    </div>
                  )
              )}
              {group.options.length > 3 && (
                <Button
                  variant="link"
                  className="mt-2 p-0 h-auto text-sm text-branding-brown hover:underline"
                  onClick={() => toggleGroup(group.name)}
                >
                  {isExpanded ? t("Button.load-less") : t("Button.load-more")}
                </Button>
              )}
            </div>
          );
        })}
      </ScrollArea>
      <Button
        onClick={applyFilters}
        className="w-full mt-4 bg-branding-black hover:bg-branding-brown"
      >
        {t("Filter.apply-filters")}
      </Button>
    </div>
  );
}
