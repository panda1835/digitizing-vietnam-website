"use client";
import localFont from "next/font/local";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Merriweather } from "next/font/google";
import EntryTDCNDG from "../tu-dien-chu-nom-dan-giai/Entry";
import EntryGDNVHV from "../giup-doc-nom-va-han-viet/Entry";
import EntryQATD from "../nguyen-trai-quoc-am-tu-dien/Entry";
import EntryTaberd from "../taberd/Entry";
import EntryNDTD from "../nhat-dung-thuong-dam/Entry";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

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

export default function Entry({
  entry,
  query,
}: {
  entry: GeneralDictionaryData;
  query: string;
}) {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <div className="space-y-8">
      {/* Tu Dien Chu Nom Dan Giai */}
      {entry.tdcndg && entry.tdcndg.defs.length > 0 && (
        <div>
          <Link
            href={`/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai?q=${query}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div
              className={`text-2xl text-branding-brown mb-4 hover:underline ${merriweather.className}`}
            >
              {t(
                "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.name"
              )}
            </div>
          </Link>
          {entry.tdcndg.defs.map((def, idx) => (
            <EntryTDCNDG key={idx} entry={def} refs={entry.tdcndg.refs} />
          ))}
        </div>
      )}

      {/* Giup Doc Nom Va Han Viet */}
      {entry.giupdoc && entry.giupdoc.length > 0 && (
        <div>
          <Link
            href={`/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet?q=${query}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div
              className={`text-2xl text-branding-brown mb-4 hover:underline ${merriweather.className}`}
            >
              {t(
                "Tools.han-nom-dictionaries.dictionaries.giup-doc-nom-va-han-viet.name"
              )}
            </div>
          </Link>
          {entry.giupdoc.map((def, idx) => (
            <EntryGDNVHV key={idx} entry={def} />
          ))}
        </div>
      )}

      {/* Nguyen Trai Quoc Am Tu Dien */}
      {entry.qatd && entry.qatd.length > 0 && (
        <div>
          <Link
            href={`/tools/han-nom-dictionaries/nguyen-trai-quoc-am-tu-dien?q=${query}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div
              className={`text-2xl text-branding-brown mb-4 hover:underline ${merriweather.className}`}
            >
              {t(
                "Tools.han-nom-dictionaries.dictionaries.nguyen-trai-quoc-am-tu-dien.name"
              )}
            </div>
          </Link>
          {entry.qatd.map((def, idx) => (
            <EntryQATD key={idx} entry={def} />
          ))}
        </div>
      )}

      {/* Taberd Dictionary */}
      {entry.taberd && entry.taberd.length > 0 && (
        <div>
          <Link
            href={`/tools/han-nom-dictionaries/taberd?q=${query}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div
              className={`text-2xl text-branding-brown mb-4 hover:underline ${merriweather.className}`}
            >
              {t("Tools.han-nom-dictionaries.dictionaries.taberd.name")}
            </div>
          </Link>
          {entry.taberd.map((def, idx) => (
            <EntryTaberd key={idx} entry={def} />
          ))}
        </div>
      )}

      {/* Nhat Dung Thuong Dam Dictionary */}
      {entry.ndtd && entry.ndtd.length > 0 && (
        <div>
          <Link
            href={`/tools/han-nom-dictionaries/nhat-dung-thuong-dam?q=${query}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div
              className={`text-2xl text-branding-brown mb-4 hover:underline ${merriweather.className}`}
            >
              {t(
                "Tools.han-nom-dictionaries.dictionaries.nhat-dung-thuong-dam.name"
              )}
            </div>
          </Link>
          {entry.ndtd.map((def, idx) => (
            <EntryNDTD key={idx} entry={def} />
          ))}
        </div>
      )}
    </div>
  );
}
