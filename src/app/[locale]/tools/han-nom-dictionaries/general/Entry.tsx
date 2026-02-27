"use client";
import type { MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Merriweather } from "next/font/google";
import EntryTDCNDG from "../tu-dien-chu-nom-dan-giai/Entry";
import EntryGDNVHV from "../giup-doc-nom-va-han-viet/Entry";
import EntryQATD from "../nguyen-trai-quoc-am-tu-dien/Entry";
import EntryTaberd from "../taberd/Entry";
import EntryNDTD from "../nhat-dung-thuong-dam/Entry";

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

function scrollToSource(event: MouseEvent<HTMLAnchorElement>, id: string) {
  event.preventDefault();
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
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
  const sourceSections = [
    {
      id: "source-tdcndg",
      label: t(
        "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.name"
      ),
      hasResults: entry.tdcndg && entry.tdcndg.defs.length > 0,
      href: `/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai?q=${query}`,
      content: entry.tdcndg?.defs.map((def, idx) => (
        <EntryTDCNDG key={idx} entry={def} refs={entry.tdcndg.refs} />
      )),
    },
    {
      id: "source-giupdoc",
      label: t(
        "Tools.han-nom-dictionaries.dictionaries.giup-doc-nom-va-han-viet.name"
      ),
      hasResults: entry.giupdoc && entry.giupdoc.length > 0,
      href: `/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet?q=${query}`,
      content: entry.giupdoc?.map((def, idx) => (
        <EntryGDNVHV key={idx} entry={def} />
      )),
    },
    {
      id: "source-qatd",
      label: t(
        "Tools.han-nom-dictionaries.dictionaries.nguyen-trai-quoc-am-tu-dien.name"
      ),
      hasResults: entry.qatd && entry.qatd.length > 0,
      href: `/tools/han-nom-dictionaries/nguyen-trai-quoc-am-tu-dien?q=${query}`,
      content: entry.qatd?.map((def, idx) => <EntryQATD key={idx} entry={def} />),
    },
    {
      id: "source-taberd",
      label: t("Tools.han-nom-dictionaries.dictionaries.taberd.name"),
      hasResults: entry.taberd && entry.taberd.length > 0,
      href: `/tools/han-nom-dictionaries/taberd?q=${query}`,
      content: entry.taberd?.map((def, idx) => (
        <EntryTaberd key={idx} entry={def} />
      )),
    },
    {
      id: "source-ndtd",
      label: t(
        "Tools.han-nom-dictionaries.dictionaries.nhat-dung-thuong-dam.name"
      ),
      hasResults: entry.ndtd && entry.ndtd.length > 0,
      href: `/tools/han-nom-dictionaries/nhat-dung-thuong-dam?q=${query}`,
      content: entry.ndtd?.map((def, idx) => <EntryNDTD key={idx} entry={def} />),
    },
  ].filter((section) => section.hasResults);

  return (
    <div className="space-y-8">
      <div className="lg:hidden bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="text-lg font-normal text-branding-brown">
            {locale === "en" ? "Jump to source" : "Đến nguồn"}
          </div>
        </div>
        <nav className="flex flex-col">
          {sourceSections.map((section) => (
            <a
              key={`mobile-${section.id}`}
              href={`#${section.id}`}
              onClick={(event) => scrollToSource(event, section.id)}
              className="py-3 px-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 hover:border-l-branding-brown hover:border-l-4 transition-colors relative group"
            >
              <span className="text-gray-800">{section.label}</span>
            </a>
          ))}
        </nav>
      </div>

      {sourceSections.map((section) => (
        <div
          key={section.id}
          id={section.id}
          data-general-source-id={section.id}
          data-general-source-label={section.label}
          className="scroll-mt-28"
        >
          <Link href={section.href} target="_blank" rel="noopener noreferrer">
            <div
              className={`text-2xl text-branding-brown mb-4 hover:underline ${merriweather.className}`}
            >
              {section.label}
            </div>
          </Link>
          {section.content}
        </div>
      ))}
    </div>
  );
}
