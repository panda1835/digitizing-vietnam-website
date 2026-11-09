"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import MiniSearch from "minisearch";
import { Link } from "@/i18n/routing";
import { ScanLightbox } from "@/components/common/ScanLightbox";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ProverbCard } from "./ProverbCard";
import { EntryModal } from "./EntryModal";
import {
  ALPHABET,
  ATTESTATION_YEARS,
  AVAILABLE_LETTERS,
  EXPORTED_PARTS,
  INTRO_PATH,
  ProverbEntry,
  Sources,
  TOTAL_PARTS,
  entryImageUrl,
  fetchAllLetters,
  fetchLetter,
  fetchSources,
  foldDiacritics,
  letterOfAnchor,
} from "./data";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 250;
const MIN_YEAR = ATTESTATION_YEARS[0];
const MAX_YEAR = ATTESTATION_YEARS[ATTESTATION_YEARS.length - 1];
const FLAGS = ["notes", "variants", "correction"] as const;
type Flag = (typeof FLAGS)[number];
const ANCHOR_HASH = /^#(.+-\d+)$/;

/** Everything the reader has chosen, as kept in the URL query. */
interface Filters {
  letter: string;
  syllable: string;
  query: string;
  sources: string[];
  years: [number, number];
  flags: Flag[];
}

function parseFilters(params: URLSearchParams): Filters {
  const letter = params.get("l") ?? "";
  const years = (params.get("y") ?? "").split("-").map(Number);
  const validYears =
    years.length === 2 && years.every((y) => ATTESTATION_YEARS.includes(y)) && years[0] <= years[1];
  return {
    letter: AVAILABLE_LETTERS.includes(letter) ? letter : AVAILABLE_LETTERS[0],
    syllable: params.get("s") ?? "",
    query: params.get("q") ?? "",
    sources: (params.get("src") ?? "").split(",").filter(Boolean),
    years: validYears ? [years[0], years[1]] : [MIN_YEAR, MAX_YEAR],
    flags: (params.get("f") ?? "").split(",").filter((f): f is Flag => FLAGS.includes(f as Flag)),
  };
}

function serializeFilters(f: Filters): string {
  const params = new URLSearchParams();
  params.set("l", f.letter);
  if (f.syllable) params.set("s", f.syllable);
  if (f.query) params.set("q", f.query);
  if (f.sources.length) params.set("src", f.sources.join(","));
  if (f.years[0] !== MIN_YEAR || f.years[1] !== MAX_YEAR) params.set("y", f.years.join("-"));
  if (f.flags.length) params.set("f", f.flags.join(","));
  return params.toString();
}

const yearsNarrowed = (f: Filters) => f.years[0] !== MIN_YEAR || f.years[1] !== MAX_YEAR;

function matchesFacets(e: ProverbEntry, f: Filters): boolean {
  if (f.sources.length && !f.sources.some((s) => e.sources.includes(s))) return false;
  if (yearsNarrowed(f) && (e.earliest_year === null || e.earliest_year < f.years[0] || e.earliest_year > f.years[1]))
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
      variants: e.variants.map((v) => v.text.map((r) => r.text).join("")).join(" "),
      notes: e.notes.map((n) => n.map((r) => r.text).join("")).join(" "),
    })),
  );
  return ms;
}

export function TraCuuContent() {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.kho-tang");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(new URLSearchParams(searchParams.toString())), [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<Filters>, { replace = false } = {}) => {
      const next = serializeFilters({ ...filters, ...patch });
      const url = `${window.location.pathname}?${next}${window.location.hash}`;
      if (replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    },
    [filters],
  );

  const [sources, setSources] = useState<Sources>({});
  const [letterEntries, setLetterEntries] = useState<ProverbEntry[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Search: the box is typed into locally and written to the URL debounced.
  const [queryInput, setQueryInput] = useState(filters.query);
  const [search, setSearch] = useState<{ entries: ProverbEntry[]; ms: MiniSearch } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [modalStack, setModalStack] = useState<string[]>([]);
  const [lightboxEntry, setLightboxEntry] = useState<ProverbEntry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchSources().then(setSources).catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLetterEntries(null);
    fetchLetter(filters.letter)
      .then((entries) => !cancelled && setLetterEntries(entries))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [filters.letter]);

  // Keep the box in step with the URL when back/forward changes the query.
  useEffect(() => {
    setQueryInput(filters.query);
  }, [filters.query]);

  useEffect(() => {
    if (queryInput === filters.query) return;
    const timer = setTimeout(() => setFilters({ query: queryInput.trim() }, { replace: true }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [queryInput, filters.query, setFilters]);

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
      if (!params.has("l") && AVAILABLE_LETTERS.includes(letterOfAnchor(anchor))) {
        params.set("l", letterOfAnchor(anchor));
        window.history.replaceState(null, "", `${window.location.pathname}?${params}${window.location.hash}`);
      }
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  // The hash follows the entry shown in the modal, so its URL can be shared.
  useEffect(() => {
    const top = modalStack[modalStack.length - 1];
    const url = `${window.location.pathname}${window.location.search}${top ? `#${top}` : ""}`;
    window.history.replaceState(window.history.state, "", url);
  }, [modalStack]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters]);

  // Searching spans every letter; browsing is one letter, then one syllable.
  const baseEntries = useMemo(() => {
    if (filters.query) {
      if (!search) return null;
      return search.ms.search(filters.query).map((r) => search.entries[r.id as number]);
    }
    if (!letterEntries) return null;
    return filters.syllable ? letterEntries.filter((e) => e.first_syllable === filters.syllable) : letterEntries;
  }, [filters.query, filters.syllable, search, letterEntries]);

  const results = useMemo(() => baseEntries?.filter((e) => matchesFacets(e, filters)) ?? null, [baseEntries, filters]);

  const syllableCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of letterEntries ?? []) counts.set(e.first_syllable, (counts.get(e.first_syllable) ?? 0) + 1);
    return Array.from(counts).sort((a, b) => a[0].localeCompare(b[0], "vi"));
  }, [letterEntries]);

  const sourceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of baseEntries ?? []) for (const s of e.sources) counts.set(s, (counts.get(s) ?? 0) + 1);
    for (const s of filters.sources) if (!counts.has(s)) counts.set(s, 0);
    return Array.from(counts).sort((a, b) => a[0].localeCompare(b[0], "vi"));
  }, [baseEntries, filters.sources]);

  const pushModal = useCallback((anchor: string) => setModalStack((s) => [...s, anchor]), []);
  const openModal = useCallback((anchor: string) => setModalStack([anchor]), []);
  const closeLightbox = useCallback(() => setLightboxEntry(null), []);

  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (filters.query) chips.push({ key: "q", label: `“${filters.query}”`, remove: () => setFilters({ query: "" }) });
  if (filters.syllable && !filters.query)
    chips.push({ key: "s", label: `${t("syllable")}: ${filters.syllable}`, remove: () => setFilters({ syllable: "" }) });
  for (const s of filters.sources)
    chips.push({
      key: `src-${s}`,
      label: `${t("source")}: ${s}`,
      remove: () => setFilters({ sources: filters.sources.filter((x) => x !== s) }),
    });
  if (yearsNarrowed(filters))
    chips.push({
      key: "y",
      label: `${t("year")}: ${filters.years[0]}–${filters.years[1]}`,
      remove: () => setFilters({ years: [MIN_YEAR, MAX_YEAR] }),
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
      syllableCounts={syllableCounts}
      sourceCounts={sourceCounts}
      sources={sources}
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
            letters: `${AVAILABLE_LETTERS[0]}–${AVAILABLE_LETTERS[AVAILABLE_LETTERS.length - 1]}`,
          })}
        </span>
        <Link href={INTRO_PATH} className="font-semibold text-branding-brown underline underline-offset-2">
          {t("back-to-intro")}
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar on desktop */}
        <aside className="hidden lg:block w-[300px] flex-shrink-0 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
          {filterPanel}
        </aside>

        <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
          {/* Search text input */}
          <div className="relative flex items-center shadow-sm rounded-2xl overflow-hidden border border-branding-brown/20 bg-white">
            <input
              type="search"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder={t("search-placeholder")}
              className="w-full pl-5 pr-12 py-3.5 bg-white text-sm text-branding-black focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            <div className="absolute right-4 flex items-center gap-2">
              {searchLoading && <Loader2 className="animate-spin h-5 w-5 text-branding-brown" />}
              {queryInput ? (
                <button
                  onClick={() => {
                    setQueryInput("");
                    setFilters({ query: "" });
                  }}
                  className="text-gray-400 hover:text-branding-brown"
                  aria-label={t("clear-all")}
                >
                  <X className="h-5 w-5" />
                </button>
              ) : (
                <Search className="text-gray-400 h-5 w-5" />
              )}
            </div>
          </div>

          {/* Filter drawer on phones */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden self-start inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-branding-brown/20 rounded-xl text-sm font-semibold text-branding-black shadow-sm"
          >
            <SlidersHorizontal className="h-4 w-4 text-branding-brown" />
            {t("filters")}
            {chips.length > 0 && ` (${chips.length})`}
          </button>
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white">
              <SheetTitle className="mb-4 text-base font-bold text-branding-brown uppercase tracking-wider">
                {t("filters")}
              </SheetTitle>
              {filterPanel}
            </SheetContent>
          </Sheet>

          {/* Count and active filters */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {results && (
              <span className="font-semibold text-branding-black mr-1">
                {filters.query ? "" : `${filters.letter} · `}
                {t("count", { count: results.length.toLocaleString(locale) })}
              </span>
            )}
            {chips.map((chip) => (
              <button
                key={chip.key}
                onClick={chip.remove}
                className="inline-flex items-center gap-1 pl-3 pr-2 py-1 rounded-full bg-branding-brown/10 text-branding-brown hover:bg-branding-brown/20"
              >
                {chip.label}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
            {chips.length > 0 && (
              <button
                onClick={() => {
                  setQueryInput("");
                  setFilters({ syllable: "", query: "", sources: [], years: [MIN_YEAR, MAX_YEAR], flags: [] });
                }}
                className="text-branding-black/60 underline underline-offset-2 hover:text-branding-brown"
              >
                {t("clear-all")}
              </button>
            )}
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 w-full">
              <Loader2 className="animate-spin h-10 w-10 text-branding-brown mb-2" />
              <span className="text-sm text-gray-500">{t("loading")}</span>
            </div>
          )}

          {results?.slice(0, visibleCount).map((entry, i) => (
            <ProverbCard
              key={`${entry.anchor}-${i}`}
              entry={entry}
              sources={sources}
              onSeeAlso={openModal}
              onOpenImage={setLightboxEntry}
            />
          ))}

          {results && results.length > visibleCount && (
            <div className="flex justify-center mt-2">
              <button
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="px-8 py-3 bg-branding-black text-white text-sm font-bold rounded-xl hover:bg-branding-brown hover:shadow-md transition-all duration-300"
              >
                {t("load-more")}
              </button>
            </div>
          )}

          {(loadError || results?.length === 0) && (
            <div className="text-center py-20 text-gray-500 bg-white border border-branding-brown/5 rounded-3xl p-8">
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
        onOpenImage={setLightboxEntry}
        lightboxOpen={lightboxEntry !== null}
      />

      {lightboxEntry && (
        <ScanLightbox src={entryImageUrl(lightboxEntry)} alt={lightboxEntry.name} onClose={closeLightbox} />
      )}
    </div>
  );
}

function FacetHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-branding-brown mb-2.5">{children}</p>;
}

function FilterPanel({
  filters,
  setFilters,
  syllableCounts,
  sourceCounts,
  sources,
}: {
  filters: Filters;
  setFilters: (patch: Partial<Filters>, options?: { replace?: boolean }) => void;
  syllableCounts: [string, number][];
  sourceCounts: [string, number][];
  sources: Sources;
}) {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.kho-tang");
  const [syllableFilter, setSyllableFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const shownSyllables = syllableCounts.filter(([s]) =>
    foldDiacritics(s).startsWith(foldDiacritics(syllableFilter.trim())),
  );
  const shownSources = sourceCounts.filter(([abbr]) => {
    const needle = foldDiacritics(sourceFilter.trim());
    return (
      !needle ||
      foldDiacritics(abbr).includes(needle) ||
      foldDiacritics(sources[abbr]?.title ?? "").includes(needle)
    );
  });
  const yearIndex = filters.years.map((y) => ATTESTATION_YEARS.indexOf(y));

  const inputClass =
    "w-full mb-2 px-3 py-2 text-sm bg-white border border-branding-brown/20 rounded-lg focus:outline-none focus:border-branding-brown";

  return (
    <div className="flex flex-col gap-7">
      <section>
        <FacetHeading>{t("letter")}</FacetHeading>
        <div className="grid grid-cols-6 gap-1.5">
          {ALPHABET.map((letter) => {
            const available = AVAILABLE_LETTERS.includes(letter);
            const active = filters.letter === letter && !filters.query;
            return (
              <button
                key={letter}
                disabled={!available}
                title={available ? undefined : t("not-digitized")}
                onClick={() => setFilters({ letter, syllable: "", query: "" })}
                className={`h-9 flex items-center justify-center text-sm font-bold rounded-full border transition-all duration-200 ${
                  active
                    ? "bg-branding-brown text-white border-branding-brown shadow-md"
                    : available
                      ? "bg-white border-gray-200 text-branding-black hover:border-branding-brown hover:text-branding-brown"
                      : "bg-transparent border-dashed border-gray-200 text-gray-300 cursor-not-allowed"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </section>

      {!filters.query && (
        <section>
          <FacetHeading>{t("syllable")}</FacetHeading>
          <input
            value={syllableFilter}
            onChange={(e) => setSyllableFilter(e.target.value)}
            placeholder={t("syllable-search")}
            className={inputClass}
          />
          <div className="max-h-56 overflow-y-auto flex flex-wrap gap-1.5 p-0.5">
            <button
              onClick={() => setFilters({ syllable: "" })}
              className={`px-2.5 py-1 rounded-full text-sm border ${
                !filters.syllable
                  ? "bg-branding-brown text-white border-branding-brown"
                  : "bg-white border-gray-200 hover:border-branding-brown"
              }`}
            >
              {t("all-syllables")}
            </button>
            {shownSyllables.map(([syllable, count]) => (
              <button
                key={syllable}
                onClick={() => setFilters({ syllable })}
                className={`px-2.5 py-1 rounded-full text-sm border ${
                  filters.syllable === syllable
                    ? "bg-branding-brown text-white border-branding-brown"
                    : "bg-white border-gray-200 hover:border-branding-brown"
                }`}
              >
                {syllable} <span className="opacity-60 text-xs">{count}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <FacetHeading>{t("source")}</FacetHeading>
        <input
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
                className="flex items-start gap-2 px-1.5 py-1 rounded-md text-sm cursor-pointer hover:bg-branding-brown/5"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setFilters({
                      sources: checked ? filters.sources.filter((s) => s !== abbr) : [...filters.sources, abbr],
                    })
                  }
                  className="mt-1 accent-branding-brown"
                />
                <span className="flex-1 min-w-0">
                  <span className="font-semibold">{abbr}</span>
                  {sources[abbr] && (
                    <span className="block text-xs text-branding-black/60 truncate">{sources[abbr].title}</span>
                  )}
                </span>
                <span className="text-xs text-branding-black/50 mt-0.5">{count}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section>
        <FacetHeading>{t("year")}</FacetHeading>
        {(["year-from", "year-to"] as const).map((label, end) => (
          <label key={label} className="flex items-center gap-3 text-sm mb-1.5">
            <span className="w-8 text-branding-black/60">{t(label)}</span>
            <input
              type="range"
              min={0}
              max={ATTESTATION_YEARS.length - 1}
              step={1}
              value={yearIndex[end]}
              onChange={(e) => {
                const i = Number(e.target.value);
                const [from, to] = yearIndex;
                const next = end === 0 ? [i, Math.max(i, to)] : [Math.min(i, from), i];
                // Dragging steps through many years; keep them out of the history.
                setFilters({ years: [ATTESTATION_YEARS[next[0]], ATTESTATION_YEARS[next[1]]] }, { replace: true });
              }}
              className="flex-1 accent-branding-brown"
            />
            <span className="w-10 text-right font-semibold tabular-nums">{filters.years[end]}</span>
          </label>
        ))}
        <p className="text-xs text-branding-black/55 leading-snug mt-1">{t("year-note")}</p>
      </section>

      <section>
        <FacetHeading>{t("has")}</FacetHeading>
        <div className="flex flex-col gap-1">
          {FLAGS.map((flag) => {
            const checked = filters.flags.includes(flag);
            return (
              <label key={flag} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setFilters({ flags: checked ? filters.flags.filter((f) => f !== flag) : [...filters.flags, flag] })
                  }
                  className="accent-branding-brown"
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
