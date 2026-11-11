"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import MiniSearch from "minisearch";
import { Merriweather } from "next/font/google";
import { Link } from "@/i18n/routing";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ProverbCard } from "./ProverbCard";
import { EntryModal } from "./EntryModal";
import {
  ALPHABET,
  AVAILABLE_LETTERS,
  ChuDe,
  EXPORTED_PARTS,
  INTRO_PATH,
  ProverbEntry,
  Sources,
  TOTAL_PARTS,
  TieuChuDe,
  fetchAllLetters,
  fetchLetter,
  fetchSources,
  fetchTopics,
  foldDiacritics,
  letterOfAnchor,
} from "./data";

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});
const focusClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-branding-brown";
const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 250;
const FLAGS = ["notes", "variants", "correction"] as const;
type Flag = typeof FLAGS[number];
const ANCHOR_HASH = /^#(.+-\d+)$/;

/**
 * Everything the reader has chosen, as kept in the URL query. With a
 * Tiểu chủ đề chosen the list spans every letter, so `letter` is optional
 * ("" for all); without one, the list is always one letter.
 */
interface Filters {
  topic: string;
  letter: string;
  query: string;
  sources: string[];
  flags: Flag[];
}

function parseFilters(params: URLSearchParams): Filters {
  const topic = params.get("cd") ?? "";
  const letter = params.get("l") ?? "";
  return {
    topic,
    letter: AVAILABLE_LETTERS.includes(letter)
      ? letter
      : topic
      ? ""
      : AVAILABLE_LETTERS[0],
    query: params.get("q") ?? "",
    sources: (params.get("src") ?? "").split(",").filter(Boolean),
    flags: (params.get("f") ?? "")
      .split(",")
      .filter((f): f is Flag => FLAGS.includes(f as Flag)),
  };
}

function serializeFilters(f: Filters): string {
  const params = new URLSearchParams();
  if (f.topic) params.set("cd", f.topic);
  if (f.letter) params.set("l", f.letter);
  if (f.query) params.set("q", f.query);
  if (f.sources.length) params.set("src", f.sources.join(","));
  if (f.flags.length) params.set("f", f.flags.join(","));
  return params.toString();
}

function matchesFacets(e: ProverbEntry, f: Filters): boolean {
  if (f.sources.length && !f.sources.some((s) => e.sources.includes(s)))
    return false;
  if (f.flags.includes("notes") && !e.has_notes) return false;
  if (f.flags.includes("variants") && !e.has_variants) return false;
  if (f.flags.includes("correction") && !e.has_correction) return false;
  return true;
}

function buildSearch(entries: ProverbEntry[]): MiniSearch {
  const ms = new MiniSearch({
    fields: ["proverb", "variants", "notes"],
    processTerm: (term) => foldDiacritics(term),
    searchOptions: { prefix: true, combineWith: "AND", boost: { proverb: 2 } },
  });
  ms.addAll(
    entries.map((e, id) => ({
      id,
      proverb: e.proverb,
      variants: e.variants
        .map((v) => v.text.map((r) => r.text).join(""))
        .join(" "),
      notes: e.notes.map((n) => n.map((r) => r.text).join("")).join(" "),
    }))
  );
  return ms;
}

export function TraCuuContent() {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.kho-tang");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const setFilters = useCallback(
    (patch: Partial<Filters>, { replace = false } = {}) => {
      const next = serializeFilters({ ...filters, ...patch });
      const url = `${window.location.pathname}?${next}${window.location.hash}`;
      if (replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    },
    [filters]
  );

  const [sources, setSources] = useState<Sources>({});
  const [letterEntries, setLetterEntries] = useState<ProverbEntry[] | null>(
    null
  );
  const [topics, setTopics] = useState<ChuDe[]>([]);
  // The chosen Tiểu chủ đề's entries in book order, tagged with its id so a
  // stale list is never shown for a newly chosen one.
  const [topicEntries, setTopicEntries] = useState<{
    id: string;
    entries: ProverbEntry[];
  } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Search: the box is typed into locally and written to the URL debounced.
  const [queryInput, setQueryInput] = useState(filters.query);
  const [search, setSearch] = useState<{
    entries: ProverbEntry[];
    ms: MiniSearch;
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [modalStack, setModalStack] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchSources()
      .then(setSources)
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    fetchTopics()
      .then(setTopics)
      .catch(() => setLoadError(true));
  }, []);

  const topic = useMemo(
    () =>
      topics
        .flatMap((chuDe) => chuDe.subtopics)
        .find((tieuChuDe) => tieuChuDe.id === filters.topic) ?? null,
    [topics, filters.topic]
  );

  // A Tiểu chủ đề downloads only the letters its entries are under.
  useEffect(() => {
    if (!topic) return;
    let cancelled = false;
    const letters = Array.from(new Set(topic.entries.map(letterOfAnchor)));
    Promise.all(letters.map(fetchLetter))
      .then((lists) => {
        if (cancelled) return;
        const byAnchor = new Map(lists.flat().map((e) => [e.anchor, e]));
        const entries = topic.entries
          .map((anchor) => byAnchor.get(anchor))
          .filter((e): e is ProverbEntry => e !== undefined);
        setTopicEntries({ id: topic.id, entries });
      })
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [topic]);

  useEffect(() => {
    if (filters.topic || !filters.letter) return;
    let cancelled = false;
    setLetterEntries(null);
    fetchLetter(filters.letter)
      .then((entries) => !cancelled && setLetterEntries(entries))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [filters.topic, filters.letter]);

  // Keep the box in step with the URL when back/forward changes the query.
  useEffect(() => {
    setQueryInput(filters.query);
  }, [filters.query]);

  useEffect(() => {
    if (queryInput === filters.query) return;
    const timer = setTimeout(
      () => setFilters({ query: queryInput.trim() }, { replace: true }),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [queryInput, filters.query, setFilters]);

  // The whole book is about 16 MB, so the letters a search needs are
  // downloaded on the first search rather than ahead of it.
  useEffect(() => {
    if (!filters.query || search) return;
    setSearchLoading(true);
    fetchAllLetters()
      .then((entries) => setSearch({ entries, ms: buildSearch(entries) }))
      .catch(() => setLoadError(true))
      .finally(() => setSearchLoading(false));
  }, [filters.query, search]);

  // A #C-484 hash opens that entry in the modal, on load and on change.
  useEffect(() => {
    const openFromHash = () => {
      const match = decodeURIComponent(window.location.hash).match(ANCHOR_HASH);
      if (!match) return;
      const anchor = match[1].normalize("NFC");
      setModalStack([anchor]);
      // A shared link names no letter; show the list at the entry's own.
      const params = new URLSearchParams(window.location.search);
      if (
        !params.has("l") &&
        !params.has("cd") &&
        AVAILABLE_LETTERS.includes(letterOfAnchor(anchor))
      ) {
        params.set("l", letterOfAnchor(anchor));
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}?${params}${window.location.hash}`
        );
      }
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  // The hash follows the entry shown in the modal, so its URL can be shared.
  useEffect(() => {
    const top = modalStack[modalStack.length - 1];
    const url = `${window.location.pathname}${window.location.search}${
      top ? `#${top}` : ""
    }`;
    window.history.replaceState(window.history.state, "", url);
  }, [modalStack]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters]);

  // Searching spans every letter; browsing is one letter. A Tiểu chủ đề
  // spans every letter too, in book order even when searched, and the
  // letter, if chosen, narrows it.
  const baseEntries = useMemo(() => {
    const searched = filters.query
      ? search?.ms
          .search(filters.query)
          .map((r) => search.entries[r.id as number])
      : undefined;
    if (filters.topic) {
      // A link to a Tiểu chủ đề the index doesn't have shows nothing.
      if (topics.length > 0 && !topic) return [];
      if (topicEntries?.id !== filters.topic) return null;
      let entries = topicEntries.entries;
      if (filters.query) {
        if (!searched) return null;
        const found = new Set(searched.map((e) => e.anchor));
        entries = entries.filter((e) => found.has(e.anchor));
      }
      return filters.letter
        ? entries.filter((e) => e.letter === filters.letter)
        : entries;
    }
    if (filters.query) return searched ?? null;
    return letterEntries ?? null;
  }, [filters, topics, topic, search, topicEntries, letterEntries]);

  const results = useMemo(
    () => baseEntries?.filter((e) => matchesFacets(e, filters)) ?? null,
    [baseEntries, filters]
  );

  const sourceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of baseEntries ?? [])
      for (const s of e.sources) counts.set(s, (counts.get(s) ?? 0) + 1);
    for (const s of filters.sources) if (!counts.has(s)) counts.set(s, 0);
    return Array.from(counts).sort((a, b) => a[0].localeCompare(b[0], "vi"));
  }, [baseEntries, filters.sources]);

  const pushModal = useCallback(
    (anchor: string) => setModalStack((s) => [...s, anchor]),
    []
  );
  const openModal = useCallback(
    (anchor: string) => setModalStack([anchor]),
    []
  );

  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (filters.topic)
    chips.push({
      key: "cd",
      label: `${t("topic")}: ${
        topic ? `${topic.id} ${topic.title}` : filters.topic
      }`,
      remove: () => setFilters({ topic: "", letter: "" }),
    });
  if (filters.topic && filters.letter)
    chips.push({
      key: "l",
      label: `${t("letter")}: ${filters.letter}`,
      remove: () => setFilters({ letter: "" }),
    });
  if (filters.query)
    chips.push({
      key: "q",
      label: `“${filters.query}”`,
      remove: () => setFilters({ query: "" }),
    });
  for (const s of filters.sources)
    chips.push({
      key: `src-${s}`,
      label: `${t("source")}: ${s}`,
      remove: () =>
        setFilters({ sources: filters.sources.filter((x) => x !== s) }),
    });
  for (const f of filters.flags)
    chips.push({
      key: `f-${f}`,
      label: `${t("has")}: ${t(`has-${f}`)}`,
      remove: () => setFilters({ flags: filters.flags.filter((x) => x !== f) }),
    });

  const filterPanel = (
    <FilterPanel
      filters={filters}
      setFilters={setFilters}
      sourceCounts={sourceCounts}
      sources={sources}
      topics={topics}
      topic={topic}
    />
  );

  const loading = results === null && !loadError;

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-branding-black/70">
        <span>
          {t("progress", {
            parts: EXPORTED_PARTS,
            total: TOTAL_PARTS,
            letters: `${AVAILABLE_LETTERS[0]}–${
              AVAILABLE_LETTERS[AVAILABLE_LETTERS.length - 1]
            }`,
          })}
        </span>
        <Link
          href={INTRO_PATH}
          className={`font-medium text-[#956319] underline underline-offset-2 hover:text-branding-black ${focusClass}`}
        >
          {t("back-to-intro")}
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
        {/* Sidebar on desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
          {filterPanel}
        </aside>

        <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
          {/* Search text input */}
          <div className="relative flex items-center rounded-lg border border-branding-black/20 bg-white focus-within:border-branding-brown focus-within:ring-2 focus-within:ring-branding-brown/30">
            <input
              type="search"
              aria-label={t("search-placeholder")}
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder={t("search-placeholder")}
              className="w-full h-12 pl-4 pr-20 rounded-lg bg-transparent text-base text-branding-black placeholder:text-branding-black/60 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
            />
            <div className="absolute right-4 flex items-center gap-2">
              {searchLoading && (
                <Loader2 className="animate-spin h-5 w-5 text-branding-brown" />
              )}
              {queryInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setQueryInput("");
                    setFilters({ query: "" });
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-md text-branding-black/60 hover:text-[#956319] ${focusClass}`}
                  aria-label={t("clear-all")}
                >
                  <X className="h-5 w-5" />
                </button>
              ) : (
                <Search className="text-branding-black/60 h-5 w-5" />
              )}
            </div>
          </div>

          {/* Filter drawer on phones */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`lg:hidden self-start inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-branding-black/20 rounded-lg text-sm font-medium text-branding-black hover:bg-branding-brown/5 ${focusClass}`}
          >
            <SlidersHorizontal className="h-4 w-4 text-branding-brown" />
            {t("filters")}
            {chips.length > 0 && ` (${chips.length})`}
          </button>
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent
              side="bottom"
              className="max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white"
            >
              <SheetTitle
                className={`${merriweather.className} mb-5 text-xl text-branding-black`}
              >
                {t("filters")}
              </SheetTitle>
              {filterPanel}
            </SheetContent>
          </Sheet>

          {/* Count and active filters */}
          <div
            aria-live="polite"
            className="flex flex-wrap items-center gap-2 text-sm"
          >
            {results && (
              <span className="font-semibold text-branding-black mr-1">
                {filters.letter && (filters.topic || !filters.query)
                  ? `${filters.letter} · `
                  : ""}
                {t("count", { count: results.length.toLocaleString(locale) })}
              </span>
            )}
            {chips.map((chip) => (
              <button
                type="button"
                key={chip.key}
                onClick={chip.remove}
                className={`inline-flex items-center gap-1 pl-3 pr-2 py-1.5 rounded-md bg-branding-brown/10 text-[#805516] hover:bg-branding-brown/20 ${focusClass}`}
              >
                {chip.label}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
            {chips.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQueryInput("");
                  setFilters({
                    topic: "",
                    letter: filters.topic ? "" : filters.letter,
                    query: "",
                    sources: [],
                    flags: [],
                  });
                }}
                className={`text-branding-black/65 underline underline-offset-2 hover:text-[#956319] ${focusClass}`}
              >
                {t("clear-all")}
              </button>
            )}
          </div>

          {topic?.note && (
            <p className="text-sm leading-relaxed text-branding-black/75 bg-branding-brown/5 border border-branding-brown/20 rounded-lg px-4 py-3">
              {topic.note}
            </p>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 w-full">
              <Loader2 className="animate-spin h-10 w-10 text-branding-brown mb-2" />
              <span className="text-sm text-branding-black/65">
                {t("loading")}
              </span>
            </div>
          )}

          {results?.slice(0, visibleCount).map((entry, i) => (
            <ProverbCard
              key={`${entry.anchor}-${i}`}
              entry={entry}
              sources={sources}
              onSeeAlso={openModal}
            />
          ))}

          {results && results.length > visibleCount && (
            <div className="flex justify-center mt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className={`px-6 py-3 bg-[#956319] text-white text-sm font-bold rounded-lg hover:bg-[#805516] transition-colors ${focusClass}`}
              >
                {t("load-more")}
              </button>
            </div>
          )}

          {(loadError || results?.length === 0) && (
            <div className="text-center py-20 text-branding-black/65 bg-white/70 border border-branding-black/10 rounded-xl p-8">
              {t("empty")}
            </div>
          )}
        </div>
      </div>

      <EntryModal
        stack={modalStack}
        sources={sources}
        onPush={pushModal}
        onBack={() => setModalStack((s) => s.slice(0, -1))}
        onClose={() => setModalStack([])}
      />
    </div>
  );
}

function FacetHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className={`${merriweather.className} text-base text-branding-black mb-3`}
    >
      {children}
    </h2>
  );
}

function FilterPanel({
  filters,
  setFilters,
  sourceCounts,
  sources,
  topics,
  topic,
}: {
  filters: Filters;
  setFilters: (
    patch: Partial<Filters>,
    options?: { replace?: boolean }
  ) => void;
  sourceCounts: [string, number][];
  sources: Sources;
  topics: ChuDe[];
  topic: TieuChuDe | null;
}) {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.kho-tang");
  const [sourceFilter, setSourceFilter] = useState("");

  const shownSources = sourceCounts.filter(([abbr]) => {
    const needle = foldDiacritics(sourceFilter.trim());
    return (
      !needle ||
      foldDiacritics(abbr).includes(needle) ||
      foldDiacritics(sources[abbr]?.title ?? "").includes(needle)
    );
  });

  const inputClass =
    "w-full h-11 mb-3 px-3 text-sm text-branding-black placeholder:text-branding-black/60 bg-white border border-branding-black/20 rounded-lg focus:outline-none focus:border-branding-brown focus:ring-2 focus:ring-branding-brown/30";

  // Within a Tiểu chủ đề, a letter is optional and only its own letters apply.
  const topicLetters = topic
    ? new Set(topic.entries.map(letterOfAnchor))
    : null;

  return (
    <div className="flex flex-col gap-7">
      {topics.length > 0 && (
        <section>
          <FacetHeading>{t("topic")}</FacetHeading>
          <div className="max-h-80 overflow-y-auto flex flex-col gap-1">
            {topics.map((chuDe) => (
              <details
                key={chuDe.id}
                open={chuDe.subtopics.some((s) => s.id === filters.topic)}
                className="group"
              >
                <summary
                  className={`flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-2 text-xs font-medium leading-relaxed text-branding-black hover:bg-branding-brown/5 ${focusClass}`}
                >
                  <span className="shrink-0">{chuDe.id}.</span>
                  <span>{chuDe.title}</span>
                </summary>
                <div className="flex flex-col gap-0.5 pb-2 pl-3">
                  {chuDe.subtopics.map((tieuChuDe) => {
                    const active = filters.topic === tieuChuDe.id;
                    return (
                      <button
                        type="button"
                        key={tieuChuDe.id}
                        aria-pressed={active}
                        onClick={() =>
                          setFilters({
                            topic: active ? "" : tieuChuDe.id,
                            letter: "",
                          })
                        }
                        className={`flex items-start gap-2 rounded-md px-1.5 py-2 text-left text-sm leading-relaxed ${focusClass} ${
                          active
                            ? "bg-[#956319] text-white"
                            : "text-branding-black/75 hover:bg-branding-brown/5 hover:text-[#956319]"
                        }`}
                      >
                        <span className="flex-1 min-w-0">
                          {tieuChuDe.number}. {tieuChuDe.title}
                        </span>
                        <span
                          className={`text-xs mt-0.5 tabular-nums ${
                            active ? "text-white/80" : "text-branding-black/65"
                          }`}
                        >
                          {tieuChuDe.entries.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      <section>
        <FacetHeading>{t("letter")}</FacetHeading>
        <div
          role="group"
          aria-label={t("letter")}
          className="grid grid-cols-5 gap-1.5"
        >
          {ALPHABET.map((letter) => {
            const available = topicLetters
              ? topicLetters.has(letter)
              : AVAILABLE_LETTERS.includes(letter);
            const active =
              filters.letter === letter && (!!topic || !filters.query);
            return (
              <button
                type="button"
                key={letter}
                disabled={!available}
                aria-pressed={active}
                title={
                  available
                    ? undefined
                    : topicLetters
                    ? t("not-in-topic")
                    : t("not-digitized")
                }
                onClick={() =>
                  topic
                    ? setFilters({ letter: active ? "" : letter })
                    : setFilters({ letter, query: "" })
                }
                className={`h-11 flex items-center justify-center text-sm font-medium rounded-lg border transition-colors ${focusClass} ${
                  active
                    ? "bg-[#956319] text-white border-[#956319]"
                    : available
                    ? "bg-white/70 border-branding-black/15 text-branding-black hover:border-branding-brown hover:bg-branding-brown/5 hover:text-[#956319]"
                    : "bg-branding-black/[0.02] border-dashed border-branding-black/10 text-branding-black/30 cursor-not-allowed"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <FacetHeading>{t("source")}</FacetHeading>
        <input
          aria-label={t("source-search")}
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          placeholder={t("source-search")}
          className={inputClass}
        />
        <div className="max-h-64 overflow-y-auto flex flex-col gap-0.5">
          {shownSources.map(([abbr, count]) => {
            const checked = filters.sources.includes(abbr);
            return (
              <label
                key={abbr}
                className="flex items-start gap-2 px-1.5 py-2 rounded-md text-sm cursor-pointer hover:bg-branding-brown/5"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setFilters({
                      sources: checked
                        ? filters.sources.filter((s) => s !== abbr)
                        : [...filters.sources, abbr],
                    })
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#956319] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-branding-brown"
                />
                <span className="flex-1 min-w-0">
                  <span className="font-semibold">{abbr}</span>
                  {sources[abbr] && (
                    <span className="block text-xs text-branding-black/65 leading-relaxed line-clamp-2">
                      {sources[abbr].title}
                    </span>
                  )}
                </span>
                <span className="text-xs text-branding-black/65 mt-0.5 tabular-nums">
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <section>
        <FacetHeading>{t("has")}</FacetHeading>
        <div className="flex flex-col gap-1">
          {FLAGS.map((flag) => {
            const checked = filters.flags.includes(flag);
            return (
              <label
                key={flag}
                className="flex min-h-10 items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setFilters({
                      flags: checked
                        ? filters.flags.filter((f) => f !== flag)
                        : [...filters.flags, flag],
                    })
                  }
                  className="h-4 w-4 accent-[#956319] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-branding-brown"
                />
                {t(`has-${flag}`)}
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
