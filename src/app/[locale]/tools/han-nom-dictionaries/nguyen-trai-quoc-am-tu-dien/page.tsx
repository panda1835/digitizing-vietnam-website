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
  let entries = [];
  if (searchWord) {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const result = await fetch(
      `${apiUrl}/han-nom-dictionary/nguyen-trai-quoc-am-tu-dien?q=${searchWord}`
    );
    const data = await result.json();
    entries = data || [];
  }
  return (
    <div className="">
      <div className={`${merriweather.className} text-branding-black text-4xl`}>
        {t(
          "Tools.han-nom-dictionaries.dictionaries.nguyen-trai-quoc-am-tu-dien.name"
        )}
      </div>

      <div className={`font-['Helvetica_Neue'] font-light text-base my-6`}>
        <span>
          {t(
            "Tools.han-nom-dictionaries.dictionaries.nguyen-trai-quoc-am-tu-dien.author"
          )}
        </span>
      </div>
      <div className="mx-auto">
        <div className="flex gap-4 mb-6 items-center">
          <DictionarySearchBar
            searchWord={searchWord}
            placeholder={t(
              "Tools.han-nom-dictionaries.dictionaries.nguyen-trai-quoc-am-tu-dien.search-placeholder"
            )}
          />
        </div>
      </div>
      {entries.length === 0 && searchWord ? (
        <div className="text-center text-lg font-['Helvetica_Neue'] font-light text-branding-black">
          {t("Tools.han-nom-dictionaries.no-result")}
        </div>
      ) : null}
      {entries.map((entry, index) => (
        <Entry key={index} entry={entry} />
      ))}
    </div>
  );
}
