import { getTranslations } from "next-intl/server";
import { Merriweather } from "next/font/google";
import Entry from "./Entry";
import DictionarySearchBar from "../DictionarySearchBar";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export default async function DictionaryPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string | undefined }>;
}) {
  const t = await getTranslations();
  const searchWord = (await searchParams).q;
  let data = { defs: [], refs: [] };
  if (searchWord) {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const entries = await fetch(
      `${apiUrl}/han-nom-dictionary/tu-dien-chu-nom-dan-giai?q=${searchWord}`
    );
    data = await entries.json();
  }

  return (
    <div className="">
      <div className={`${merriweather.className} text-branding-black text-4xl`}>
        {t(
          "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.name"
        )}
      </div>

      <div className={`font-['Helvetica_Neue'] font-light text-base my-6`}>
        <span>
          {t(
            "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.author"
          )}
        </span>
      </div>

      <div className="mx-auto">
        <div className="flex gap-4 mb-6 items-center">
          <DictionarySearchBar
            searchWord={searchWord}
            placeholder={t(
              "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.search-placeholder"
            )}
          />
        </div>
      </div>
      {data.defs.length === 0 && searchWord ? (
        <div className="text-center text-lg font-['Helvetica_Neue'] font-light text-branding-black">
          {t("Tools.han-nom-dictionaries.no-result")}
        </div>
      ) : null}
      {data.defs.map((entry, index) => (
        <Entry key={index} entry={entry} refs={data.refs} />
      ))}
    </div>
  );
}
