"use client";

import { useSearchParams } from "next/navigation";
import {
  InstantSearch,
  SearchBox,
  Hits,
  Configure,
} from "react-instantsearch-dom";
import algoliasearch from "algoliasearch/lite";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { useRouter } from "next/navigation";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
  process.env.NEXT_PUBLIC_ALGOLIA_API_KEY || ""
);

const SearchResultsPage = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || ""; // Get the query from the URL
  const [searchQuery, setSearchQuery] = useState(query);
  const router = useRouter();

  // Update searchQuery when URL changes
  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  // Handles new search submissions
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="relative w-full mb-6">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-700" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="w-full h-[54px] px-5 py-2 pl-12 bg-[#ededed] rounded-[26px]"
        />
      </form>

      <InstantSearch
        searchClient={searchClient}
        indexName="development_api::strapi"
      >
        <Configure query={query} />
        <Hits hitComponent={Hit} />
      </InstantSearch>
    </div>
  );
};

// Custom hit component
const Hit = ({ hit }) => (
  <div className="border bg-white hover:bg-gray-100 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out p-4 mb-4">
    <h2 className="text-xl font-semibold">{hit.title || hit.name}</h2>
    <p className="text-muted-foreground">
      {hit.description || hit.abstract || "No description available."}
    </p>
  </div>
);

export default SearchResultsPage;
