"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import LearnMoreButton from "@/components/LearnMoreButton";
import { Merriweather } from "next/font/google";
import { HanNomManifestEntry } from "@/lib/han-nom-collection";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

interface HanNomCollectionItemViewProps {
  items: HanNomManifestEntry[];
  pageSize?: number;
  initialPage?: number;
  learnMoreLabel: string;
}

const FILTER_KEYS = [
  { key: "names" },
  { key: "formats" },
  { key: "languages" },
] as const;

type FilterKey = typeof FILTER_KEYS[number]["key"];

const PAGE_SIZE_DEFAULT = 20;

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const matchesSearchQuery = (
  item: HanNomManifestEntry,
  normalizedQuery: string
) => {
  if (!normalizedQuery) return true;

  if (normalizeSearchText(item.title).includes(normalizedQuery)) return true;

  return item.otherTitles.some((otherTitle) =>
    normalizeSearchText(otherTitle).includes(normalizedQuery)
  );
};

const HanNomCollectionItemView = ({
  items,
  pageSize = PAGE_SIZE_DEFAULT,
  initialPage = 1,
  learnMoreLabel,
}: HanNomCollectionItemViewProps) => {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getInitialPage = () => {
    const pageFromUrl = Number.parseInt(searchParams.get("page") || "", 10);
    if (!Number.isNaN(pageFromUrl) && pageFromUrl > 0) return pageFromUrl;
    return Math.max(1, initialPage);
  };

  const [titleQuery, setTitleQuery] = useState(
    () => searchParams.get("q") || ""
  );
  const [selectedFilters, setSelectedFilters] = useState<
    Record<FilterKey, string[]>
  >({
    names: searchParams.getAll("name"),
    formats: searchParams.getAll("format"),
    languages: searchParams.getAll("lang"),
  });
  const [showAllOptions, setShowAllOptions] = useState<
    Record<FilterKey, boolean>
  >({
    names: false,
    formats: false,
    languages: false,
  });
  const [fromYear, setFromYear] = useState(
    () => searchParams.get("from") || ""
  );
  const [toYear, setToYear] = useState(() => searchParams.get("to") || "");
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const normalizedQuery = normalizeSearchText(titleQuery);

  const parsedFromYear = Number.parseInt(fromYear, 10);
  const parsedToYear = Number.parseInt(toYear, 10);
  const hasFromYear = Number.isFinite(parsedFromYear);
  const hasToYear = Number.isFinite(parsedToYear);

  const matchesDateRange = useCallback(
    (item: HanNomManifestEntry) => {
      if (!hasFromYear && !hasToYear) return true;

      const itemStart = item.yearStart ?? item.yearEnd;
      const itemEnd = item.yearEnd ?? item.yearStart;
      if (itemStart === null || itemEnd === null) return false;

      if (hasFromYear && itemEnd < parsedFromYear) return false;
      if (hasToYear && itemStart > parsedToYear) return false;
      return true;
    },
    [hasFromYear, hasToYear, parsedFromYear, parsedToYear]
  );

  const matchesFacetFilters = useCallback(
    (item: HanNomManifestEntry, excludedFilter?: FilterKey) => {
      return FILTER_KEYS.every(({ key }) => {
        if (key === excludedFilter) return true;
        if (selectedFilters[key].length === 0) return true;

        return item[key].some((value) => selectedFilters[key].includes(value));
      });
    },
    [selectedFilters]
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (!matchesSearchQuery(item, normalizedQuery)) return false;

        if (!matchesDateRange(item)) return false;
        return matchesFacetFilters(item);
      }),
    [items, normalizedQuery, matchesDateRange, matchesFacetFilters]
  );

  const optionCountsByKey = useMemo(() => {
    return FILTER_KEYS.reduce(
      (acc, filter) => {
        const counts = new Map<string, number>();

        items.forEach((item) => {
          if (!matchesSearchQuery(item, normalizedQuery)) return;
          if (!matchesDateRange(item)) return;
          if (!matchesFacetFilters(item, filter.key)) return;

          item[filter.key].forEach((value) => {
            counts.set(value, (counts.get(value) || 0) + 1);
          });
        });

        acc[filter.key] = Array.from(counts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => a.name.localeCompare(b.name));
        return acc;
      },
      {
        names: [] as { name: string; count: number }[],
        formats: [] as { name: string; count: number }[],
        languages: [] as { name: string; count: number }[],
      }
    );
  }, [items, normalizedQuery, matchesDateRange, matchesFacetFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [titleQuery, selectedFilters, fromYear, toYear]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentItems = filteredItems.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const toggleFilterValue = (
    key: FilterKey,
    value: string,
    checked: boolean
  ) => {
    setSelectedFilters((prev) => {
      const existing = prev[key];
      const updated = checked
        ? [...existing, value]
        : existing.filter((item) => item !== value);
      return { ...prev, [key]: updated };
    });
  };

  const clearAllFilters = () => {
    setTitleQuery("");
    setSelectedFilters({ names: [], formats: [], languages: [] });
    setFromYear("");
    setToYear("");
    setShowAllOptions({ names: false, formats: false, languages: false });
  };

  useEffect(() => {
    const params = new URLSearchParams();
    const trimmedQuery = titleQuery.trim();

    if (trimmedQuery) params.set("q", trimmedQuery);
    selectedFilters.names.forEach((value) => params.append("name", value));
    selectedFilters.formats.forEach((value) => params.append("format", value));
    selectedFilters.languages.forEach((value) => params.append("lang", value));
    if (fromYear) params.set("from", fromYear);
    if (toYear) params.set("to", toYear);
    if (safeCurrentPage > 1) params.set("page", String(safeCurrentPage));

    const nextUrl = params.toString() ? `${pathname}?${params}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [
    titleQuery,
    selectedFilters,
    fromYear,
    toYear,
    safeCurrentPage,
    pathname,
    router,
  ]);

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex-col mb-20 w-full">
        <div className="mt-10 flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72 shrink-0 bg-gray-100 p-4 rounded-md h-fit lg:sticky lg:top-6">
            <div className="font-['Helvetica Neue'] text-xl text-branding-black">
              {t("Filter.refine-your-search")}
            </div>
            <div className="mt-4">
              <Input
                value={titleQuery}
                onChange={(event) => setTitleQuery(event.target.value)}
                placeholder={t("Filter.search-title-placeholder")}
                aria-label={t("Filter.search-title-label")}
              />
            </div>

            <div className="mt-4">
              {FILTER_KEYS.map((filter) => {
                const options = optionCountsByKey[filter.key];
                const isNameFilter = filter.key === "names";
                const visibleOptions =
                  isNameFilter || showAllOptions[filter.key]
                    ? options
                    : options.slice(0, 10);

                return (
                  <div key={filter.key} className="mt-6">
                    <div className="font-['Helvetica Neue'] text-lg text-branding-black">
                      {t(`Filter.category.${filter.key}`)}
                    </div>
                    <div className="mt-3 space-y-2 max-h-72 overflow-auto pr-1">
                      {visibleOptions.map((option) => (
                        <div
                          key={`${filter.key}-${option.name}`}
                          className="flex items-center justify-between gap-2"
                        >
                          <label
                            htmlFor={`${filter.key}-${option.name}`}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <Checkbox
                              id={`${filter.key}-${option.name}`}
                              checked={selectedFilters[filter.key].includes(
                                option.name
                              )}
                              onCheckedChange={(checked) =>
                                toggleFilterValue(
                                  filter.key,
                                  option.name,
                                  Boolean(checked)
                                )
                              }
                            />
                            <span>{option.name}</span>
                          </label>
                          <span className="text-sm text-gray-600">
                            {option.count}
                          </span>
                        </div>
                      ))}
                    </div>
                    {!isNameFilter && options.length > 10 && (
                      <Button
                        variant="link"
                        className="mt-2 p-0 h-auto text-branding-brown"
                        onClick={() =>
                          setShowAllOptions((prev) => ({
                            ...prev,
                            [filter.key]: !prev[filter.key],
                          }))
                        }
                      >
                        {showAllOptions[filter.key] ? "less" : "more »"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              <div className="font-['Helvetica Neue'] text-lg text-branding-black">
                {t("Filter.year-range")}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  className="flex-1"
                  value={fromYear}
                  onChange={(event) =>
                    setFromYear(
                      event.target.value.replace(/[^\d]/g, "").slice(0, 4)
                    )
                  }
                  placeholder={t("Filter.year-placeholder")}
                  inputMode="numeric"
                />
                <span className="text-branding-black">-</span>
                <Input
                  className="flex-1"
                  value={toYear}
                  onChange={(event) =>
                    setToYear(
                      event.target.value.replace(/[^\d]/g, "").slice(0, 4)
                    )
                  }
                  placeholder={t("Filter.year-placeholder")}
                  inputMode="numeric"
                />
              </div>
            </div>

            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={clearAllFilters}
            >
              {t("Filter.clear-filters")}
            </Button>
          </aside>

          <div className="flex-1">
            <div
              id="han-nom-collection-list"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-8 gap-y-12"
            >
              {currentItems.map((item) => (
                <div key={item.itemId}>
                  <Link
                    href={`/our-collections/han-nom-collection/${item.itemId}`}
                  >
                    {item.thumbnailUrl && (
                      <Image
                        unoptimized
                        src={item.thumbnailUrl}
                        alt={item.title}
                        width={256}
                        height={228}
                        className="object-cover rounded w-full h-40"
                      />
                    )}
                  </Link>
                  <Link
                    href={`/our-collections/han-nom-collection/${item.itemId}`}
                  >
                    <div
                      className={`font-['Helvetica Neue'] font-medium text-branding-black text-xl mt-[12px] hover:text-branding-brown hover:underline`}
                    >
                      {item.title}
                    </div>
                  </Link>
                  {item.otherTitles[0] && (
                    <div className="text-sm text-[#777777] mt-2">
                      {item.otherTitles[0]}
                    </div>
                  )}
                  {/* <div className="mt-3">
                    <LearnMoreButton
                      url={`/our-collections/han-nom-collection/${item.itemId}`}
                      text={learnMoreLabel}
                      newTab={false}
                    />
                  </div> */}
                </div>
              ))}
            </div>

            {currentItems.length === 0 && (
              <div className="text-branding-black mt-8">
                {t("Filter.no-items-match")}
              </div>
            )}

            <div className="mt-12 flex flex-col items-center gap-4">
              <p className="text-sm font-light font-['Helvetica Neue'] text-branding-black">
                {totalItems} {t("Collection.result")}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  disabled={safeCurrentPage <= 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                >
                  {t("Button.previous")}
                </Button>
                <span className="text-sm font-light font-['Helvetica Neue'] text-branding-black min-w-16 text-center">
                  {safeCurrentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  {t("Button.next")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HanNomCollectionItemView;
