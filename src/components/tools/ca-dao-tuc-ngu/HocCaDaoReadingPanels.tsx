"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { Merriweather } from "next/font/google";

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});

function SourceLine() {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.hoc-ca-dao");

  return (
    <p
      className="text-sm text-branding-black/70 font-light leading-relaxed"
      dangerouslySetInnerHTML={{ __html: t.raw("source_line") }}
    />
  );
}

export function ProverbsIdiomsPanel() {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.hoc-ca-dao");
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const accordionItems = [
    {
      type: "proverb",
      title: t("example_proverb_1_title"),
      desc: t("example_proverb_1_desc"),
    },
    {
      type: "proverb",
      title: t("example_proverb_2_title"),
      desc: t("example_proverb_2_desc"),
    },
    {
      type: "idiom",
      title: t("example_idiom_1_title"),
      desc: t("example_idiom_1_desc"),
    },
    {
      type: "idiom",
      title: t("example_idiom_2_title"),
      desc: t("example_idiom_2_desc"),
    },
    {
      type: "idiom",
      title: t("example_idiom_3_title"),
      desc: t("example_idiom_3_desc"),
    },
    {
      type: "idiom",
      title: t("example_idiom_4_title"),
      desc: t("example_idiom_4_desc"),
    },
  ];

  return (
    <div className="flex flex-col gap-10 animate-fadeIn">
      {/* Intro header */}
      <div className="w-full mx-auto">
        <h3 className={`${merriweather.className} text-2xl md:text-3xl text-branding-black font-normal mb-3`}>
          {t("proverbs_intro_title")}
        </h3>
        <p className="text-base text-branding-black/80 font-light leading-relaxed">
          {t("proverbs_intro_desc")}
        </p>
      </div>

      {/* Side-by-side definition cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 w-full mx-auto">
        {/* Proverb card */}
        <div className="bg-white p-8 rounded-3xl border border-branding-brown/10 shadow-sm transition-all hover:shadow-md">
          <span className="inline-block px-3 py-1 bg-amber-100/70 border border-amber-200 text-[#a5701c] text-xs font-bold uppercase tracking-wider rounded-full mb-4">
            {t("tab_proverbs_idioms").split("&")[0].trim()}
          </span>
          <h4 className={`${merriweather.className} text-xl text-branding-black font-bold mb-4`}>
            {t("proverb_def_title")}
          </h4>
          <p className="text-[15px] text-branding-black/85 font-light leading-relaxed">
            {t("proverb_def_body")}
          </p>
        </div>

        {/* Idiom card */}
        <div className="bg-white p-8 rounded-3xl border border-branding-brown/10 shadow-sm transition-all hover:shadow-md">
          <span className="inline-block px-3 py-1 bg-emerald-100/70 border border-emerald-200 text-[#4a5d36] text-xs font-bold uppercase tracking-wider rounded-full mb-4">
            {t("tab_proverbs_idioms").split("&")[1].trim()}
          </span>
          <h4 className={`${merriweather.className} text-xl text-branding-black font-bold mb-4`}>
            {t("idiom_def_title")}
          </h4>
          <p className="text-[15px] text-branding-black/85 font-light leading-relaxed">
            {t("idiom_def_body")}
          </p>
        </div>
      </div>

      {/* Interactive helper text */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium tracking-wide mt-2">
        <Info className="h-4 w-4 text-branding-brown/80" />
        <span>{t("interactive_flip_title")}</span>
      </div>

      {/* Interactive Accordion Stack */}
      <div className="bg-white border border-branding-brown/10 rounded-3xl shadow-sm divide-y divide-gray-100 overflow-hidden w-full mx-auto">
        {accordionItems.map((item, idx) => {
          const isExpanded = !!expandedItems[idx];
          const badgeColor =
            item.type === "proverb"
              ? "bg-amber-100/50 text-[#a5701c] border-amber-200/60"
              : "bg-emerald-100/50 text-[#4a5d36] border-emerald-200/60";
          const badgeLabel =
            item.type === "proverb"
              ? t("tab_proverbs_idioms").split("&")[0].trim()
              : t("tab_proverbs_idioms").split("&")[1].trim();

          return (
            <div key={idx} className="transition-colors hover:bg-gray-50/50">
              <button
                onClick={() => toggleItem(idx)}
                className="w-full flex items-center justify-between px-6 py-5 text-left transition-all focus:outline-none"
              >
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 border text-xs font-bold uppercase tracking-wider rounded-full ${badgeColor}`}>
                    {badgeLabel}
                  </span>
                  <span className={`${merriweather.className} text-base md:text-lg text-branding-black font-normal`}>
                    {item.title.split(":").slice(1).join(":").trim() || item.title}
                  </span>
                </div>
                <div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isExpanded ? "max-h-[300px] border-t border-gray-100" : "max-h-0"
                }`}
              >
                <div className="px-6 py-4 text-[15px] text-branding-black/80 font-light leading-relaxed">
                  <p>{item.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <SourceLine />
    </div>
  );
}

export function PoetrySongsPanel({ locale }: { locale: string }) {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.hoc-ca-dao");

  return (
    <div className="flex flex-col gap-12 animate-fadeIn w-full mx-auto">
      {/* Header section */}
      <div className="w-full">
        <h3 className={`${merriweather.className} text-2xl md:text-3xl text-branding-black font-normal mb-3`}>
          {t("poetry_intro_title")}
        </h3>
        <p className="text-base text-branding-black/80 font-light leading-relaxed">
          {t("poetry_intro_desc")}
        </p>
      </div>

      {/* Vocal padding / visualizer section */}
      <div className="w-full bg-white p-8 rounded-3xl border border-branding-brown/10 shadow-sm">
        <h4 className={`${merriweather.className} text-xl text-branding-black font-bold mb-3`}>
          {t("poetry_transition_title")}
        </h4>
        <p className="text-[15px] text-branding-black/80 font-light leading-relaxed mb-8">
          {t("poetry_transition_desc")}
        </p>

        {/* Song visualizers */}
        <div className="flex flex-col gap-8 w-full">
          {/* Example 1: Làm trai */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-100 pb-8">
            <div className="bg-[#f9fafb] p-6 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                {locale === "vi" ? "Bản gốc Ca dao (Văn học)" : "Original folk verse (literary)"}
              </span>
              <pre className={`${merriweather.className} text-sm md:text-base text-branding-black font-normal whitespace-pre-line leading-relaxed text-center`}>
                {`Làm trai quyết chí tu thân,
Công danh chớ vội, nợ nần chớ lo.
Khi nên, trời giúp công cho,
Làm trai năm liệu bảy lo mới hào.`}
              </pre>
            </div>
            <div className="bg-[#fffbeb] p-6 rounded-2xl border border-amber-200/85 text-center flex flex-col items-center justify-center">
              <span className="block text-xs font-semibold uppercase tracking-wider text-branding-brown/95 mb-3 font-bold">
                {locale === "vi" ? "Bản hát Dân ca (Nhạc điệu)" : "Sung folk song (melodic)"}
              </span>
              <p className="text-sm md:text-base text-branding-black/95 font-medium leading-relaxed text-center">
                Quyết chí <strong className="text-branding-brown font-bold">mà</strong> tu thân <strong className="text-branding-brown font-bold">ơ</strong>,
                <br />
                Công danh <strong className="text-branding-brown font-bold">là danh</strong> chớ vội <strong className="text-branding-brown font-bold">chứ đã</strong> nợ nần...
                <br />
                <strong className="text-branding-brown font-bold">mà</strong> không lo,
              </p>
            </div>
          </div>

          {/* Example 2: Trống cơm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#f9fafb] p-6 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                {locale === "vi" ? "Bản gốc Ca dao (Văn học)" : "Original folk verse (literary)"}
              </span>
              <pre className={`${merriweather.className} text-sm md:text-base text-branding-black font-normal whitespace-pre-line leading-relaxed text-center`}>
                {`Trống cơm khéo vỗ nên vông,
Một bầy con sếu lội sông đi tìm.
Thương ai con mắt lim dim,
Một bầy con nhện đi tìm giăng tơ.
Thương ai duyên nợ tang bồng...`}
              </pre>
            </div>
            <div className="bg-[#fffbeb] p-6 rounded-2xl border border-amber-200/85 text-center flex flex-col items-center justify-center">
              <span className="block text-xs font-semibold uppercase tracking-wider text-branding-brown/95 mb-3 font-bold">
                {locale === "vi" ? "Bản hát Dân ca (Nhạc điệu)" : "Sung folk song (melodic)"}
              </span>
              <p className="text-sm md:text-base text-branding-black/95 font-medium leading-relaxed text-center">
                <strong className="text-branding-brown font-bold">(Tình bằng)</strong> có cái trống cơm, khen ai khéo vỗ <strong className="text-branding-brown font-bold">(ấy mấy)</strong> vông nên vông <strong className="text-branding-brown font-bold">(ấy mấy)</strong> vông nên vông,
                <br />
                Một bầy <strong className="text-branding-brown font-bold">(tang tình)</strong> con sếu lội lội lội sông <strong className="text-branding-brown font-bold">(ấy mấy)</strong> đi tìm.
                <br />
                Em nhớ thương ai đôi con mắt <strong className="text-branding-brown font-bold">(ấy mấy)</strong> lim dim...
                <br />
                Một bầy <strong className="text-branding-brown font-bold">(tang tình)</strong> con nhện <strong className="text-branding-brown font-bold">(ì ới a, ấy mấy)</strong> giăng tơ, giăng tơ <strong className="text-branding-brown font-bold">(ấy mấy)</strong> đi tìm.
                <br />
                Em nhớ thương ai, duyên nợ khách tang bồng...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cultural Properties section */}
      <div className="w-full mt-4">
        <h3 className={`${merriweather.className} text-2xl md:text-3xl text-branding-black font-normal mb-6 border-b border-gray-100 pb-3`}>
          {t("properties_title")}
        </h3>

        {/* Properties stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-branding-brown/10 shadow-sm flex flex-col gap-4">
            <span className="text-4xl font-normal text-branding-brown">01</span>
            <h4 className={`${merriweather.className} text-lg text-branding-black font-bold`}>
              {t("prop_collective_title")}
            </h4>
            <p className="text-sm md:text-[15px] text-branding-black/80 font-light leading-relaxed">
              {t("prop_collective_desc")}
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-branding-brown/10 shadow-sm flex flex-col gap-4">
            <span className="text-4xl font-normal text-branding-brown">02</span>
            <h4 className={`${merriweather.className} text-lg text-branding-black font-bold`}>
              {t("prop_oral_title")}
            </h4>
            <p className="text-sm md:text-[15px] text-branding-black/80 font-light leading-relaxed">
              {t("prop_oral_desc")}
            </p>
          </div>
        </div>
      </div>

      <SourceLine />
    </div>
  );
}
