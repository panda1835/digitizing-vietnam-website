"use client";

// Two-pane reader: a contents panel (title search, one tab per Part and one
// for the Bibliography) and the open Entry with previous/next links. The open
// Entry lives in the ?muc= search param, so every Entry is linkable; the
// server reads it and parses that Entry's markdown.

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, normalizeSearchText } from "@/lib/utils";
import type { BookDivision, BookSection, Entry } from "./data";
import type { ParsedStory } from "./parseStoryMarkdown";
import StoryMarkdown from "./StoryMarkdown";

interface DivisionGroup {
  division: BookDivision;
  introduction?: Entry;
  entries: Entry[];
  sections: BookSection[];
}

export default function KhoTangTruyenReader({
  divisions,
  entry,
  previous,
  next,
  body,
  bulletLists,
}: {
  divisions: BookDivision[];
  entry: Entry;
  previous?: Entry;
  next?: Entry;
  body: ParsedStory;
  bulletLists: boolean;
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
  const searching = normalizeSearchText(query) !== "";

  const activeDivision = divisions.find((d) => d.id === activeTab);

  const visibleGroups = useMemo((): DivisionGroup[] => {
    const needle = normalizeSearchText(query);
    if (!needle) {
      return activeDivision ? [{ division: activeDivision, ...activeDivision }] : [];
    }
    // While searching, match titles across every division; the tabs don't
    // filter. An introduction's title is its division's title.
    const matches = (text: string) => normalizeSearchText(text).includes(needle);
    return divisions
      .map((division) => ({
        division,
        introduction:
          division.introduction && matches(division.introduction.title)
            ? division.introduction
            : undefined,
        entries: division.entries.filter((e) => matches(e.title)),
        sections: division.sections
          .map((section) => ({
            ...section,
            entries: section.entries.filter((e) => matches(e.title)),
          }))
          .filter((section) => section.entries.length > 0),
      }))
      .filter(
        (group) =>
          group.introduction || group.entries.length > 0 || group.sections.length > 0
      );
  }, [divisions, query, activeDivision]);

  const hrefFor = (muc: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("muc", muc);
    return `${pathname}?${params.toString()}`;
  };

  const selectEntry = (muc: string) => {
    startTransition(() => {
      router.replace(hrefFor(muc), { scroll: false });
    });
  };

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
              {visibleGroups.length === 0 && (
                <div className="px-6 py-4 text-gray-500">{t("noResults")}</div>
              )}
              {visibleGroups.map(({ division, introduction, entries, sections }) => (
                <div key={division.id}>
                  {searching && (
                    <div className="px-6 py-2 bg-branding-brown/10 text-sm font-normal text-branding-black uppercase">
                      {division.title}
                    </div>
                  )}
                  {introduction &&
                    renderEntryButton(introduction, introductionLabel)}
                  {entries.map((item) => renderEntryButton(item, item.title))}
                  {sections.map((section) => (
                    <div key={section.id}>
                      <div className="px-6 py-2 bg-gray-100 text-sm font-normal text-branding-brown uppercase">
                        {section.title}
                      </div>
                      {section.entries.map((item) =>
                        renderEntryButton(item, item.title, item.number)
                      )}
                    </div>
                  ))}
                </div>
              ))}
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
        <StoryMarkdown body={body} bulletLists={bulletLists} />

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
