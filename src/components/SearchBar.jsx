import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { useTranslation } from "react-i18next";

const SearchBar = () => {
  const { t } = useTranslation();
  return (
    <form className="flex mt-5 mb-15 w-full">
      <div className="relative flex-grow md:flex-grow-0">
        <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          type="text"
          name="search-query"
          placeholder={t("btn-search")}
          className="rounded border pl-8 w-full md:w-80 h-10"
        />
      </div>
      <input
        type="submit"
        value={t("btn-search")}
        className="border rounded-lg px-5 mx-2 bg-primary-blue text-white"
      />
    </form>
  );
};

export default SearchBar;
