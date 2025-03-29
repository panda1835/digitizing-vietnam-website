"use client";

import { useEffect, useState } from "react";
import Lookup from "./Lookup";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Merriweather } from "next/font/google";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export default function DictionaryPage(params: { locale: string }) {
  const { locale } = params;
  const [data, setData] = useState({ dictionary: [], ref: [] });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"; // Fallback to localhost during development

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(
        `/api/dictionary?dictionary=tu-dien-chu-nom-dan-giai`
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
    <div className="">
      <div className={`${merriweather.className} text-branding-black text-4xl`}>
        Tự Điển Chữ Nôm Dẫn Giải
      </div>
      <div className={`font-['Helvetica_Neue'] font-light text-base mt-6`}>
        <span>
          {locale === "en"
            ? "Nôm Characters with Quotations and Annotations"
            : "Nôm Characters with Quotations and Annotations"}
        </span>
      </div>
      <div className={`font-['Helvetica_Neue'] font-light text-base mb-6`}>
        <span>
          {locale === "en"
            ? "Prof. Nguyễn Quang Hồng"
            : "GS.TSKH Nguyễn Quang Hồng"}
        </span>
      </div>
      <Lookup entries={data.dictionary} refs={data.ref} />
    </div>
  );
}
