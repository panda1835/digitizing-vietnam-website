"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { useTranslations } from "next-intl";
// eslint-disable-next-line import/no-unresolved
import { useRouter } from "@/i18n/routing";
import { useState } from "react";

import {
  InstantSearch,
  connectSearchBox,
  connectHits,
  Configure,
} from "react-instantsearch-dom";
import algoliasearch from "algoliasearch/lite";
import { ScrollArea } from "@/components/ui/scroll-area";

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
const CustomSearchBox = ({ currentRefinement, refine }: any) => {
  const t = useTranslations("Button");

  return (
    <div className="relative w-full">
      <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-700" />
      <input
        type="text"
        name="search-query"
        placeholder={t("search")}
        value={currentRefinement}
        onChange={(e) => refine(e.target.value)}
        className="h-[54px] w-full px-5 py-2 pl-12 bg-[#ededed] rounded-[26px] justify-start items-center gap-4 inline-flex overflow-hidden"
      />
    </div>
  );
};

const SearchInput = connectSearchBox(CustomSearchBox);

const SearchBar = ({ locale }: { locale: string }) => {
  const t = useTranslations("Button");
  const [query, setQuery] = useState("");

  const router = useRouter();

  console.log("locale", locale);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?query=${query.trim()}&page=1`);
    }
  };

  const CustomHits = connectHits(({ hits }) => (
    <div className="absolute left-0 sm:px-10 md:px-20 w-full flex justify-center items-center">
      <ScrollArea className="h-[300px] w-full">
        {hits.map((hit) => (
          <>
            {hit.locale === locale && ( // Filter by locale
              <div
                key={hit}
                className="border bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out"
              >
                <div className="p-5">
                  <div className="text-xl font-semibold mb-2">{hit.title}</div>
                  <div className="text-muted-foreground mb-2">
                    {(hit.description || hit.abstract).slice(0, 100)}...
                  </div>
                </div>
              </div>
            )}
          </>
        ))}
      </ScrollArea>
    </div>
  ));

  return (
    // <form className="flex" onSubmit={handleSubmit}>
    //   <div className="relative flex-grow md:flex-grow-0">
    //     <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
    //     <input
    //       type="text"
    //       name="search-query"
    //       placeholder={t("search")}
    //       onChange={(e) => setQuery(e.target.value)}
    //       className="rounded border-2 border-black pl-8 w-full md:w-80 h-10 "
    //     />
    //   </div>
    //   <input
    //     type="submit"
    //     value={t("search")}
    //     className="border-2 border-black rounded-lg px-5 mx-2 bg-primary-blue text-white cursor-pointer"
    //   />
    // </form>
    <div className="w-full px-4 py-8">
      <InstantSearch
        searchClient={searchClient}
        indexName="development_api::strapi"
      >
        <div className="p-4">
          <SearchInput />
        </div>
        <CustomHits />
        {/* <Configure filters={`locale:${locale}`} /> */}
      </InstantSearch>
    </div>
  );
};

export default SearchBar;
