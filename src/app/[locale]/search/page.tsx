import { getTranslations } from "next-intl/server";
import qs from "qs";

import FilterSidebar from "@/app/[locale]/search/FilterSidebar";
import CollectionItem from "@/components/collection/CollectionItem";
import SearchResults from "./SearchResult";
import { fetcher } from "@/lib/api";

const SearchResult = async ({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    query: string;
    language: string;
    page: string;
  }>;
}) => {
  const { query: searchQuery, language, page } = await searchParams;
  const { locale } = await params;

  const t = await getTranslations("SearchResult");

  let searchResult = [];

  try {
    const queryParams = {
      fields: "*",
      populate: [
        "thumbnail",
        "date_created",
        "languages",
        "contributor",
        "contributor.author",
        "contributor.author_role_term",
        "resource_types",
        "place_of_publication",
        "subjects",
        "collections",
        "publisher",
      ],
      locale: locale,
    };

    if (language) {
      queryParams["filters[languages][name][$eq]"] = language;
    }

    const queryString = qs.stringify(queryParams);

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/collection-items?${queryString}`;
    const data = await fetcher(url);
    const collectionData = data.data;
    console.log("Collection data:", collectionData[0]);
    // console.log("collections", collectionData[0].collections);
    searchResult = collectionData;
  } catch (error) {
    console.error("Error fetching collection:", error);
  }

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mx-5">
        {/* Header */}
        <section className="flex flex-col items-center justify-center">
          <h1 className="">{t("title")}</h1>
        </section>

        {/* Search result */}
      </div>

      <SearchResults
        searchResults={searchResult}
        locale={locale}
        searchQuery={searchQuery}
      />
    </div>
  );
};

export default SearchResult;
