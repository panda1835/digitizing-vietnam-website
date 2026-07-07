import { getTranslations } from "next-intl/server";
import { Merriweather } from "next/font/google";
import Entry from "./Entry";
import DictionarySearchBar from "../DictionarySearchBar";
import SearchInstructions from "./SearchInstructions";

import { hdwd as giupdocHdwd } from "../giup-doc-nom-va-han-viet/hdwd";
import { hdwd as qatdHdwd } from "../nguyen-trai-quoc-am-tu-dien/hdwd";
import { hdwd as taberdHdwd } from "../taberd/hdwd";
import { hdwd as tdcndgHdwd } from "../tu-dien-chu-nom-dan-giai/hdwd";
// Note: ndtd (nhat-dung-thuong-dam) doesn't have hdwd file

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
  componentMatches?: string[];
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const response = await fetch(
      `${siteUrl}/api/han-nom-dictionary/all/dictionary?q=${encodeURIComponent(
        searchWord
      )}`,
      { cache: "no-store" }
    );
    data = await response.json();
  }

  const hasResults =
    data &&
    ((data.tdcndg && data.tdcndg.defs.length > 0) ||
      (data.giupdoc && data.giupdoc.length > 0) ||
      (data.qatd && data.qatd.length > 0) ||
      (data.taberd && data.taberd.length > 0) ||
      (data.ndtd && data.ndtd.length > 0) ||
      (data.componentMatches && data.componentMatches.length > 0));

  // Combine all headwords from different dictionaries for lookup
  const combinedHeadwords = Array.from(
    new Set([
      ...tdcndgHdwd,
      ...giupdocHdwd,
      ...qatdHdwd,
      ...taberdHdwd,
      // ndtd (nhat-dung-thuong-dam) doesn't have hdwd file
    ])
  ).sort();

  const searchBar = (
    <div className="flex gap-4 mb-6 items-center">
      <DictionarySearchBar
        searchWord={searchWord}
        placeholder={t(
          "Tools.han-nom-dictionaries.dictionaries.general.search-placeholder"
        )}
        hdwd_list={combinedHeadwords}
      />
    </div>
  );

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

      {hasResults && data ? (
        // Search bar rides in the results' main column (same width as the
        // results) with the sidebar beside both.
        <Entry entry={data} query={searchWord || ""} searchBar={searchBar} />
      ) : (
        <div className="mx-auto">
          {searchBar}
          {searchWord ? (
            <div className="text-center text-lg font-['Helvetica_Neue'] font-light text-branding-black">
              {t("Tools.han-nom-dictionaries.no-result")}
            </div>
          ) : null}
          {/* "How to search" is getting-started guidance, so it only appears on
              the initial / no-results page, never alongside results. */}
          <SearchInstructions />
        </div>
      )}
    </div>
  );
}
