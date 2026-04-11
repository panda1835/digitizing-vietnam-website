"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

import { VltFilterConfig, VltResourceItem } from "./_shared";

function normalize(input: string) {
  return input.toLowerCase().trim();
}

function valueMatchesFilter(
  item: VltResourceItem,
  key: VltFilterConfig["key"],
  selected: string[]
) {
  if (selected.length === 0) return true;
  const rawValue = item[key];

  if (!rawValue) return false;
  if (Array.isArray(rawValue)) {
    return selected.some((option) => rawValue.includes(option as never));
  }
  return selected.includes(String(rawValue));
}

export default function VltResourceBrowser({
  sectionTitle,
  sectionDescription,
  items,
  filterConfig,
  itemDetailPath,
}: {
  sectionTitle: string;
  sectionDescription?: string;
  items: VltResourceItem[];
  filterConfig: VltFilterConfig[];
  itemDetailPath?: string;
}) {
  const t = useTranslations("PedagogyVlt");
  const [searchText, setSearchText] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({});

  const filterOptions = useMemo(() => {
    return filterConfig.map((group) => {
      const options = Array.from(
        new Set(
          items.flatMap((item) => {
            const value = item[group.key];
            if (!value) return [];
            return Array.isArray(value) ? value : [value];
          })
        )
      )
        .map((option) => String(option))
        .sort((a, b) => a.localeCompare(b));

      return { ...group, options };
    });
  }, [filterConfig, items]);

  const filteredItems = useMemo(() => {
    const q = normalize(searchText);
    return items.filter((item) => {
      const searchSpace = [
        item.title,
        item.summary,
        item.institution || "",
        (item.author || []).join(" "),
        item.semester || "",
        item.level || "",
        (item.skills || []).join(" "),
        (item.tags || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const searchMatches = q.length === 0 || searchSpace.includes(q);
      if (!searchMatches) return false;

      return filterConfig.every((group) =>
        valueMatchesFilter(item, group.key, selectedFilters[group.key] || [])
      );
    });
  }, [filterConfig, items, searchText, selectedFilters]);

  const toggleFilter = (groupKey: string, option: string) => {
    setSelectedFilters((prev) => {
      const current = prev[groupKey] || [];
      const exists = current.includes(option);
      const next = exists
        ? current.filter((v) => v !== option)
        : [...current, option];
      return { ...prev, [groupKey]: next };
    });
  };

  const clearFilters = () => {
    setSelectedFilters({});
    setSearchText("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-8 items-start">
      <aside className="rounded-xl border border-branding-black/10 p-5 bg-branding-white lg:sticky lg:top-28">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-['Helvetica Neue'] text-xl font-medium text-branding-black">
            {t("browser.filters")}
          </h3>
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-branding-brown hover:underline"
          >
            {t("browser.clear")}
          </button>
        </div>

        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {filterOptions.map((group) => (
            <div
              key={group.key}
              className="border-t border-branding-black/10 pt-4"
            >
              <p className="font-['Helvetica Neue'] text-sm font-semibold uppercase tracking-wide text-[#555] mb-2">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.options.map((option) => {
                  const inputId = `${group.key}-${option}`;
                  const checked = (selectedFilters[group.key] || []).includes(
                    option
                  );
                  return (
                    <label
                      htmlFor={inputId}
                      key={inputId}
                      className="flex items-center gap-2 text-sm text-branding-black cursor-pointer"
                    >
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFilter(group.key, option)}
                        className="h-4 w-4 accent-branding-brown"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main>
        <h2 className="font-['Helvetica Neue'] text-3xl md:text-4xl text-branding-black font-bold mb-3">
          {sectionTitle}
        </h2>
        <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed mb-5">
          {sectionDescription}
        </p>

        <div className="relative mb-5">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t("browser.searchPlaceholder", {
              section: sectionTitle.toLowerCase(),
            })}
            className="w-full rounded-lg border border-branding-black/15 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-branding-brown/40"
          />
        </div>

        <p className="text-sm text-[#666] mb-4">
          {t("browser.results", { count: filteredItems.length })}
        </p>

        <div className="space-y-4">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-branding-black/10 bg-white p-5"
            >
              {itemDetailPath ? (
                <Link
                  href={`${itemDetailPath}/${item.id}`}
                  className="font-['Helvetica Neue'] text-xl font-medium text-branding-black mb-2 hover:text-branding-brown hover:underline inline-block"
                >
                  {item.title}
                </Link>
              ) : (
                <h3 className="font-['Helvetica Neue'] text-xl font-medium text-branding-black mb-2">
                  {item.title}
                </h3>
              )}
              {/* <p className="text-sm text-muted-foreground mb-3">{item.summary}</p> */}
              <div className="text-sm text-branding-black space-y-1">
                {item.institution && (
                  <p>
                    <span className="font-medium">{t("metadata.institution")}:</span>{" "}
                    {item.institution}
                  </p>
                )}
                {item.author && item.author.length > 0 && (
                  <p>
                    <span className="font-medium">{t("metadata.author")}:</span>{" "}
                    {item.author.join(", ")}
                  </p>
                )}
                {item.semester && (
                  <p>
                    <span className="font-medium">{t("metadata.semester")}:</span>{" "}
                    {item.semester}
                  </p>
                )}
                {item.level && (
                  <p>
                    <span className="font-medium">{t("metadata.level")}:</span>{" "}
                    {item.level}
                  </p>
                )}
                {item.skills && item.skills.length > 0 && (
                  <p>
                    <span className="font-medium">{t("metadata.skills")}:</span>{" "}
                    {item.skills.join(", ")}
                  </p>
                )}
                {item.tags && item.tags.length > 0 && (
                  <p>
                    <span className="font-medium">{t("metadata.tags")}:</span>{" "}
                    {item.tags.join(", ")}
                  </p>
                )}
              </div>
            </article>
          ))}
          {filteredItems.length === 0 && (
            <div className="rounded-xl border border-dashed border-branding-black/20 p-8 text-center text-[#666]">
              {t("browser.noItems")}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
