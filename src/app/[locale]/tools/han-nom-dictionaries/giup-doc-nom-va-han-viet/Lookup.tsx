"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Entry from "./Entry";

import { search } from "../utils";
import localFont from "next/font/local";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function LookUp({
  entries,
}: {
  entries: GDNVHVDictionaryEntry[];
}) {
  useEffect(() => {
    const invalidEntries = entries.filter(
      (entry) => !Array.isArray(entry.hdwd)
    );
    if (invalidEntries.length > 0) {
      console.warn("Found entries with non-array 'hdwd':", invalidEntries);
    }
  }, [entries]);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [filtered, setFiltered] = useState<GDNVHVDictionaryEntry[]>([]);

  const handleSearch = () => {
    const result = search(searchKeyword, entries, "giup-doc-nom-va-han-viet");
    setFiltered(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="Search Hán Nôm or Quốc Ngữ"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`flex-1 ${NomNaTong.className}`}
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      {filtered.map((entry, index) => (
        <Entry key={index} entry={entry} />
      ))}
    </div>
  );
}
