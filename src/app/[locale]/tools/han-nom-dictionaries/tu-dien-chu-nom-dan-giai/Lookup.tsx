"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Entry from "./Entry";
import { useTranslations } from "next-intl";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { search } from "../utils";
import localFont from "next/font/local";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function LookUp({
  entries,
  refs,
}: {
  entries: DictionaryEntry[];
  refs: Reference[];
}) {
  const t = useTranslations();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filtered, setFiltered] = useState<DictionaryEntry[]>([]);

  const handleSearch = () => {
    const result = search(
      searchKeyword,
      entries,
      "tu-dien-chu-nom-dan-giai"
    ) as DictionaryEntry[];
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
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-700" />
          <input
            type="text"
            name="search-query"
            placeholder={t(
              "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.search-placeholder"
            )}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 ${NomNaTong.className} h-[54px] w-full px-5 py-2 pl-12 bg-branding-white shadow-lg rounded-[26px] justify-start items-center gap-4 inline-flex overflow-hidde`}
          />
        </div>
        {/* <Input
          type="text"
          placeholder="Search Hán Nôm or Quốc Ngữ"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`flex-1 ${NomNaTong.className}`}
        /> */}
        <Button onClick={handleSearch} className="h-12">
          {t("Button.search")}
        </Button>
      </div>
      {filtered.map((entry, index) => (
        <Entry key={index} entry={entry} refs={refs} />
      ))}
    </div>
  );
}
