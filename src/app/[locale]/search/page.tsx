// import { getTranslations } from "next-intl/server";
// import qs from "qs";

// import FilterSidebar from "@/app/[locale]/search/FilterSidebar";
// import CollectionItem from "@/components/collection/CollectionItem";
// import SearchResults from "./SearchResult";
// import { fetcher } from "@/lib/api";

// const SearchResult = async ({
//   params,
//   searchParams,
// }: {
//   params: Promise<{ locale: string }>;
//   searchParams: Promise<{
//     query: string;
//     language: string;
//     page: string;
//   }>;
// }) => {
//   const { query: searchQuery, language, page } = await searchParams;
//   const { locale } = await params;

//   const t = await getTranslations("SearchResult");

//   let searchResult = [];

//   try {
//     const queryParams = {
//       fields: "*",
//       populate: [
//         "thumbnail",
//         "date_created",
//         "languages",
//         "contributor",
//         "contributor.author",
//         "contributor.author_role_term",
//         "resource_types",
//         "place_of_publication",
//         "subjects",
//         "collections",
//         "publisher",
//       ],
//       locale: locale,
//     };

//     if (language) {
//       queryParams["filters[languages][name][$eq]"] = language;
//     }

//     const queryString = qs.stringify(queryParams);

//     const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/collection-items?${queryString}`;
//     const data = await fetcher(url);
//     const collectionData = data.data;
//     console.log("Collection data:", collectionData[0]);
//     // console.log("collections", collectionData[0].collections);
//     searchResult = collectionData;
//   } catch (error) {
//     console.error("Error fetching collection:", error);
//   }

//   return (
//     <div className="flex flex-col max-width">
//       <div className="flex-col mx-5">
//         {/* Header */}
//         <section className="flex flex-col items-center justify-center">
//           <h1 className="">{t("title")}</h1>
//         </section>

//         {/* Search result */}
//       </div>

//       <SearchResults
//         searchResults={searchResult}
//         locale={locale}
//         searchQuery={searchQuery}
//       />
//     </div>
//   );
// };

// export default SearchResult;

"use client";

import { useSearchParams } from "next/navigation";
import algoliasearch from "algoliasearch/lite";
import {
  InstantSearch,
  SearchBox,
  Hits,
  Pagination,
  RefinementList,
} from "react-instantsearch-dom";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
);

export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Search Results for "{query}"</h1>
      <InstantSearch searchClient={searchClient} indexName="your_index_name">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Filters</h2>
            <RefinementList attribute="category" />
          </div>
          <div className="md:col-span-3">
            <SearchBox defaultRefinement={query} />
            <Hits hitComponent={Hit} />
            <Pagination />
          </div>
        </div>
      </InstantSearch>
    </div>
  );
}

function Hit({ hit }) {
  return (
    <div className="border p-4 rounded-lg mb-4">
      <h2 className="text-xl font-semibold">{hit.name}</h2>
      <p className="text-gray-600">{hit.description}</p>
      <p className="text-sm text-gray-500 mt-2">Category: {hit.category}</p>
    </div>
  );
}
