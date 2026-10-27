"use client";

// Browse view for the Penn State Vietnamese edicts collection.
//
// Deliberately mirrors HanNomCollectionItemView's structure and styling — same
// sidebar, faceted counts, URL sync, client pagination and card grid — so the
// two static collections feel identical to use. What differs:
//
//   * facets are dynasty / era / document type / language rather than
//     names / formats / languages
//   * free-text search also matches the HÁN TRANSCRIPT, which is the reason
//     this collection is worth hosting here: PSU's own interface cannot find an
//     edict by the text written on it.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Merriweather } from "next/font/google";
import localFont from "next/font/local";

import { Link } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  EDICTS_COLLECTION_SLUG,
  EDICTS_REPOSITORY,
  edictMatchesQuery,
  formatEdictDynasty,
  getEdictCardTitle,
  localizeEdictValue,
  type EdictEntry,
} from "../_data";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });
const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

interface EdictCollectionItemViewProps {
  items: EdictEntry[];
  pageSize?: number;
  initialPage?: number;
  locale: string;
}

const FILTER_KEYS = [
  { key: "dynasty", field: "dynasty" },
  { key: "era", field: "era" },
  { key: "document-type", field: "documentType" },
  { key: "languages", field: "language" },
] as const;

type FilterKey = typeof FILTER_KEYS[number]["key"];

const PAGE_SIZE_DEFAULT = 20;

const emptyFilters = (): Record<FilterKey, string[]> => ({
  dynasty: [],
  era: [],
  "document-type": [],
  languages: [],
});

const valueOf = (item: EdictEntry, key: FilterKey) => {
  const field = FILTER_KEYS.find((filter) => filter.key === key)!.field;
  return (item[field] ?? "").toString().trim();
};

const EdictCollectionItemView = ({
  items,
  pageSize = PAGE_SIZE_DEFAULT,
  initialPage = 1,
  locale,
}: EdictCollectionItemViewProps) => {
  const t = useTranslations();
  const vi = locale === "vi";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedFilters, setSelectedFilters] = useState<
    Record<FilterKey, string[]>
  >(() => {
    const initial = emptyFilters();
    for (const filter of FILTER_KEYS) {
      initial[filter.key] = searchParams.getAll(filter.key);
    }
    return initial;
  });
  const [fromYear, setFromYear] = useState(searchParams.get("from") ?? "");
  const [toYear, setToYear] = useState(searchParams.get("to") ?? "");
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [showAllOptions, setShowAllOptions] = useState<Record<string, boolean>>(
    {}
  );

  const matchesFilters = useCallback(
    (item: EdictEntry, ignore?: FilterKey) => {
      for (const filter of FILTER_KEYS) {
        if (filter.key === ignore) continue;
        const selected = selectedFilters[filter.key];
        if (
          selected.length > 0 &&
          !selected.includes(valueOf(item, filter.key))
        ) {
          return false;
        }
      }

      const from = Number.parseInt(fromYear, 10);
      const to = Number.parseInt(toYear, 10);
      if (!Number.isNaN(from) && (item.year === null || item.year < from))
        return false;
      if (!Number.isNaN(to) && (item.year === null || item.year > to))
        return false;

      return edictMatchesQuery(item, query);
    },
    [selectedFilters, fromYear, toYear, query]
  );

  const filteredItems = useMemo(
    () => items.filter((item) => matchesFilters(item)),
    [items, matchesFilters]
  );

  /**
   * Counts exclude the facet being counted, so ticking one era still shows how
   * many documents the other eras would return — the standard faceted-search
   * behaviour, and what HanNomCollectionItemView does.
   */
  const optionCountsByKey = useMemo(() => {
    const result = {} as Record<FilterKey, { name: string; count: number }[]>;

    for (const filter of FILTER_KEYS) {
      const counts = new Map<string, number>();
      for (const item of items) {
        if (!matchesFilters(item, filter.key)) continue;
        const value = valueOf(item, filter.key);
        if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
      }
      result[filter.key] = Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }

    return result;
  }, [items, matchesFilters]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const currentItems = filteredItems.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  // Reset to page 1 whenever the result set changes underneath the pager.
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedFilters, fromYear, toYear]);

  // Keep the URL shareable.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    for (const filter of FILTER_KEYS) {
      for (const value of selectedFilters[filter.key])
        params.append(filter.key, value);
    }
    if (fromYear) params.set("from", fromYear);
    if (toYear) params.set("to", toYear);
    if (safeCurrentPage > 1) params.set("page", String(safeCurrentPage));

    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, {
      scroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedFilters, fromYear, toYear, safeCurrentPage]);

  const toggleFilterValue = (
    key: FilterKey,
    value: string,
    checked: boolean
  ) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [key]: checked
        ? [...prev[key], value]
        : prev[key].filter((entry) => entry !== value),
    }));
  };

  const filtersActive =
    query.trim() !== "" ||
    fromYear !== "" ||
    toYear !== "" ||
    FILTER_KEYS.some((filter) => selectedFilters[filter.key].length > 0);

  const clearFilters = () => {
    setQuery("");
    setSelectedFilters(emptyFilters());
    setFromYear("");
    setToYear("");
  };

  const itemHref = (item: EdictEntry) =>
    `/our-collections/${EDICTS_COLLECTION_SLUG}/${item.dmrecord}`;

  /**
   * Facet checkboxes read in the reader's language while still filtering on
   * PSU's English value, so `?document-type=Edict` means the same thing on both
   * sites. Eras and dynasties are Vietnamese names already.
   */
  const optionLabel = (key: FilterKey, name: string) => {
    if (key === "document-type") return localizeEdictValue("documentType", name, locale);
    if (key === "languages") return localizeEdictValue("language", name, locale);
    return name;
  };

  return (
    <div className="w-full">
      <div className="max-width mx-auto">
        <div className="mt-10 flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72 shrink-0 bg-gray-100 p-4 rounded-md h-fit">
            <div className="font-['Helvetica Neue'] text-xl text-branding-black">
              {t("Filter.refine-your-search")}
            </div>

            <div className="mt-4">
              <Input
                className={NomNaTong.className}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  locale === "vi"
                    ? "Tìm theo tiêu đề hoặc chữ Hán…"
                    : "Search titles or Hán text…"
                }
                aria-label={t("Filter.search-title-label")}
              />
              <p className="mt-2 text-xs text-[#777777]">
                {locale === "vi"
                  ? "Tìm kiếm bao gồm toàn văn phiên bản chữ Hán."
                  : "Search covers the full Hán transcripts."}
              </p>
            </div>

            <div className="mt-4">
              {FILTER_KEYS.map((filter) => {
                const options = optionCountsByKey[filter.key] ?? [];
                const expanded = showAllOptions[filter.key];
                const visibleOptions = expanded
                  ? options
                  : options.slice(0, 10);
                if (options.length === 0) return null;

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
                            <span>{optionLabel(filter.key, option.name)}</span>
                          </label>
                          <span className="text-sm text-gray-600">
                            {option.count}
                          </span>
                        </div>
                      ))}
                    </div>
                    {options.length > 10 && (
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
                        {expanded ? "less" : "more »"}
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
              disabled={!filtersActive}
              onClick={clearFilters}
            >
              {t("Filter.clear-filters")}
            </Button>
          </aside>

          <div className="flex-1">
            <div
              id="vietnamese-edicts-list"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-8 gap-y-12"
            >
              {currentItems.map((item) => (
                <div key={item.dmrecord}>
                  <Link href={itemHref(item)}>
                    {item.thumbnailUrl && (
                      <Image
                        unoptimized
                        src={item.thumbnailUrl}
                        alt={getEdictCardTitle(item, locale)}
                        width={256}
                        height={228}
                        className="object-cover rounded w-full h-40 bg-gray-100"
                      />
                    )}
                  </Link>
                  <Link href={itemHref(item)}>
                    <div className="font-['Helvetica Neue'] font-medium text-branding-black text-xl mt-[12px] hover:text-branding-brown hover:underline">
                      {getEdictCardTitle(item, locale)}
                    </div>
                  </Link>
                  <div className="text-sm text-[#777777] mt-2">
                    {[formatEdictDynasty(item.dynasty, locale), item.date]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
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

        <p className="mt-8 mb-8 text-base text-branding-black font-light font-['Helvetica Neue'] leading-relaxed">
          {vi ? "Ghi chú: " : "Note: "}
          {vi
            ? `Bộ sưu tập gốc do ${EDICTS_REPOSITORY.library}, ${EDICTS_REPOSITORY.institution}, lưu giữ và số hóa (${EDICTS_REPOSITORY.extent}, ${EDICTS_REPOSITORY.dateRange}). Hình ảnh được tải trực tiếp từ kho số của Penn State, và phần mô tả ở trên là nguyên văn ghi chú của thư viện trong công cụ tra cứu.`
            : `The original collection is held and was digitised by the ${EDICTS_REPOSITORY.library}, ${EDICTS_REPOSITORY.institution} (${EDICTS_REPOSITORY.extent}, ${EDICTS_REPOSITORY.dateRange}). Images are loaded directly from Penn State's digital repository, and the description above is their own scope note, quoted from their finding aid.`}{" "}
          <a
            href={EDICTS_REPOSITORY.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-branding-brown"
          >
            {vi
              ? "Truy cập bộ sưu tập gốc."
              : "Access the original collection."}
          </a>
        </p>
      </div>
    </div>
  );
};

export default EdictCollectionItemView;
