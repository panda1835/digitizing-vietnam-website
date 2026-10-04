"use client";

// Two-pane reader: a contents panel (Story Name Index search, one tab per Part
// and one for the Bibliography) and the open Entry with previous/next links. The open
// Entry lives in the ?muc= search param, so every Entry is linkable; the
// server reads it and parses that Entry's markdown.
//
// The search box matches Index Names (the printed Story Name Index); while it
// has a query, the results replace the tab's contents. Opening one adds ?ten=
// (and ?chu-thich= for a Footnote target) so the Story highlights the name;
// opening any other Entry drops them.

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, normalizeSearchText } from "@/lib/utils";
import type {
  BookDivision,
  BookSection,
  Entry,
  IndexNameLocation,
  IndexNameRow,
} from "./data";
import type { ParsedStory } from "./parseStoryMarkdown";
import { NAME_SEPARATOR } from "./findNameMatches";
import StoryMarkdown from "./StoryMarkdown";

interface DivisionGroup {
  division: BookDivision;
  introduction?: Entry;
  entries: Entry[];
  sections: BookSection[];
}

const LOCATION_LABEL_KEYS: Record<IndexNameLocation, string> = {
  story: "indexLocationStory",
  "khao-di": "indexLocationKhaoDi",
  "chu-thich": "indexLocationChuThich",
};

/**
 * Case- and diacritic-insensitive, with runs of whitespace and hyphens read as
 * one space, so "a dao" finds "A-dao".
 */
const searchKey = (text: string) =>
  normalizeSearchText(text).replace(NAME_SEPARATOR, " ").trim();

/** Search params an Index Name result adds; dropped when opening another Entry. */
const HIGHLIGHT_PARAMS = ["ten", "chu-thich"];

export default function KhoTangTruyenReader({
  divisions,
  indexNames,
  entry,
  previous,
  next,
  body,
  bulletLists,
  highlightName,
  targetFootnoteIndex,
}: {
  divisions: BookDivision[];
  indexNames: IndexNameRow[];
  entry: Entry;
  previous?: Entry;
  next?: Entry;
  body: ParsedStory;
  bulletLists: boolean;
  /** Index Name to highlight in the open Entry. */
  highlightName?: string;
  /** 0-based index of the Footnote to scroll to and open. */
  targetFootnoteIndex?: number;
}) {
  const t = useTranslations("KhoTangTruyen");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState(entry.divisionId);

  // The active tab follows the open Entry's division, re-syncing on every
  // Entry switch (even within the same division) after a manual tab change.
  useEffect(() => {
    setActiveTab(entry.divisionId);
  }, [entry.muc, entry.divisionId]);

  const introductionLabel = t("partIntroduction");
  const activeDivision = divisions.find((d) => d.id === activeTab);

  const searching = searchKey(query) !== "";
  const visibleGroups: DivisionGroup[] =
    !searching && activeDivision
      ? [{ division: activeDivision, ...activeDivision }]
      : [];

  const searchableIndexNames = useMemo(
    () =>
      indexNames.map((row, position) => ({
        row,
        position,
        haystack: [row.name, row.textName ?? ""].map(searchKey),
      })),
    [indexNames]
  );

  // Matched on the printed and the in-text spelling.
  const visibleIndexNames = useMemo(() => {
    const needle = searchKey(query);
    if (!needle) return [];
    return searchableIndexNames.filter(({ haystack }) =>
      haystack.some((text) => text.includes(needle))
    );
  }, [searchableIndexNames, query]);

  const hrefFor = (muc: string, highlight: Record<string, string> = {}) => {
    const params = new URLSearchParams(searchParams.toString());
    HIGHLIGHT_PARAMS.forEach((key) => params.delete(key));
    params.set("muc", muc);
    Object.entries(highlight).forEach(([key, value]) => params.set(key, value));
    return `${pathname}?${params.toString()}`;
  };

  const selectEntry = (muc: string, highlight?: Record<string, string>) => {
    startTransition(() => {
      router.replace(hrefFor(muc, highlight), { scroll: false });
    });
  };

  // An unresolved target (no textName) opens its Story with no highlight.
  const selectIndexName = (row: IndexNameRow) =>
    selectEntry(
      row.muc,
      row.textName
        ? {
            ten: row.textName,
            ...(row.location === "chu-thich" && row.footnote
              ? { "chu-thich": row.footnote }
              : {}),
          }
        : {}
    );

  const renderEntryButton = (item: Entry, label: string, number?: number) => (
    <button
      key={item.muc}
      type="button"
      onClick={() => selectEntry(item.muc)}
      aria-current={item.muc === entry.muc ? "true" : undefined}
      className={cn(
        "block w-full text-left px-6 py-3 border-b border-gray-100 transition-colors text-gray-800",
        item.muc === entry.muc
          ? "bg-gray-50 border-l-4 border-l-branding-brown"
          : "hover:bg-gray-50 hover:border-l-4 hover:border-l-branding-brown"
      )}
    >
      {number !== undefined && (
        <span className="text-gray-500 mr-2">{number}.</span>
      )}
      {label}
    </button>
  );

  return (
    <div className="w-full flex flex-col lg:flex-row mt-10 gap-8">
      {/* Contents panel */}
      <aside className="w-full lg:w-96 shrink-0 min-w-0 font-light font-['Helvetica Neue']">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-branding-brown uppercase flex justify-center">
            <h2 className="text-xl font-normal text-white">{t("contentsTitle")}</h2>
          </div>

          <div className="p-4 space-y-3 border-b border-gray-200">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchLabel")}
            />
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto p-0 bg-transparent flex flex-wrap justify-start gap-1">
                {divisions.map((division) => (
                  <TabsTrigger
                    key={division.id}
                    value={division.id}
                    title={division.title}
                    className={TAB_CLASSES}
                  >
                    {division.partNumber === undefined
                      ? t("bibliographyTab")
                      : t("partTab", { n: division.partNumber })}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="text-sm text-gray-600">{activeDivision?.title}</div>
          </div>

          <ScrollArea className="h-[500px] md:h-[600px] w-full">
            <div className="flex flex-col">
              {searching && visibleIndexNames.length === 0 && (
                <div className="px-6 py-4 text-gray-500">{t("noResults")}</div>
              )}
              {visibleGroups.map(({ division, introduction, entries, sections }) => (
                <div key={division.id}>
                  {introduction &&
                    renderEntryButton(introduction, introductionLabel)}
                  {entries.map((item) => renderEntryButton(item, item.title))}
                  {sections.map((section) => (
                    <div key={section.id}>
                      <div className="px-6 py-2 bg-gray-100 text-sm font-normal text-branding-brown">
                        {section.title}
                      </div>
                      {section.entries.map((item) =>
                        renderEntryButton(item, item.title, item.number)
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {visibleIndexNames.length > 0 && (
                <div>
                  <div className="px-6 py-2 bg-branding-brown/10 text-sm font-normal text-branding-black">
                    {t("indexNamesHeading")}
                  </div>
                  {visibleIndexNames.map(({ row, position }) => (
                    <button
                      key={position}
                      type="button"
                      onClick={() => selectIndexName(row)}
                      className="block w-full text-left px-6 py-3 border-b border-gray-100 transition-colors text-gray-800 hover:bg-gray-50 hover:border-l-4 hover:border-l-branding-brown"
                    >
                      <div>
                        {row.name}
                        {row.qualifier && (
                          <span className="text-gray-500"> · {row.qualifier}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        → {row.storyNumber}. {row.storyTitle} ·{" "}
                        {t(LOCATION_LABEL_KEYS[row.location])}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* Open Entry */}
      <div
        className={cn(
          "mt-5 w-full min-w-0 transition-opacity",
          isPending && "opacity-50"
        )}
      >
        <StoryMarkdown
          key={`${entry.muc}|${highlightName ?? ""}|${targetFootnoteIndex ?? ""}`}
          body={body}
          bulletLists={bulletLists}
          highlight={highlightName}
          targetFootnoteIndex={targetFootnoteIndex}
        />

        {(previous || next) && (
          <nav className="mt-12 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4 justify-between font-['Helvetica Neue'] font-light">
            {previous ? (
              <NeighbourLink
                href={hrefFor(previous.muc)}
                direction={t("previous")}
                label={neighbourLabel(previous, introductionLabel)}
                rel="prev"
              />
            ) : (
              <span />
            )}
            {next && (
              <NeighbourLink
                href={hrefFor(next.muc)}
                direction={t("next")}
                label={neighbourLabel(next, introductionLabel)}
                rel="next"
              />
            )}
          </nav>
        )}
      </div>
    </div>
  );
}

const neighbourLabel = (item: Entry, introductionLabel: string) =>
  item.kind === "introduction"
    ? `${introductionLabel} — ${item.title}`
    : item.number === undefined
      ? item.title
      : `${item.number}. ${item.title}`;

function NeighbourLink({
  href,
  direction,
  label,
  rel,
}: {
  href: string;
  direction: string;
  label: string;
  rel: "prev" | "next";
}) {
  return (
    <Link
      href={href}
      scroll={false}
      rel={rel}
      className={cn(
        "group block sm:max-w-[48%] rounded-lg border border-gray-200 px-4 py-3 hover:border-branding-brown transition-colors",
        rel === "next" && "sm:text-right sm:ml-auto"
      )}
    >
      <div className="text-sm uppercase text-branding-brown">
        {rel === "prev" ? `← ${direction}` : `${direction} →`}
      </div>
      <div className="text-gray-800 group-hover:underline">{label}</div>
    </Link>
  );
}

const TAB_CLASSES = [
  "px-3 py-1 h-auto text-sm font-normal",
  "rounded-t-lg rounded-b-none border border-b-2 border-transparent",
  "data-[state=active]:bg-branding-white data-[state=active]:shadow-none",
  "data-[state=active]:border-gray-200 data-[state=active]:text-foreground",
  "data-[state=active]:border-b-branding-brown",
].join(" ");
