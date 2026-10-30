"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
// eslint-disable-next-line import/no-unresolved
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";

import {
  InstantSearch,
  connectSearchBox,
  connectHits,
  Configure,
} from "react-instantsearch-dom";
import algoliasearch from "algoliasearch/lite";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchBarResultItem from "./SearchBarResultItem";
import { cn } from "@/lib/utils";

const originalSearchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
  process.env.NEXT_PUBLIC_ALGOLIA_API_KEY || ""
);
const searchClient = {
  ...originalSearchClient,
  search(requests) {
    if (requests.every(({ params }) => !params.query)) {
      return Promise.resolve({
        results: requests.map(() => ({
          hits: [],
          nbHits: 0,
          nbPages: 0,
          page: 0,
          processingTimeMS: 0,
        })),
      });
    }

    return originalSearchClient.search(requests);
  },
};
const CustomSearchBox = ({
  currentRefinement,
  refine,
  variant = "default",
  onSearch,
  onQueryChange,
  onOpen,
  onClose,
}: any) => {
  const t = useTranslations();
  const isNavVariant = variant === "nav";

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && currentRefinement.trim()) {
      e.preventDefault();
      onSearch(currentRefinement.trim());
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="relative w-full">
      <MagnifyingGlassIcon className="absolute bg-branding-white right-4 top-1/2 transform -translate-y-1/2 pl-2 h-7 w-7 text-gray-700" />
      <input
        type="text"
        name="search-query"
        placeholder={t("SearchResult.search-across-website")}
        value={currentRefinement}
        onChange={(e) => {
          refine(e.target.value);
          onQueryChange(e.target.value);
        }}
        onFocus={onOpen}
        onKeyDown={handleKeyDown}
        className={cn(
          "font-light font-['Helvetica Neue'] w-full px-5 py-2 bg-branding-white border justify-start items-center gap-4 inline-flex overflow-hidden",
          isNavVariant ? "h-11 rounded-full" : "h-[54px] rounded-[26px]"
        )}
      />
    </div>
  );
};

const SearchInput = connectSearchBox(CustomSearchBox);

const CustomHits = connectHits(
  ({ hits, locale, isNavVariant, navDropdownTop, query, onClose }: any) => {
    const t = useTranslations("SearchResult");
    const seenSlugs = new Set();
    const filteredHits = hits
      .filter((hit) => {
        if (hit.locale !== locale) return false;
        const slug = hit?.slug;
        if (!slug) return true;
        if (seenSlugs.has(slug)) return false;
        seenSlugs.add(slug);
        return true;
      })
      .slice(0, 10);

    if (filteredHits.length === 0) return null;

    return (
      <div
        className={cn(
          "z-10 mt-2 rounded-lg shadow-lg shadow-black/[0.15]",
          isNavVariant
            ? "fixed left-1/2 -translate-x-1/2 w-[min(80rem,calc(100vw-40px))] md:w-[min(80rem,calc(100vw-100px))]"
            : "sm:px-10 md:px-24 flex flex-col justify-center items-center"
        )}
        style={isNavVariant ? { top: navDropdownTop ?? undefined } : undefined}
      >
        <ScrollArea
          className={`h-[0px] w-full rounded-t-lg py-2 [&>[data-radix-scroll-area-viewport]]:overscroll-contain ${
            filteredHits.length > 0 ? "bg-white h-[300px]" : ""
          }`}
        >
          {filteredHits.map((hit) => (
            <SearchBarResultItem key={hit.objectID} hit={hit} />
          ))}
          <Link
            href={`/search?q=${encodeURIComponent(query.trim())}`}
            onClick={onClose}
            className="block w-full border-t bg-white px-6 py-3 text-center text-sm text-branding-black hover:underline"
          >
            {t("see-more-search-results")}
          </Link>
        </ScrollArea>
      </div>
    );
  }
);

const SearchBar = ({
  locale,
  variant = "default",
}: {
  locale: string;
  variant?: "default" | "nav";
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isNavVariant = variant === "nav";
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [navDropdownTop, setNavDropdownTop] = useState<number | null>(null);

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleSearch = (searchQuery: string) => {
    setIsDropdownOpen(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  useEffect(() => {
    if (!isNavVariant) return;

    const updatePosition = () => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      setNavDropdownTop(rect.bottom + window.scrollY + 4);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isNavVariant]);

  return (
    <div
      ref={wrapperRef}
      className={cn("w-full relative", isNavVariant ? "p-0" : "px-4 py-8")}
    >
      <InstantSearch
        searchClient={searchClient}
        indexName={process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME}
      >
        <div className={cn(isNavVariant ? "p-0" : "px-4 pt-4")}>
          <SearchInput
            variant={variant}
            onSearch={handleSearch}
            onQueryChange={(value: string) => {
              setQuery(value);
              setIsDropdownOpen(Boolean(value.trim()));
            }}
            onOpen={() => setIsDropdownOpen(Boolean(query.trim()))}
            onClose={() => setIsDropdownOpen(false)}
          />
        </div>
        {isDropdownOpen && query.trim() && (
          <CustomHits
            locale={locale}
            isNavVariant={isNavVariant}
            navDropdownTop={navDropdownTop}
            query={query}
            onClose={() => setIsDropdownOpen(false)}
          />
        )}
        <Configure
          // filters={`locale:${locale}`}
          attributesToRetrieve={[
            "slug",
            "online_resource_types",
            "collections",
            "collection_slugs",
            "thumbnail",
            "title",
            "name",
            "description",
            "abstract",
            "collection_location",
            "collection_slugs",
            "locale",
          ]}
          highlightPreTag="<mark>"
          highlightPostTag="</mark>"
        />
      </InstantSearch>
    </div>
  );
};

export default SearchBar;
