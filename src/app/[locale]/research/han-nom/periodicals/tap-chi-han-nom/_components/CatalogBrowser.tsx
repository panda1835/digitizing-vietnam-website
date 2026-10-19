"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  X,
  ChevronLeft,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Merriweather } from "next/font/google";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import catalog from "../_data/catalog.json";

const merriweather = Merriweather({ weight: ["300", "400"], subsets: ["vietnamese"] });

type Issue = { c: number | null; y: string; n: string; p: string; a: number };
/**
 * [issueIndex, page, author, title, kind, pageUncertain, url, linkKind]
 * linkKind: 0 the article's own page, 1 the issue's contents page, 2 none.
 */
type Row = [number, number | null, string, string, number, number, string, number];

const LINK_OWN = 0;
const LINK_TOC = 1;
const LINK_ISSUE_PDF = 3;

const ISSUES = catalog.issues as Issue[];
const ROWS = catalog.articles as Row[];
const KINDS = catalog.kinds as Record<string, string>;

const ARTICLE = 0;
const APPENDIX = -1;

/** Fold diacritics so "han nom" finds "Hán Nôm" and "dai viet" finds "Đại Việt". */
function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

const FOLDED: string[] = ROWS.map((r) => fold(`${r[3]} ${r[2]}`));

/**
 * The journal prints more than articles: staff notices, conference reports,
 * the annual index, the masthead. They are kept so an issue reads as it was
 * actually printed, and labelled so they are not mistaken for scholarship.
 */
const KIND_LABELS: Record<string, [string, string]> = {
  notice: ["Notice", "Tin tức"],
  review: ["Review", "Giới thiệu sách"],
  annual_index: ["Annual index", "Mục lục năm"],
  masthead: ["Masthead", "Măng sét"],
  download_link: ["Download link", "Liên kết tải"],
  unplaced: ["Page not given", "Không rõ trang"],
};

function kindLabel(kind: string, vi: boolean): string {
  const pair = KIND_LABELS[kind];
  return pair ? pair[vi ? 1 : 0] : kind;
}

function decadeOf(year: string): string {
  const n = parseInt(year, 10);
  return Number.isFinite(n) ? `${Math.floor(n / 10) * 10}s` : "—";
}

export default function CatalogBrowser({ locale }: { locale: string }) {
  const t = useTranslations("TchnCatalog");
  const vi = locale === "vi";

  const [query, setQuery] = React.useState("");
  const [decade, setDecade] = React.useState<string | null>(null);
  const [openIssue, setOpenIssue] = React.useState<number | null>(null);
  const [showAll, setShowAll] = React.useState(false);

  const decades = React.useMemo(() => {
    const seen: string[] = [];
    for (const i of ISSUES) {
      const d = decadeOf(i.y);
      if (d !== "—" && !seen.includes(d)) seen.push(d);
    }
    return seen.sort();
  }, []);

  // Rows grouped by issue, so opening one costs no scan of the whole run.
  const byIssue = React.useMemo(() => {
    const m = new Map<number, Row[]>();
    ROWS.forEach((r) => {
      const a = m.get(r[0]);
      if (a) a.push(r);
      else m.set(r[0], [r]);
    });
    return m;
  }, []);

  const q = fold(query.trim());
  const results = React.useMemo(() => {
    if (q.length < 2) return null;
    const out: number[] = [];
    for (let i = 0; i < ROWS.length; i++) {
      if (FOLDED[i].includes(q)) out.push(i);
      if (out.length >= 400) break;
    }
    return out;
  }, [q]);

  const visibleIssues = React.useMemo(
    () => (decade ? ISSUES.filter((i) => decadeOf(i.y) === decade) : ISSUES),
    [decade]
  );

  const totals = React.useMemo(() => {
    const articles = ROWS.filter((r) => r[4] === ARTICLE).length;
    const authored = ROWS.filter((r) => r[4] === ARTICLE && r[2]).length;
    const years = ISSUES.map((i) => parseInt(i.y, 10)).filter(Number.isFinite);
    return {
      issues: ISSUES.length,
      articles,
      authored,
      from: Math.min(...years),
      to: Math.max(...years),
    };
  }, []);

  function issueLabel(i: Issue): string {
    const so = vi ? "Số" : "No.";
    return i.c ? `${so} ${i.n} (${i.c})` : `${so} ${i.n}`;
  }

  /** One contents row. */
  function Entry({ r, withIssue }: { r: Row; withIssue?: boolean }) {
    const iss = r[0] >= 0 ? ISSUES[r[0]] : null;
    const kind = KINDS[String(r[4])] ?? "article";
    return (
      <div className="flex gap-3 py-2 border-b border-neutral-200 last:border-0">
        <div className="w-12 shrink-0 text-right text-sm text-neutral-500 tabular-nums pt-[2px]">
          {r[1] ?? "—"}
          {r[5] === 1 && (
            <AlertTriangle
              className="inline-block ml-1 h-3 w-3 text-amber-600 align-top"
              aria-label={t("uncertainPage")}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-branding-black leading-snug">
            {r[6] ? (
              <a
                href={r[6]}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-branding-brown hover:underline underline-offset-2"
                title={
                  r[7] === LINK_OWN
                    ? t("linkOwn")
                    : r[7] === LINK_ISSUE_PDF
                      ? t("linkPdf")
                      : t("linkToc")
                }
              >
                {r[3]}
                <ExternalLink className="ml-1 inline-block h-3 w-3 align-baseline text-neutral-400" />
              </a>
            ) : (
              r[3]
            )}
          </div>
          <div className="mt-[2px] flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-600">
            {r[2] ? <span>{r[2]}</span> : <span className="italic">{t("noAuthor")}</span>}
            {kind !== "article" && (
              <Badge variant="secondary" className="font-normal">
                {kindLabel(kind, vi)}
              </Badge>
            )}
            {r[7] === LINK_TOC && (
              <span className="text-neutral-400">{t("linkTocShort")}</span>
            )}
            {r[7] === LINK_ISSUE_PDF && (
              <span className="text-neutral-400">{t("linkPdfShort")}</span>
            )}
            {withIssue && iss && (
              <span className="text-neutral-400">
                {issueLabel(iss)} · {iss.y}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- search results ----------
  if (results) {
    return (
      <div>
        <SearchBar
          query={query}
          setQuery={setQuery}
          placeholder={t("searchPlaceholder")}
        />
        <p className="mt-3 text-sm text-neutral-600">
          {t("resultCount", { count: results.length })}
          {results.length >= 400 && ` ${t("resultCapped")}`}
        </p>
        <div className="mt-4">
          {results.map((i) => (
            <Entry key={i} r={ROWS[i]} withIssue />
          ))}
          {results.length === 0 && (
            <p className="py-8 text-neutral-500">{t("noResults")}</p>
          )}
        </div>
      </div>
    );
  }

  // ---------- one issue, opened ----------
  if (openIssue !== null) {
    const iss = ISSUES[openIssue];
    const rows = (byIssue.get(openIssue) ?? []).filter(
      (r) => showAll || r[4] === ARTICLE
    );
    const hidden = (byIssue.get(openIssue) ?? []).length - rows.length;
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => setOpenIssue(null)}
          className="mb-4 -ml-2 text-branding-brown hover:text-branding-brown"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("backToIssues")}
        </Button>
        <div className={`${merriweather.className} text-2xl text-branding-black`}>
          {issueLabel(iss)} · {iss.y}
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          {t("issueMeta", { articles: iss.a })}
          {iss.p ? ` · ${t("pages")} ${iss.p}` : ""}
        </p>
        <div className="mt-5">
          {rows.map((r, n) => (
            <Entry key={n} r={r} />
          ))}
        </div>
        {hidden > 0 && (
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => setShowAll(true)}
          >
            {t("showOther", { count: hidden })}
          </Button>
        )}
      </div>
    );
  }

  // ---------- the run, by issue ----------
  const appendix = (byIssue.get(APPENDIX) ?? []).filter(
    (r) => r[4] === ARTICLE
  );
  return (
    <div>
      <SearchBar
        query={query}
        setQuery={setQuery}
        placeholder={t("searchPlaceholder")}
      />

      <p className="mt-3 text-sm text-neutral-600">
        {t("totals", {
          issues: totals.issues,
          articles: totals.articles,
          from: totals.from,
          to: totals.to,
        })}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <FilterChip active={decade === null} onClick={() => setDecade(null)}>
          {t("allYears")}
        </FilterChip>
        {decades.map((d) => (
          <FilterChip
            key={d}
            active={decade === d}
            onClick={() => setDecade(d === decade ? null : d)}
          >
            {d}
          </FilterChip>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleIssues.map((iss) => {
          const idx = ISSUES.indexOf(iss);
          return (
            <button
              key={`${iss.y}-${iss.n}-${iss.c ?? "x"}`}
              onClick={() => {
                setOpenIssue(idx);
                setShowAll(false);
              }}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left transition hover:border-branding-brown hover:shadow-sm"
            >
              <div
                className={`${merriweather.className} text-branding-black text-lg`}
              >
                {issueLabel(iss)}
              </div>
              <div className="mt-1 text-sm text-neutral-600">
                {iss.y} · {t("articleCount", { count: iss.a })}
              </div>
            </button>
          );
        })}
      </div>

      {appendix.length > 0 && decade === null && (
        <div className="mt-10 border-t border-neutral-200 pt-6">
          <div className={`${merriweather.className} text-xl text-branding-black`}>
            {t("appendixTitle")}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            {t("appendixNote", { count: appendix.length })}
          </p>
          <div className="mt-4">
            {appendix.slice(0, 40).map((r, n) => (
              <Entry key={n} r={r} />
            ))}
          </div>
          {appendix.length > 40 && (
            <p className="mt-3 text-sm text-neutral-500">
              {t("appendixMore", { count: appendix.length - 40 })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SearchBar({
  query,
  setQuery,
  placeholder,
}: {
  query: string;
  setQuery: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {query && (
        <button
          onClick={() => setQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
          aria-label="clear"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active
          ? "border-branding-brown bg-branding-brown text-white"
          : "border-neutral-300 text-neutral-700 hover:border-branding-brown"
      }`}
    >
      {children}
    </button>
  );
}
