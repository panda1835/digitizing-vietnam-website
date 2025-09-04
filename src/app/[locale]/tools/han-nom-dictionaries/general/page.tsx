import { getTranslations } from "next-intl/server";
import { Merriweather } from "next/font/google";
import Entry from "./Entry";
import DictionarySearchBar from "../DictionarySearchBar";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

interface GeneralDictionaryData {
  tdcndg: {
    defs: DictionaryEntry[];
    refs: [];
  };
  giupdoc: GDNVHVDictionaryEntry[];
  qatd: any[];
  taberd: any[];
  ndtd: any[];
}

export default async function DictionaryPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string | undefined }>;
}) {
  const t = await getTranslations();
  const searchWord = (await searchParams).q;
  let data: GeneralDictionaryData | null = null;
  if (searchWord) {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const response = await fetch(
      `${apiUrl}/han-nom-dictionary/all/dictionary?q=${searchWord}`
    );
    data = await response.json();
  }

  const hasResults =
    data &&
    ((data.tdcndg && data.tdcndg.defs.length > 0) ||
      (data.giupdoc && data.giupdoc.length > 0) ||
      (data.qatd && data.qatd.length > 0) ||
      (data.taberd && data.taberd.length > 0) ||
      (data.ndtd && data.ndtd.length > 0));
  return (
    <div className="">
      <div className={`${merriweather.className} text-branding-black text-4xl`}>
        {t("Tools.han-nom-dictionaries.dictionaries.general.name")}
      </div>

      <div className={`font-['Helvetica_Neue'] font-light text-base my-6`}>
        <span>
          {t("Tools.han-nom-dictionaries.dictionaries.general.author")}
        </span>
      </div>
      <div className="mx-auto">
        <div className="flex gap-4 mb-6 items-center">
          <DictionarySearchBar
            searchWord={searchWord}
            placeholder={t(
              "Tools.han-nom-dictionaries.dictionaries.general.search-placeholder"
            )}
          />
        </div>
      </div>
      {!hasResults && searchWord ? (
        <div className="text-center text-lg font-['Helvetica_Neue'] font-light text-branding-black">
          {t("Tools.han-nom-dictionaries.no-result")}
        </div>
      ) : null}
      {hasResults && data && <Entry entry={data} query={searchWord || ""} />}
    </div>
  );
}
