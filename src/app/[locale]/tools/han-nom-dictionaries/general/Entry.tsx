"use client";
import { useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Merriweather } from "next/font/google";
import localFont from "next/font/local";
import EntryTDCNDG from "../tu-dien-chu-nom-dan-giai/Entry";
import EntryGDNVHV from "../giup-doc-nom-va-han-viet/Entry";
import EntryQATD from "../nguyen-trai-quoc-am-tu-dien/Entry";
import EntryTaberd from "../taberd/Entry";
import EntryNDTD from "../nhat-dung-thuong-dam/Entry";
import ResultsSidebar from "./ResultsSidebar";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });
// Component-match results can contain Nom characters that only exist in the
// NomNaTong font's Private Use Area. Load the font here and apply its className
// directly (the same pattern every sibling Entry uses); relying on a bare
// `var(--font-nom-na-tong)` fails because that CSS variable is never defined,
// so the glyphs fall back to `serif` and render as tofu.
const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

type SourceId = "tdcndg" | "giupdoc" | "qatd" | "taberd" | "ndtd";
type SearchMode = "character" | "reading";

// Inline CJK-range check (same ranges the componentMatches block uses). Kept
// local instead of importing `isCJKChar` from lib/han-nom/componentsIndex — that
// module does a server-only readFileSync at import time.
function isCJKChar(ch: string): boolean {
  const cp = ch.codePointAt(0);
  if (cp === undefined) return false;
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x20000 && cp <= 0x2ebef) ||
    (cp >= 0x30000 && cp <= 0x323af) ||
    (cp >= 0xf900 && cp <= 0xfaff)
  );
}

function normalize(values: Array<string | undefined | null>): string[] {
  return values
    .filter(Boolean)
    .map((s) => String(s).trim())
    .filter((v) => v.length > 0);
}

// The Hán-Nôm character(s) an entry carries, per each dictionary's schema.
function charsOf(id: SourceId, e: any): string[] {
  switch (id) {
    case "tdcndg":
      return normalize([e.hn]);
    case "giupdoc":
      return normalize([e.uni]);
    case "qatd":
      return normalize([e.han, e.nom]);
    case "taberd":
      return normalize([e.nom]);
    case "ndtd":
      return normalize([e.han_nom]);
  }
}

// The reading(s) an entry carries, per each dictionary's schema.
function readingsOf(id: SourceId, e: any): string[] {
  switch (id) {
    case "tdcndg":
    case "giupdoc":
    case "taberd":
      return normalize([e.qn]);
    case "qatd":
      return normalize([e.hdwd]);
    case "ndtd":
      return normalize([e.han_viet, e.quoc_ngu]);
  }
}

// A reading search narrows by character; a character search narrows by reading.
function valuesOf(mode: SearchMode, id: SourceId, e: any): string[] {
  return mode === "reading" ? charsOf(id, e) : readingsOf(id, e);
}

// Dictionary display names carry a long English parenthetical (e.g. the Nôm
// name followed by "(The Dictionary of …)") that wastes vertical space in the
// results and sidebar. Drop the trailing "(…)" for compact headers; the full
// name stays available via the title tooltip.
function shortLabel(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

interface GeneralDictionaryData {
  tdcndg: {
    defs: DictionaryEntry[];
    refs: [];
  };
  giupdoc: GDNVHVDictionaryEntry[];
  qatd: any[];
  taberd: any[];
  ndtd: any[];
  componentMatches?: string[];
}

export default function Entry({
  entry,
  query,
  searchBar,
}: {
  entry: GeneralDictionaryData;
  query: string;
  // The search bar lives in the main column (same width as the results) with the
  // sidebar beside both, so it is passed in as a slot from the page.
  searchBar?: ReactNode;
}) {
  const locale = useLocale();
  const t = useTranslations();

  // A Nôm/Hán query is CJK; a Quốc Ngữ query is Latin. Reading search → let the
  // user narrow by a specific character; character search → narrow by reading.
  const searchMode: SearchMode = Array.from(query).some(isCJKChar)
    ? "character"
    : "reading";
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const matchesFilter = (id: SourceId, e: any) =>
    selectedFilter === null ||
    valuesOf(searchMode, id, e).includes(selectedFilter);

  // Distinct "other-axis" values across the dictionary results: characters when
  // searching a reading, readings when searching a character. These are the chips.
  // Nhật Dụng Thường Đàm (ndtd) is excluded — its entries are multi-character
  // vocabulary items rather than single headwords, so their characters are too
  // diverse and would clutter the filter.
  const distinctFilterValues = useMemo(() => {
    const set = new Set<string>();
    const add = (id: SourceId, items: any[]) => {
      for (const e of items ?? [])
        for (const v of valuesOf(searchMode, id, e)) set.add(v);
    };
    add("tdcndg", entry.tdcndg?.defs);
    add("giupdoc", entry.giupdoc);
    add("qatd", entry.qatd);
    add("taberd", entry.taberd);
    return Array.from(set);
  }, [entry, searchMode]);

  const tdcndgDefs = (entry.tdcndg?.defs ?? []).filter((d) =>
    matchesFilter("tdcndg", d)
  );
  const giupdocDefs = (entry.giupdoc ?? []).filter((d) =>
    matchesFilter("giupdoc", d)
  );
  const qatdDefs = (entry.qatd ?? []).filter((d) => matchesFilter("qatd", d));
  const taberdDefs = (entry.taberd ?? []).filter((d) =>
    matchesFilter("taberd", d)
  );
  // ndtd is not part of the filter: show all of it in the unfiltered (All) view,
  // and hide it once a specific character/reading is selected.
  const ndtdDefs = selectedFilter === null ? entry.ndtd ?? [] : [];

  const sourceSections = [
    {
      id: "source-tdcndg",
      label: t(
        "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.name"
      ),
      hasResults: tdcndgDefs.length > 0,
      href: `/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai?q=${query}`,
      content: tdcndgDefs.map((def, idx) => (
        <EntryTDCNDG key={idx} entry={def} refs={entry.tdcndg.refs} />
      )),
    },
    {
      id: "source-giupdoc",
      label: t(
        "Tools.han-nom-dictionaries.dictionaries.giup-doc-nom-va-han-viet.name"
      ),
      hasResults: giupdocDefs.length > 0,
      href: `/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet?q=${query}`,
      content: giupdocDefs.map((def, idx) => (
        <EntryGDNVHV key={idx} entry={def} />
      )),
    },
    {
      id: "source-qatd",
      label: t(
        "Tools.han-nom-dictionaries.dictionaries.nguyen-trai-quoc-am-tu-dien.name"
      ),
      hasResults: qatdDefs.length > 0,
      href: `/tools/han-nom-dictionaries/nguyen-trai-quoc-am-tu-dien?q=${query}`,
      content: qatdDefs.map((def, idx) => <EntryQATD key={idx} entry={def} />),
    },
    {
      id: "source-taberd",
      label: t("Tools.han-nom-dictionaries.dictionaries.taberd.name"),
      hasResults: taberdDefs.length > 0,
      href: `/tools/han-nom-dictionaries/taberd?q=${query}`,
      content: taberdDefs.map((def, idx) => (
        <EntryTaberd key={idx} entry={def} />
      )),
    },
    {
      id: "source-ndtd",
      label: t(
        "Tools.han-nom-dictionaries.dictionaries.nhat-dung-thuong-dam.name"
      ),
      hasResults: ndtdDefs.length > 0,
      href: `/tools/han-nom-dictionaries/nhat-dung-thuong-dam?q=${query}`,
      content: ndtdDefs.map((def, idx) => <EntryNDTD key={idx} entry={def} />),
    },
  ].filter((section) => section.hasResults);

  const jumpTitle = locale === "en" ? "Jump to source" : "Đến nguồn";
  const filterTabLabel =
    searchMode === "reading"
      ? t("Tools.han-nom-dictionaries.dictionaries.general.filter.by-character")
      : t("Tools.han-nom-dictionaries.dictionaries.general.filter.by-reading");
  const sidebarProps = {
    sections: sourceSections.map((s) => ({
      id: s.id,
      label: shortLabel(s.label),
    })),
    jumpTitle,
    filterTitle: filterTabLabel,
    allLabel: t("Tools.han-nom-dictionaries.dictionaries.general.filter.all"),
    values: distinctFilterValues,
    selected: selectedFilter,
    onSelect: setSelectedFilter,
    isCharChip: searchMode === "reading",
    nomClass: NomNaTong.className,
  };
  const showSidebar =
    sourceSections.length > 0 || distinctFilterValues.length > 1;
  const mobileNavLabel =
    distinctFilterValues.length > 1
      ? `${jumpTitle} · ${filterTabLabel}`
      : jumpTitle;

  const componentMatches = entry.componentMatches ?? [];
  const queryChars =
    componentMatches.length > 0
      ? Array.from(query).filter((ch) => {
          const cp = ch.codePointAt(0);
          if (cp === undefined) return false;
          return (
            (cp >= 0x4e00 && cp <= 0x9fff) ||
            (cp >= 0x3400 && cp <= 0x4dbf) ||
            (cp >= 0x20000 && cp <= 0x2ebef) ||
            (cp >= 0x30000 && cp <= 0x323af) ||
            (cp >= 0xf900 && cp <= 0xfaff)
          );
        })
      : [];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Desktop: sticky sidebar beside the results holding the jump-to-source
          and filter tabs. */}
      {showSidebar && (
        <aside className="hidden lg:block lg:w-60 shrink-0 lg:sticky lg:top-24 self-start lg:max-h-[calc(100vh-7rem)] overflow-y-auto">
          <ResultsSidebar {...sidebarProps} />
        </aside>
      )}

      <div className="flex-1 min-w-0">
        {searchBar}
        <div className="space-y-8">
          {componentMatches.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div
              className={`text-lg text-branding-brown mb-3 ${merriweather.className}`}
            >
              {locale === "en"
                ? `Characters with components ${queryChars
                    .map((ch) => `[${ch}]`)
                    .join("")}`
                : `Chữ có các thành phần ${queryChars
                    .map((ch) => `[${ch}]`)
                    .join("")}`}
            </div>
            <div
              className={`flex flex-wrap gap-4 text-3xl ${NomNaTong.className}`}
            >
              {componentMatches.map((ch) => (
                <Link
                  key={ch}
                  href={`/tools/han-nom-dictionaries/general?q=${encodeURIComponent(
                    ch
                  )}`}
                  className="hover:text-branding-brown transition-colors"
                >
                  {ch}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Mobile: the same jump + filter tabs in a compact, default-collapsed
            control so they don't push the results down. */}
        {showSidebar && (
          <div className="lg:hidden">
            <Accordion type="single" collapsible>
              <AccordionItem
                value="results-nav"
                className="border rounded-lg bg-white px-4"
              >
                <AccordionTrigger className="text-branding-brown hover:no-underline py-3 text-sm">
                  {mobileNavLabel}
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0">
                  <ResultsSidebar {...sidebarProps} bare />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {sourceSections.map((section) => (
          <div
            key={section.id}
            id={section.id}
            data-general-source-id={section.id}
            data-general-source-label={section.label}
            className="scroll-mt-28"
          >
            <Link href={section.href} target="_blank" rel="noopener noreferrer">
              <div
                title={section.label}
                className={`text-xl text-branding-brown mb-3 hover:underline ${merriweather.className}`}
              >
                {shortLabel(section.label)}
              </div>
            </Link>
            {section.content}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
