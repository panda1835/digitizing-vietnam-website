"use client";

import { useEffect, useState } from "react";
import Lookup from "./Lookup";
import LoadingSpinner from "@/components/layout/LoadingSpinner";

export default function DictionaryPage() {
  const [data, setData] = useState<{ dictionary: any[] } | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"; // Fallback to localhost during development

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(
        `/api/dictionary?dictionary=giup-doc-nom-va-han-viet`
      );
      const result = await res.json();
      setData(result);
    };

    fetchData();
  }, [baseUrl]);

  if (!data) {
    return (
      <div className="flex flex-col max-width justify-center items-center">
        <div className="mt-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="text-3xl text-center">Giúp đọc Nôm và Hán Việt</div>
      <Lookup entries={data.dictionary} />
    </div>
  );
}
