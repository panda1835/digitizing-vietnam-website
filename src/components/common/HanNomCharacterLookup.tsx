"use client";
import { Link } from "@/i18n/routing";
import { useEffect, useState } from "react";
import localFont from "next/font/local";
import EntryTDCNDG from "@/app/[locale]/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/Entry";
import EntryGDNVHV from "@/app/[locale]/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet/Entry";
import EntryQATD from "@/app/[locale]/tools/han-nom-dictionaries/nguyen-trai-quoc-am-tu-dien/Entry";
import EntryTaberd from "@/app/[locale]/tools/han-nom-dictionaries/taberd/Entry";
import { searchDictionary } from "@/app/actions/dictionary";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Merriweather } from "next/font/google";
import { TaberdDictionaryEntry } from "@/app/[locale]/tools/han-nom-dictionaries/taberd/types";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });
const NomNaTong = localFont({
  src: "../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

type EntryData = {
  tdcndg: { defs: DictionaryEntry[]; refs: [] };
  giupdoc: GDNVHVDictionaryEntry[];
  qatd: any[];
  taberd: TaberdDictionaryEntry[];
};

const EMPTY_ENTRY_DATA: EntryData = {
  tdcndg: { defs: [], refs: [] },
  giupdoc: [],
  qatd: [],
  taberd: [],
};

/**
 * Popover-content for a single Hán-Nôm character: shows the glyph, an optional
 * reading, and its dictionary entries. Fetches on mount, so render it lazily
 * (i.e. only when a popover is open). Reuses the same server action and Entry
 * components as {@link LookupableHanNomText}.
 */
export default function HanNomCharacterLookup({
  character,
  reading,
}: {
  character: string;
  reading?: string;
}) {
  const [entryData, setEntryData] = useState<EntryData | null>(EMPTY_ENTRY_DATA);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();

  useEffect(() => {
    let active = true;
    setLoading(true);
    searchDictionary(character)
      .then((data) => {
        if (active) {
          setEntryData(data);
        }
      })
      .catch(() => {
        if (active) {
          toast.error(t("Toast.error-occurred"));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [character, t]);

  const noResults =
    entryData!.tdcndg.defs.length === 0 &&
    entryData!.giupdoc.length === 0 &&
    entryData!.qatd.length === 0 &&
    entryData!.taberd.length === 0;

  return (
    <>
      <div className={`text-center ${NomNaTong.className} text-3xl mt-2`}>
        {character}
      </div>
      {reading ? (
        <div className="text-center text-sm text-muted-foreground mt-1">
          {reading}
        </div>
      ) : null}
      <ScrollArea className="mt-4 max-w-3xl pr-4 max-h-96 h-96">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-branding-brown"></div>
          </div>
        ) : (
          <>
            {noResults && (
              <div className="text-center text-muted-foreground">
                {t("Tools.han-nom-dictionaries.no-result")}
              </div>
            )}
            {entryData!.tdcndg.defs.length > 0 && (
              <div>
                <Link
                  href={`/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai?q=${character}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div
                    className={`text-xl text-branding-brown mb-4 hover:underline ${merriweather.className}`}
                  >
                    {t(
                      "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.name"
                    )}
                  </div>
                </Link>
                {entryData!.tdcndg.defs.map((entry, idx) => (
                  <EntryTDCNDG
                    key={idx}
                    entry={entryData!.tdcndg.defs[idx]}
                    refs={entryData!.tdcndg.refs}
                  />
                ))}
              </div>
            )}
            <div className="mt-10"></div>
            {entryData!.giupdoc.length > 0 && (
              <div>
                <Link
                  href={`/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet?q=${character}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div
                    className={`text-xl text-branding-brown mb-4 hover:underline ${merriweather.className}`}
                  >
                    {t(
                      "Tools.han-nom-dictionaries.dictionaries.giup-doc-nom-va-han-viet.name"
                    )}
                  </div>
                </Link>
                <EntryGDNVHV entry={entryData!.giupdoc[0]} />
              </div>
            )}
            <div className="mt-10"></div>
            {entryData!.qatd.length > 0 && (
              <div>
                <Link
                  href={`/tools/han-nom-dictionaries/nguyen-trai-quoc-am-tu-dien?q=${character}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div
                    className={`text-xl text-branding-brown mb-4 hover:underline ${merriweather.className}`}
                  >
                    {t(
                      "Tools.han-nom-dictionaries.dictionaries.nguyen-trai-quoc-am-tu-dien.name"
                    )}
                  </div>
                </Link>
                <EntryQATD entry={entryData!.qatd[0]} />
              </div>
            )}
            <div className="mt-10"></div>
            {entryData!.taberd.length > 0 && (
              <div>
                <Link
                  href={`/tools/han-nom-dictionaries/taberd?q=${character}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div
                    className={`text-xl text-branding-brown mb-4 hover:underline ${merriweather.className}`}
                  >
                    {t("Tools.han-nom-dictionaries.dictionaries.taberd.name")}
                  </div>
                </Link>
                <EntryTaberd entry={entryData!.taberd[0]} />
              </div>
            )}
          </>
        )}
      </ScrollArea>
    </>
  );
}
