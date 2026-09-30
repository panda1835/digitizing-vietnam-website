"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";

// One box, one job: the phrase goes to viet-dien.com's own search, so the
// address that opens there is one a reader could have typed themselves.
// The mode picker (NEAR/n, AND, concordance) is off the hub for now — those
// searches are still a click away on Việt Điển itself.

const VIET_DIEN_URL = "https://viet-dien.com";

export default function VietDienSearch() {
  const t = useTranslations("ResearchHub.HanNomHub.cards.vietDien");
  const locale = useLocale();

  const [query, setQuery] = useState("");
  const [narrow, setNarrow] = useState(false);

  const queryRef = useRef<HTMLInputElement>(null);

  // Below 640px the full placeholder is cut to a fragment, so the box shows
  // the short wording (the aria-label keeps the full one).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const composed = query.trim();
    if (!composed) {
      queryRef.current?.focus();
      return;
    }

    const params = new URLSearchParams({ query: composed, lang: locale });
    window.open(
      `${VIET_DIEN_URL}/search?${params}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 mx-auto flex w-full max-w-2xl flex-col items-center gap-2"
    >
      <div className="flex w-full items-center gap-1.5 sm:gap-2">
        <input
          ref={queryRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t("searchPlaceholder")}
          placeholder={
            narrow ? t("searchPlaceholderShort") : t("searchPlaceholder")
          }
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#33529f] focus:border-[#33529f]"
        />

        <button
          type="submit"
          aria-label={t("search")}
          className="shrink-0 flex items-center justify-center rounded-md bg-black h-11 w-11 sm:h-auto sm:w-auto sm:px-5 sm:py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <Search className="h-5 w-5 sm:hidden" aria-hidden />
          <span className="hidden sm:inline">{t("search")}</span>
        </button>
      </div>
      <p className="text-xs text-slate-500">{t("hintExact")}</p>
    </form>
  );
}
