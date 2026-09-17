"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";

// Mirrors the search form on viet-dien.com's home page: the mode dropdown only
// composes the query syntax (NEAR/n, AND) into `query`, so the address that
// opens on Việt Điển is one a reader could have typed there themselves.

type Mode = "exact" | "all" | "proximity" | "concordance";

const VIET_DIEN_URL = "https://viet-dien.com";

const inputClass =
  "min-w-0 flex-1 rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#33529f] focus:border-[#33529f]";

export default function VietDienSearch() {
  const t = useTranslations("ResearchHub.HanNomHub.cards.vietDien");
  const locale = useLocale();

  const [mode, setMode] = useState<Mode>("exact");
  const [query, setQuery] = useState("");
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [within, setWithin] = useState("10");
  const [narrow, setNarrow] = useState(false);

  const queryRef = useRef<HTMLInputElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const secondRef = useRef<HTMLInputElement>(null);

  // Below 640px the full placeholders are cut to a fragment, so the boxes
  // show the short wording (the aria-label keeps the full one).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const isNear = mode === "proximity";

  const hints: Record<Mode, string> = {
    exact: t("hintExact"),
    all: t("hintAll"),
    proximity: t("hintProximity"),
    concordance: t("hintConcordance"),
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let composed = query.trim();
    if (isNear) {
      const x = first.trim();
      const y = second.trim();
      if (!x || !y) {
        (x ? secondRef : firstRef).current?.focus();
        return;
      }
      const n = Math.min(99, Math.max(1, parseInt(within, 10) || 10));
      composed = `${x} NEAR/${n} ${y}`;
    } else if (mode === "all") {
      const terms = composed.split(/\s+/).filter(Boolean);
      if (terms.length > 1) composed = terms.join(" AND ");
    }
    if (!composed) {
      queryRef.current?.focus();
      return;
    }

    const path = mode === "concordance" ? "/concordance" : "/search";
    const params = new URLSearchParams({ query: composed, lang: locale });
    window.open(
      `${VIET_DIEN_URL}${path}?${params}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 mx-auto flex w-full max-w-2xl flex-col items-center gap-2"
    >
      <div className="flex w-full flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        <select
          aria-label={t("mode")}
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          className="shrink-0 rounded-md border border-slate-300 bg-white text-slate-900 px-2 sm:px-2.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#33529f] focus:border-[#33529f]"
        >
          <option value="exact">{t("modeExact")}</option>
          <option value="proximity">{t("modeProximity")}</option>
          <option value="all">{t("modeAll")}</option>
          <option value="concordance">{t("modeConcordance")}</option>
        </select>

        {isNear ? (
          // `contents` lets the two term boxes share the row with the dropdown
          // and button, and drops "within n characters" onto its own line. The
          // banner is at most 2/3 of the column, never wide enough for one row.
          <span className="contents">
            <input
              ref={firstRef}
              type="search"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              aria-label={t("nearFirst")}
              placeholder={narrow ? t("nearFirstShort") : t("nearFirst")}
              className={`${inputClass} px-2 sm:px-3`}
            />
            <input
              ref={secondRef}
              type="search"
              value={second}
              onChange={(e) => setSecond(e.target.value)}
              aria-label={t("nearSecond")}
              placeholder={narrow ? t("nearSecondShort") : t("nearSecond")}
              className={`${inputClass} px-2 sm:px-3`}
            />
            <span className="order-1 basis-full flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap text-xs text-slate-600">
              <label htmlFor="vd-near-n">{t("nearWithin")}</label>
              <input
                id="vd-near-n"
                type="number"
                min={1}
                max={99}
                inputMode="numeric"
                value={within}
                onChange={(e) => setWithin(e.target.value)}
                className="w-14 rounded-md border border-slate-300 bg-white text-slate-900 px-2 py-2 text-center text-sm focus:outline-none focus:ring-1 focus:ring-[#33529f] focus:border-[#33529f]"
              />
              {t("nearChars")}
            </span>
          </span>
        ) : (
          <input
            ref={queryRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t("searchPlaceholder")}
            placeholder={
              narrow ? t("searchPlaceholderShort") : t("searchPlaceholder")
            }
            className={`${inputClass} px-4`}
          />
        )}

        <button
          type="submit"
          aria-label={t("search")}
          className="shrink-0 flex items-center justify-center rounded-md bg-[#00196e] h-11 w-11 sm:h-auto sm:w-auto sm:px-5 sm:py-2.5 text-sm font-medium text-white hover:bg-[#001456]"
        >
          <Search className="h-5 w-5 sm:hidden" aria-hidden />
          <span className="hidden sm:inline">{t("search")}</span>
        </button>
      </div>
      <p className="text-xs text-slate-500">{hints[mode]}</p>
    </form>
  );
}
