import { getTranslations } from "next-intl/server";
import { toc } from "../toc";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import InteractiveTable from "./InteractiveTable";
import { Merriweather } from "next/font/google";
import { TaberdDictionaryEntry } from "../types";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export async function generateMetadata({
  params,
}: {
  params: {
    slug: string;
    locale: string;
  };
}) {
  const { slug } = params;
  const t = await getTranslations();

  if (
    !slug ||
    isNaN(Number(slug)) ||
    Number(slug) < 1 ||
    Number(slug) > toc.length
  ) {
    return {};
  }
  const tocItem = toc[Number(slug) - 1];
  return {
    title: `${tocItem.vi} | ${t(
      "Tools.han-nom-dictionaries.dictionaries.nhat-dung-thuong-dam.name"
    )} | Digitizing Việt Nam`,
    description: t(
      "Tools.han-nom-dictionaries.dictionaries.nhat-dung-thuong-dam.description"
    ),
  };
}

export default async function Page({
  params,
}: {
  params: {
    slug: string;
    locale: string;
  };
}) {
  const { slug, locale } = params;

  if (
    !slug ||
    isNaN(Number(slug)) ||
    Number(slug) < 1 ||
    Number(slug) > toc.length
  ) {
    return <div>Invalid slug</div>;
  }

  const tocItem = toc[Number(slug) - 1];

  // Server-side data fetching
  let data: TaberdDictionaryEntry[] = [];
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const entries = await fetch(
      `${apiUrl}/han-nom-dictionary/nhat-dung-thuong-dam?toc=${tocItem.id}`,
      {
        // Add cache configuration for better performance
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );
    data = await entries.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    return <div>Error loading data</div>;
  }

  return (
    <div>
      <div
        className={`${merriweather.className} flex gap-2 text-branding-black text-4xl`}
      >
        <LookupableHanNomText text={tocItem.han_nom} className="text-4xl" /> -{" "}
        {tocItem[locale]}
      </div>
      <div className="mt-10">
        <InteractiveTable data={data} locale={locale} />
      </div>
    </div>
  );
}
