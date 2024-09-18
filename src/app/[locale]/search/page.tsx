import { useTranslations } from "next-intl";
const SearchResult = ({
  searchParams,
}: {
  searchParams: {
    query: string;
    page: string;
  };
}) => {
  const searchQuery = searchParams.query;
  const page = Number(searchParams.page);

  const t = useTranslations("SearchResult");

  const searchResult = [];

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        {/* Header */}
        <section className="flex flex-col items-center justify-center">
          <h1 className="">{t("title")}</h1>
        </section>

        {/* Search result */}
        <p className="text-xl mb-5">
          {t("search-result-for")} "{searchQuery}"
        </p>

        {/* Pagination */}
        {searchResult.length == 0 && <p>{t("no-search-result")}</p>}
        {searchResult.length > 0 && (
          // Pagination
          <div></div>
        )}
      </div>
    </div>
  );
};

export default SearchResult;
