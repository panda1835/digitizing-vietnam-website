"use client";

// Two-pane reader for the Từ điển nghề thủ công, laid out like the Chăm Book
// Reader: the contents panel (LỜI NÓI ĐẦU, then each Phần heading with its
// Entries, filtered by the title search) beside the open Entry with
// previous/next links in book order. The whole book.md is downloaded once and
// split by parseBook in the browser. The open Entry lives in ?muc=, and a
// missing or unknown slug opens LỜI NÓI ĐẦU.

import {
  Children,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Merriweather } from "next/font/google";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type Components,
  Markdown,
} from "@/components/tools/kho-tang-tuc-ngu/Markdown";
import { cn, normalizeSearchText } from "@/lib/utils";
import { type Book, type Entry, parseBook } from "./parseBook";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const BOOK_URL = "/data/tu-dien-nghe-thu-cong/book.md";

// Shared across mounts so the book downloads once per visit; dropped on
// failure so a remount can retry.
let bookPromise: Promise<Book> | undefined;

const loadBook = () => {
  bookPromise ??= fetch(BOOK_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`${BOOK_URL}: ${response.status}`);
      return response.text();
    })
    .then(parseBook)
    .catch((error) => {
      bookPromise = undefined;
      throw error;
    });
  return bookPromise;
};

/** Case- and diacritic-insensitive (đ included), whitespace runs read as one. */
const searchKey = (text: string) =>
  normalizeSearchText(text).replace(/\s+/g, " ");

const PROSE_CLASSES =
  "font-['Helvetica Neue'] font-light leading-relaxed text-base";

/** parseBook marks verse line breaks with CommonMark's trailing backslash. */
const withHardBreaks = (children: ReactNode) =>
  Children.map(children, (child) =>
    typeof child === "string"
      ? child
          .split("\\\n")
          .flatMap((part, i) => (i === 0 ? [part] : [<br key={i} />, part]))
      : child
  );

// The book has no real lists: its "- " lines are dialogue (and one wrapped
// line), so they stay prose with their dash.
const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => (
    <p className={PROSE_CLASSES}>{withHardBreaks(children)}</p>
  ),
  ul: ({ children }) => <>{children}</>,
  li: ({ children }) => <p className={PROSE_CLASSES}>- {children}</p>,
};

export default function NgheThuCongReader() {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.nghe-thu-cong");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [book, setBook] = useState<Book>();
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const articleRef = useRef<HTMLElement>(null);
  const scrollTargetRef = useRef<string>();
  const muc = searchParams.get("muc") ?? "";

  useEffect(() => {
    let cancelled = false;
    loadBook().then(
      (loaded) => !cancelled && setBook(loaded),
      (error) => {
        console.error(error);
        if (!cancelled) setFailed(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const bySlug = useMemo(
    () => new Map(book?.entries.map((entry) => [entry.slug, entry])),
    [book]
  );

  const searchKeys = useMemo(
    () =>
      new Map(
        book?.entries.map((entry) => [entry, searchKey(entry.title)])
      ),
    [book]
  );

  // After a previous/next link, bring the newly opened Entry's title into view.
  useEffect(() => {
    if (!book || scrollTargetRef.current !== muc) return;
    scrollTargetRef.current = undefined;
    articleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [book, muc]);

  if (failed) {
    return (
      <p role="alert" className={cn("mt-10 text-gray-600", PROSE_CLASSES)}>
        {t("load-error")}
      </p>
    );
  }
  if (!book) {
    return (
      <p role="status" className={cn("mt-10 text-gray-500", PROSE_CLASSES)}>
        {t("loading")}
      </p>
    );
  }

  const entry = bySlug.get(muc) ?? book.preface;
  const position = book.entries.indexOf(entry);
  const previous = book.entries[position - 1];
  const next = book.entries[position + 1];

  // Phần with no matching Entry are hidden.
  const needle = searchKey(query);
  const matches = (item: Entry) => searchKeys.get(item)?.includes(needle);
  const visibleParts = book.parts
    .map((part) => ({ ...part, entries: part.entries.filter(matches) }))
    .filter((part) => part.entries.length > 0);
  const showPreface = matches(book.preface);
  const noResults = !showPreface && visibleParts.length === 0;

  const hrefFor = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("muc", slug);
    return `${pathname}?${params.toString()}`;
  };

  // push, not replace, so Back and Forward move between opened Entries.
  const selectEntry = (slug: string) => {
    startTransition(() => {
      router.push(hrefFor(slug), { scroll: false });
    });
  };

  const renderEntryButton = (item: Entry) => (
    <button
      key={item.slug}
      type="button"
      onClick={() => selectEntry(item.slug)}
      aria-current={item === entry ? "true" : undefined}
      className={cn(
        "block w-full text-left px-6 py-3 border-b border-gray-100 transition-colors text-gray-800",
        item === entry
          ? "bg-gray-50 border-l-4 border-l-branding-brown"
          : "hover:bg-gray-50 hover:border-l-4 hover:border-l-branding-brown"
      )}
    >
      {item.title}
    </button>
  );

  return (
    <div className="w-full flex flex-col lg:flex-row mt-10 gap-8">
      {/* Contents panel */}
      <aside className="w-full lg:w-96 shrink-0 min-w-0 font-light font-['Helvetica Neue']">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-branding-brown uppercase flex justify-center">
            <h2 className="text-xl font-normal text-white">{t("contents")}</h2>
          </div>

          <div className="p-4 border-b border-gray-200">
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search-placeholder")}
              aria-label={t("search-label")}
            />
          </div>

          <ScrollArea className="h-[500px] md:h-[600px] w-full">
            <nav aria-label={t("contents")} className="flex flex-col">
              {/* Always mounted so screen readers announce the message. */}
              <div role="status">
                {noResults && (
                  <p className="px-6 py-4 text-gray-500">{t("no-results")}</p>
                )}
              </div>
              {showPreface && renderEntryButton(book.preface)}
              {visibleParts.map((part) => (
                <div key={part.title}>
                  <h3 className="block w-full text-left px-6 py-3 border-b border-gray-100 font-medium text-branding-brown">
                    {part.title}
                  </h3>
                  {part.entries.map(renderEntryButton)}
                </div>
              ))}
            </nav>
          </ScrollArea>
        </div>
      </aside>

      {/* Open Entry */}
      <article
        ref={articleRef}
        className={cn(
          "mt-5 w-full min-w-0 space-y-5 transition-opacity",
          isPending && "opacity-50"
        )}
      >
        <header>
          <h2
            className={`${merriweather.className} text-[32px] text-branding-black`}
          >
            {entry.title}
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-['Helvetica Neue'] font-light">
            {entry.startPage === entry.endPage
              ? t("page-one", { page: entry.startPage })
              : t("page-range", {
                  start: entry.startPage,
                  end: entry.endPage,
                })}
          </p>
        </header>
        <Markdown components={MARKDOWN_COMPONENTS}>{entry.markdown}</Markdown>

        {(previous || next) && (
          <nav
            aria-label={t("neighbours")}
            className="mt-12 pt-6 flex flex-col sm:flex-row gap-4 justify-between font-['Helvetica Neue'] font-light"
          >
            {previous ? (
              <NeighbourLink
                href={hrefFor(previous.slug)}
                onSelect={() => {
                  scrollTargetRef.current = previous.slug;
                }}
                direction={t("previous")}
                label={previous.title}
                rel="prev"
              />
            ) : (
              <span />
            )}
            {next && (
              <NeighbourLink
                href={hrefFor(next.slug)}
                onSelect={() => {
                  scrollTargetRef.current = next.slug;
                }}
                direction={t("next")}
                label={next.title}
                rel="next"
              />
            )}
          </nav>
        )}
      </article>
    </div>
  );
}

/** A previous/next link; a plain click also marks its Entry to scroll to. */
function NeighbourLink({
  href,
  onSelect,
  direction,
  label,
  rel,
}: {
  href: string;
  onSelect: () => void;
  direction: string;
  label: string;
  rel: "prev" | "next";
}) {
  return (
    <Link
      href={href}
      scroll={false}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        onSelect();
      }}
      rel={rel}
      className={cn(
        "group block sm:max-w-[48%] px-4 py-3 transition-colors",
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
