import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";

const SearchBar = () => {
  return (
    <form className="flex my-5">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          type="text"
          name="search-query"
          placeholder="Search"
          className="rounded border pl-8"
        />
      </div>
      <input
        type="submit"
        value="Search"
        className="border rounded px-2 mx-2 bg-primary-blue text-white"
      />
    </form>
  );
};

export default SearchBar;
