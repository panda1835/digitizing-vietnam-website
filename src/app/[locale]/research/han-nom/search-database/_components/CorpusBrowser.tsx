"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Search, ChevronRight, ChevronUp, ChevronDown, X } from "lucide-react";
import localFont from "next/font/local";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CorpusWork {
  slug: string;
  title: string;
  date?: string;
  year?: number;
  pages: number;
  genre?: string;
  language?: string;
  attributions?: { name: string; role: string; note?: string }[];
  curationStatus?: "curated" | "wiki";
  externalPath?: string;
}

interface SearchResult {
  work: string;
  location: string;
  slug: string;
  page?: number | null;
  topic?: number | null;
  line?: string;
  text: string;
  type: "han" | "nom" | "qn";
  book?: string;
  externalPath?: string;
}

type SortKey = "index" | "title" | "year" | "pages";
type SortDir = "asc" | "desc";

const NomNaTong = localFont({
  src: "../../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function CorpusBrowser() {
  const router = useRouter();
  const t = useTranslations("ResearchHub.HanNomHub.searchDatabase");
  const [works, setWorks] = React.useState<CorpusWork[]>([]);
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSearching, setIsSearching] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"library" | "results">(
    "library"
  );

  // Filters
  const [titleQuery, setTitleQuery] = React.useState<string>("");
  const [filterGenre, setFilterGenre] = React.useState<string>("all");
  const [filterLanguage, setFilterLanguage] = React.useState<string>("all");
  const [filterCuration, setFilterCuration] = React.useState<string>("all");
  const [yearFrom, setYearFrom] = React.useState<string>("");
  const [yearTo, setYearTo] = React.useState<string>("");
  const [contributorQuery, setContributorQuery] = React.useState<string>("");

  // Sort
  const [sortKey, setSortKey] = React.useState<SortKey>("index");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  React.useEffect(() => {
    const fetchWorks = async () => {
      try {
        const response = await fetch("/api/research/han-nom/search-database");
        const data = await response.json();
        if (Array.isArray(data)) setWorks(data);
      } catch (error) {
        console.error("Error fetching corpus works:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorks();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setActiveTab("library");
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/research/han-nom/search-database?q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await response.json();
      setSearchResults(data);
      setActiveTab("results");
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const genres = React.useMemo(() => {
    const set = new Set(works.map((w) => w.genre).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [works]);

  const languages = React.useMemo(() => {
    const set = new Set(
      works.map((w) => w.language).filter(Boolean) as string[]
    );
    return Array.from(set).sort();
  }, [works]);

  const filtersActive =
    titleQuery !== "" ||
    filterGenre !== "all" ||
    filterLanguage !== "all" ||
    filterCuration !== "all" ||
    yearFrom !== "" ||
    yearTo !== "" ||
    contributorQuery !== "";

  const clearFilters = () => {
    setTitleQuery("");
    setFilterGenre("all");
    setFilterLanguage("all");
    setFilterCuration("all");
    setYearFrom("");
    setYearTo("");
    setContributorQuery("");
  };

  const displayedWorks = React.useMemo(() => {
    let list = works
      .map((w, i) => ({ ...w, _idx: i }))
      .filter((w) => {
        if (
          titleQuery.trim() !== "" &&
          !w.title.toLowerCase().includes(titleQuery.toLowerCase())
        )
          return false;
        if (filterGenre !== "all" && w.genre !== filterGenre) return false;
        if (filterLanguage !== "all" && w.language !== filterLanguage)
          return false;
        if (
          filterCuration !== "all" &&
          (w.curationStatus ?? "wiki") !== filterCuration
        )
          return false;
        if (yearFrom !== "") {
          const from = parseInt(yearFrom, 10);
          if (!w.year || w.year < from) return false;
        }
        if (yearTo !== "") {
          const to = parseInt(yearTo, 10);
          if (!w.year || w.year > to) return false;
        }
        if (contributorQuery.trim() !== "") {
          const q = contributorQuery.toLowerCase();
          const match = w.attributions?.some((a) =>
            a.name.toLowerCase().includes(q)
          );
          if (!match) return false;
        }
        return true;
      });

    if (sortKey !== "index") {
      list = list.sort((a, b) => {
        let av: any, bv: any;
        if (sortKey === "title") {
          av = a.title;
          bv = b.title;
        } else if (sortKey === "year") {
          av = a.year ?? Infinity;
          bv = b.year ?? Infinity;
        } else if (sortKey === "pages") {
          av = a.pages;
          bv = b.pages;
        }
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    } else if (sortDir === "desc") {
      list = list.reverse();
    }
    return list;
  }, [
    works,
    titleQuery,
    filterGenre,
    filterLanguage,
    filterCuration,
    yearFrom,
    yearTo,
    contributorQuery,
    sortKey,
    sortDir,
  ]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="h-3 w-3 opacity-20" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-branding-brown" />
    ) : (
      <ChevronDown className="h-3 w-3 text-branding-brown" />
    );
  };

  const [expandedWorks, setExpandedWorks] = React.useState<Set<string>>(
    new Set()
  );

  const groupedSearchResults = React.useMemo(() => {
    const groups: Record<
      string,
      {
        work: string;
        slug: string;
        externalPath?: string;
        results: SearchResult[];
      }
    > = {};
    searchResults.forEach((res) => {
      if (!groups[res.slug]) {
        groups[res.slug] = {
          work: res.work,
          slug: res.slug,
          externalPath: res.externalPath,
          results: [],
        };
      }
      groups[res.slug].results.push(res);
    });
    return Object.values(groups).sort(
      (a, b) => b.results.length - a.results.length
    );
  }, [searchResults]);

  const toggleWorkExpansion = (slug: string) => {
    setExpandedWorks((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Search Content */}
        <div className="bg-branding-gray/5 dark:bg-zinc-800/30 p-4 rounded-lg border border-branding-brown/10 dark:border-white/5">
          <h2 className="text-xs uppercase font-semibold text-branding-brown dark:text-orange-400 mb-3 tracking-wider">
            {t("fullTextKeywords")}
          </h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-zinc-400" />
              <Input
                placeholder={t("searchAllTextsPlaceholder")}
                className={`pl-9 h-10 text-sm border-branding-brown/20 dark:border-white/10 focus:border-branding-brown/50 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${NomNaTong.className}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="bg-branding-brown hover:bg-branding-brown/90 text-white px-5 h-10"
            >
              {isSearching ? t("searching") : t("search")}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-2 italic">
            {t("searchHelpText")}
          </p>
        </div>

        {/* Instant Title Filter */}
        <div className="bg-branding-gray/5 dark:bg-zinc-800/30 p-4 rounded-lg border border-branding-brown/10 dark:border-white/5">
          <h2 className="text-xs uppercase font-semibold text-branding-brown dark:text-orange-400 mb-3 tracking-wider">
            {t("instantTitleSearch")}
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-zinc-400" />
            <Input
              placeholder={t("findByTitlePlaceholder")}
              className="pl-9 h-10 text-sm border-branding-brown/20 dark:border-white/10 focus:border-branding-brown/50 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              value={titleQuery}
              onChange={(e) => {
                setTitleQuery(e.target.value);
                if (activeTab !== "library") setActiveTab("library");
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 italic">
            {t("titleSearchHelpText")}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5  dark:bg-zinc-900 sticky top-0 z-10 py-2 border-b border-transparent shadow-sm shadow-black/0">
        <Select value={filterGenre} onValueChange={setFilterGenre}>
          <SelectTrigger className="h-8 text-xs w-36 border-branding-brown/20 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200">
            <SelectValue placeholder={t("genre")} />
          </SelectTrigger>
          <SelectContent className="dark:bg-zinc-900 dark:border-white/10">
            <SelectItem value="all">{t("allGenres")}</SelectItem>
            {genres.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCuration} onValueChange={setFilterCuration}>
          <SelectTrigger className="h-8 text-xs w-36 border-branding-brown/20 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200">
            <SelectValue placeholder={t("status")} />
          </SelectTrigger>
          <SelectContent className="dark:bg-zinc-900 dark:border-white/10">
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            <SelectItem value="curated">{t("curated")}</SelectItem>
            <SelectItem value="wiki">{t("wiki")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterLanguage} onValueChange={setFilterLanguage}>
          <SelectTrigger className="h-8 text-xs w-36 border-branding-brown/20 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200">
            <SelectValue placeholder={t("language")} />
          </SelectTrigger>
          <SelectContent className="dark:bg-zinc-900 dark:border-white/10">
            <SelectItem value="all">{t("allLanguages")}</SelectItem>
            {languages.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground dark:text-zinc-400">
            {t("year")}
          </span>
          <Input
            type="number"
            placeholder={t("from")}
            className="h-8 w-20 text-xs border-branding-brown/20 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
          />
          <span className="text-xs text-muted-foreground dark:text-zinc-400">
            –
          </span>
          <Input
            type="number"
            placeholder={t("to")}
            className="h-8 w-20 text-xs border-branding-brown/20 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
          />
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground dark:text-zinc-400" />
          <Input
            placeholder={t("contributorNamePlaceholder")}
            className="h-8 w-44 pl-7 text-xs border-branding-brown/20 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-500"
            value={contributorQuery}
            onChange={(e) => setContributorQuery(e.target.value)}
          />
        </div>

        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-branding-brown dark:text-zinc-400 dark:hover:text-zinc-100 gap-1"
            onClick={clearFilters}
          >
            <X className="h-3 w-3" /> {t("clear")}
          </Button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-branding-brown/20 dark:border-white/10 mb-4 text-sm">
        <button
          onClick={() => setActiveTab("library")}
          className={`px-4 py-2 border-b-2 transition-colors font-medium ${
            activeTab === "library"
              ? "border-branding-brown text-branding-brown dark:text-branding-orange dark:border-branding-orange"
              : "border-transparent text-muted-foreground hover:text-branding-black dark:hover:text-zinc-100"
          }`}
        >
          {t("browseLibrary")}
        </button>
        <button
          onClick={() => setActiveTab("results")}
          disabled={searchResults.length === 0}
          className={`px-4 py-2 border-b-2 transition-colors font-medium disabled:opacity-40 ${
            activeTab === "results"
              ? "border-branding-brown text-branding-brown dark:text-branding-orange dark:border-branding-orange"
              : "border-transparent text-muted-foreground hover:text-branding-black dark:hover:text-zinc-100"
          }`}
        >
          {t("searchResults")}
          {searchResults.length > 0 && (
            <span className="ml-1.5 text-xs bg-branding-brown/10 text-branding-brown dark:bg-white/10 dark:text-zinc-300 rounded px-1.5 py-0.5">
              {searchResults.length}
            </span>
          )}
        </button>
      </div>

      {/* Library table */}
      {activeTab === "library" && (
        <div className="text-sm">
          <span className="mb-10 text-xs text-muted-foreground dark:text-zinc-500">
            {!isLoading &&
              t("worksCount", {
                shown: displayedWorks.length,
                total: works.length,
              })}
          </span>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-muted-foreground dark:text-zinc-400 bg-branding-gray/5 dark:bg-zinc-800/50 border border-branding-brown/10 dark:border-white/10">
                <th className="text-left px-3 py-2 font-semibold w-[44px]">
                  #
                </th>
                <th className="px-3 py-2 font-semibold text-left">
                  <button
                    className="flex items-center gap-1 hover:text-branding-black dark:hover:text-zinc-100 transition-colors"
                    onClick={() => handleSort("title")}
                  >
                    {t("title")} <SortIcon col="title" />
                  </button>
                </th>
                <th className="px-3 py-2 font-semibold text-left w-[90px]">
                  {t("genre")}
                </th>
                <th className="px-3 py-2 font-semibold text-left w-[100px]">
                  {t("language")}
                </th>
                <th className="px-3 py-2 font-semibold text-left">
                  {t("contributors")}
                </th>
                <th className="px-3 py-2 font-semibold text-left w-[110px]">
                  <button
                    className="flex items-center gap-1 hover:text-branding-black dark:hover:text-zinc-100 transition-colors"
                    onClick={() => handleSort("year")}
                  >
                    {t("year")} <SortIcon col="year" />
                  </button>
                </th>
                <th className="px-3 py-2 font-semibold text-left w-[80px]">
                  {t("status")}
                </th>
                <th className="px-3 py-2 font-semibold text-right w-[80px]">
                  <button
                    className="flex items-center gap-1 ml-auto hover:text-branding-black dark:hover:text-zinc-100 transition-colors"
                    onClick={() => handleSort("pages")}
                  >
                    {t("pages")} <SortIcon col="pages" />
                  </button>
                </th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr
                    key={i}
                    className="border-b border-branding-brown/8 dark:border-white/5 animate-pulse"
                  >
                    <td className="px-3 py-2.5">
                      <div className="h-3 w-4 bg-branding-gray/20 dark:bg-zinc-700 rounded" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="h-3 w-48 bg-branding-gray/20 dark:bg-zinc-700 rounded" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="h-3 w-14 bg-branding-gray/20 dark:bg-zinc-700 rounded" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="h-3 w-12 bg-branding-gray/20 dark:bg-zinc-700 rounded" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="h-3 w-24 bg-branding-gray/20 dark:bg-zinc-700 rounded" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="h-3 w-10 bg-branding-gray/20 dark:bg-zinc-700 rounded" />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="h-3 w-8 bg-branding-gray/20 dark:bg-zinc-700 rounded ml-auto" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="h-3 w-16 bg-branding-gray/20 dark:bg-zinc-700 rounded" />
                    </td>
                    <td></td>
                  </tr>
                ))
              ) : displayedWorks.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground dark:text-zinc-500"
                  >
                    {t("noWorksMatchFilters")}
                  </td>
                </tr>
              ) : (
                displayedWorks.map((work, idx) => (
                  <tr
                    key={work.slug}
                    className="border-b border-branding-brown/10 dark:border-white/5 hover:bg-branding-brown/[0.03] dark:hover:bg-white/[0.03] cursor-pointer group transition-colors"
                    onClick={() => {
                      if (work.externalPath) {
                        router.push(work.externalPath);
                      } else {
                        router.push(
                          `/research/han-nom/search-database/${work.slug}`
                        );
                      }
                    }}
                  >
                    <td className="px-3 py-2.5 text-muted-foreground dark:text-zinc-500 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-medium text-branding-black dark:text-zinc-100 group-hover:text-branding-orange transition-colors">
                        {work.title}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {work.genre ? (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-branding-brown/8 text-branding-brown dark:bg-white/10 dark:text-zinc-300 border-none font-normal"
                        >
                          {work.genre}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {work.language ? (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-branding-orange/8 text-branding-orange dark:bg-branding-orange/20 dark:text-orange-300 border-none font-normal"
                        >
                          {work.language}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {work.attributions && work.attributions.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {work.attributions.map((a, ai) => (
                            <span key={ai} className="text-xs">
                              <span className="text-branding-black dark:text-zinc-200">
                                {a.name}
                              </span>
                              <span className="text-muted-foreground dark:text-zinc-500 ml-1">
                                ({a.role})
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground dark:text-zinc-500 tabular-nums">
                      {work.year ?? (
                        <span className="italic opacity-50 text-xs">
                          {t("unknown")}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground dark:text-zinc-500 tabular-nums">
                      {work.pages.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5">
                      {work.curationStatus && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            work.curationStatus === "curated"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                          }`}
                        >
                          {work.curationStatus === "curated"
                            ? t("curated")
                            : t("wiki")}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-muted-foreground dark:text-zinc-500">
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Search results list with grouped titles */}
      {activeTab === "results" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <p className="text-xs text-muted-foreground dark:text-zinc-500 italic">
              {t("booksFoundContaining", {
                count: groupedSearchResults.length,
                query: searchQuery,
              })}
            </p>
            <p className="text-xs text-muted-foreground dark:text-zinc-500 font-medium bg-branding-gray/10 dark:bg-white/5 py-1 px-3 rounded-full">
              {t("totalMatches", { count: searchResults.length })}
            </p>
          </div>
          {groupedSearchResults.map((group) => {
            const isExpanded = expandedWorks.has(group.slug);
            return (
              <div
                key={group.slug}
                className="border border-branding-brown/10 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm"
              >
                {/* Group Header */}
                <button
                  onClick={() => toggleWorkExpansion(group.slug)}
                  className="w-full flex items-center justify-between p-4 bg-branding-gray/5 dark:bg-zinc-800/50 hover:bg-branding-brown/5 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1 rounded-md bg-branding-brown/10 dark:bg-branding-orange/10 ${
                        isExpanded ? "rotate-0" : "-rotate-90"
                      } transition-transform duration-200`}
                    >
                      <ChevronDown className="h-4 w-4 text-branding-brown dark:text-branding-orange" />
                    </div>
                    <div>
                      <h3 className="font-merriweather font-bold text-branding-black dark:text-zinc-100 group-hover:text-branding-brown transition-colors">
                        {group.work}
                      </h3>
                    </div>
                  </div>
                  <Badge className="bg-branding-brown/10 text-branding-brown dark:bg-white/10 dark:text-zinc-300 border-none tabular-nums font-semibold">
                    {t("hitsCount", { count: group.results.length })}
                  </Badge>
                </button>

                {/* Group Content */}
                {isExpanded && (
                  <div className="border-t border-branding-brown/10 dark:border-white/10 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wider text-muted-foreground dark:text-zinc-400 bg-branding-gray/5 dark:bg-zinc-800/30">
                          <th className="text-left px-4 py-2 font-semibold w-[180px]">
                            {t("location")}
                          </th>
                          <th className="text-left px-4 py-2 font-semibold w-[100px]">
                            {t("script")}
                          </th>
                          <th className="text-left px-4 py-2 font-semibold">
                            {t("excerpt")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.results.map((result, i) => (
                          <tr
                            key={i}
                            className="border-b border-branding-brown/5 dark:border-white/5 last:border-0 hover:bg-branding-brown/[0.02] dark:hover:bg-white/[0.02] cursor-pointer group transition-colors"
                            onClick={() => {
                              if (result.externalPath) {
                                const url = new URL(
                                  result.externalPath,
                                  window.location.origin
                                );
                                if (result.page)
                                  url.searchParams.set(
                                    "page",
                                    result.page.toString()
                                  );
                                if (result.book)
                                  url.searchParams.set("book", result.book);
                                if (result.topic)
                                  url.searchParams.set(
                                    "topic",
                                    result.topic.toString()
                                  );
                                if (result.line)
                                  url.searchParams.set("line", result.line);
                                if (searchQuery)
                                  url.searchParams.set("q", searchQuery);

                                const finalUrl = `${url.pathname}${url.search}`;
                                window.open(finalUrl, "_blank");
                              } else {
                                window.open(
                                  `/research/han-nom/search-database/${
                                    result.slug
                                  }${
                                    result.page ? `?page=${result.page}` : ""
                                  }`,
                                  "_blank"
                                );
                              }
                            }}
                          >
                            <td className="px-4 py-3 text-muted-foreground dark:text-zinc-500 whitespace-nowrap text-xs font-medium tabular-nums">
                              {result.location}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={`text-[9px] px-1.5 uppercase font-medium tracking-normal h-4 ${
                                  result.type === "qn"
                                    ? "border-branding-brown/30 text-branding-brown dark:text-orange-300"
                                    : "border-branding-orange/30 text-branding-orange dark:text-orange-400"
                                }`}
                              >
                                {result.type === "han"
                                  ? "Hán"
                                  : result.type === "nom"
                                  ? "Nôm"
                                  : "QN"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-merriweather text-zinc-800 dark:text-zinc-200 leading-relaxed italic border-l-2 border-transparent group-hover:border-branding-brown dark:group-hover:border-branding-orange transition-all">
                              <span
                                className={NomNaTong.className}
                                dangerouslySetInnerHTML={{
                                  __html: `&ldquo;${result.text}&rdquo;`,
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
