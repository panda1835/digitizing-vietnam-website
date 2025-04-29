"use client";

import { useState } from "react";
import Entry from "./Entry";
import { useTranslations } from "next-intl";

import { search } from "../utils";

import DictionarySearchBar from "../DictionarySearchBar";

export default function LookUp({
  entries,
}: {
  entries: GDNVHVDictionaryEntry[];
}) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filtered, setFiltered] = useState<GDNVHVDictionaryEntry[]>([]);
  const t = useTranslations();
  const handleSearch = () => {
    const result = search(
      searchKeyword,
      entries,
      "giup-doc-nom-va-han-viet"
    ) as GDNVHVDictionaryEntry[];
    setFiltered(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="mx-auto p-4">
      <div className="flex gap-4 mb-6 items-center">
        <DictionarySearchBar
          placeholder={t(
            "Tools.han-nom-dictionaries.dictionaries.giup-doc-nom-va-han-viet.search-placeholder"
          )}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          handleKeyDown={handleKeyDown}
          handleSearch={handleSearch}
        />
      </div>
      {filtered.map((entry, index) => (
        <Entry key={index} entry={entry} />
      ))}
    </div>
  );
}
