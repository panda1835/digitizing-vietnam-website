"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
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
import SearchBarResultItem from "./SearchBarResultItem";

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
// const CustomSearchBox = ({ currentRefinement, refine }: any) => {
//   const t = useTranslations("Button");

//   return (
//     <div className="relative w-full">
//       <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-700" />
//       <input
//         type="text"
//         name="search-query"
//         placeholder={t("search")}
//         value={currentRefinement}
//         onChange={(e) => refine(e.target.value)}
//         className="h-[54px] w-full px-5 py-2 pl-12 bg-[#ededed] rounded-[26px] justify-start items-center gap-4 inline-flex overflow-hidden"
//       />
//     </div>
//   );
// };

const CustomSearchBox = ({ currentRefinement, refine }: any) => {
  const t = useTranslations();
  const router = useRouter();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && currentRefinement.trim()) {
      e.preventDefault();
      router.push(`/search?q=${encodeURIComponent(currentRefinement.trim())}`);
    }
  };

  return (
    <div className="relative w-full">
      <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-700" />
      <input
        type="text"
        name="search-query"
        placeholder={t("SearchResult.search-across-website")}
        value={currentRefinement}
        onChange={(e) => refine(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-[54px] font-light font-['Helvetica Neue'] w-full px-5 py-2 pl-12 bg-branding-white shadow-lg rounded-[26px] justify-start items-center gap-4 inline-flex overflow-hidden"
      />
    </div>
  );
};

const SearchInput = connectSearchBox(CustomSearchBox);

const SearchBar = ({ locale }: { locale: string }) => {
  const t = useTranslations("Button");
  const [query, setQuery] = useState("");

  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?query=${query.trim()}&page=1`);
    }
  };

  const CustomHits = connectHits(({ hits }) => (
    <div className="absolute z-10 left-0 mt-2 sm:px-10 md:px-24 w-full flex justify-center items-center rounded-lg">
      <ScrollArea
        className={`h-[0px] w-full rounded-lg py-2 ${
          hits.length > 0 ? "bg-white h-[300px]" : ""
        }`}
      >
        {hits.map((hit) => (
          <>
            {hit.locale === locale && ( // Filter by locale
              <SearchBarResultItem key={hit.objectID} hit={hit} />
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
        indexName={process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME}
      >
        <div className="px-4 pt-4">
          <SearchInput />
        </div>
        <CustomHits />
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
