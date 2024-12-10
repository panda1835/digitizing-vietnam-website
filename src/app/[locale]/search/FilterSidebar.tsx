"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

export default function FilterSidebar({
  filters,
  onFilterChange,
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

  return (
    <div className="w-full md:w-80 mb-8 md:mb-0 md:mr-8 bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Filters</h2>
      <ScrollArea className="h-[calc(100vh-200px)]">
        {filters.map((group) => {
          const isExpanded = expandedGroups[group.name] || false;
          const displayedOptions = isExpanded
            ? group.options
            : group.options.slice(0, 3);

          return (
            <div key={group.name} className="mb-6">
              <h3 className="text-lg font-medium mb-2">
                {group.name
                  .replace(/_/g, " ")
                  .replace(/^\w/, (c) => c.toUpperCase())}
              </h3>
              {displayedOptions.map((option) => (
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
                        return { ...prevFilters, [group.name]: updatedGroup };
                      });
                    }}
                  />
                  <label
                    htmlFor={`${group.name}-${option.name}`}
                    className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.name} ({option.count})
                  </label>
                </div>
              ))}
              {group.options.length > 3 && (
                <Button
                  variant="link"
                  className="mt-2 p-0 h-auto text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => toggleGroup(group.name)}
                >
                  {isExpanded ? t("Button.load-less") : t("Button.load-more")}
                </Button>
              )}
            </div>
          );
        })}
      </ScrollArea>
      <Button onClick={applyFilters} className="w-full mt-4">
        Apply Filters
      </Button>
    </div>
  );
}
