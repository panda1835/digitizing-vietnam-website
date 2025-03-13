import algoliasearch from "algoliasearch";

import { getTranslations } from "next-intl/server";
import SearchResultView from "./SearchResultView";

import { preprocessSearchResults } from "./filter";
const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID! || "",
  process.env.NEXT_PUBLIC_ALGOLIA_API_KEY! || ""
);

const SearchResultsPage = async ({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: {
    q?: string;
  };
}) => {
  const t = await getTranslations();

  const locale = params.locale;
  const searchQuery = searchParams?.q || "";

  const { results } = await searchClient.search([
    {
      indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME!,
      query: searchQuery,
    },
  ]);

  const hits = (results[0] as any).hits.filter((hit) => hit.locale === locale);

  // console.log("Hits", hits[0]);
  const processedHits = preprocessSearchResults(hits);

  // console.log("Result", hits[0]);

  return (
    <div className="flex flex-col items-center max-width">
      <SearchResultView hits={processedHits} locale={locale} />
    </div>
  );
};

export default SearchResultsPage;
