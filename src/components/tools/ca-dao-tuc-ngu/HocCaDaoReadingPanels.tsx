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
      className="text-sm text-branding-black/70 font-normal leading-relaxed"
      dangerouslySetInnerHTML={{ __html: t.raw("source_line") }}
    />
  );
}

export function ProverbsIdiomsPanel() {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.hoc-ca-dao");
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {}
  );

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
    <div className="flex flex-col gap-8">
      {/* Intro header */}
      <div className="w-full mx-auto">
        <h3
          className={`${merriweather.className} text-2xl md:text-3xl text-branding-black font-normal mb-3`}
        >
          {t("proverbs_intro_title")}
        </h3>
        <p className="max-w-[75ch] text-base text-branding-black/75 font-normal leading-relaxed">
          {t("proverbs_intro_desc")}
        </p>
      </div>

      {/* Side-by-side definition cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 w-full mx-auto">
        {/* Proverb card */}
        <div className="bg-white p-5 sm:p-8 rounded-xl border border-branding-black/10">
          <h4
            className={`${merriweather.className} text-xl text-branding-black font-normal mb-4`}
          >
            {t("proverb_def_title")}
          </h4>
          <p className="text-[15px] text-branding-black/85 font-normal leading-relaxed">
            {t("proverb_def_body")}
          </p>
        </div>

        {/* Idiom card */}
        <div className="bg-white p-5 sm:p-8 rounded-xl border border-branding-black/10">
          <h4
            className={`${merriweather.className} text-xl text-branding-black font-normal mb-4`}
          >
            {t("idiom_def_title")}
          </h4>
          <p className="text-[15px] text-branding-black/85 font-normal leading-relaxed">
            {t("idiom_def_body")}
          </p>
        </div>
      </div>

      {/* Interactive helper text */}
      <div className="flex items-center justify-center gap-2 text-sm text-branding-black/65 mt-2">
        <Info className="h-4 w-4 text-branding-brown/80" />
        <span>{t("interactive_flip_title")}</span>
      </div>

      {/* Interactive Accordion Stack */}
      <div className="bg-white border border-branding-black/10 rounded-xl divide-y divide-branding-black/10 overflow-hidden w-full mx-auto">
        {accordionItems.map((item, idx) => {
          const isExpanded = !!expandedItems[idx];
          const badgeLabel =
            item.type === "proverb"
              ? t("tab_proverbs_idioms").split("&")[0].trim()
              : t("tab_proverbs_idioms").split("&")[1].trim();

          return (
            <div
              key={idx}
              className="transition-colors hover:bg-branding-gray/40"
            >
              <button
                aria-expanded={isExpanded}
                aria-controls={`proverb-example-${idx}`}
                onClick={() => toggleItem(idx)}
                className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left transition-colors"
              >
                <div className="flex flex-col items-start sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="shrink-0 rounded-md bg-branding-brown/10 px-2.5 py-1 text-xs font-medium text-[#956319]">
                    {badgeLabel}
                  </span>
                  <span
                    className={`${merriweather.className} text-base md:text-lg text-branding-black font-normal`}
                  >
                    {item.title.split(":").slice(1).join(":").trim() ||
                      item.title}
                  </span>
                </div>
                <div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-branding-black/60 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-branding-black/60 shrink-0" />
                  )}
                </div>
              </button>

              <div
                id={`proverb-example-${idx}`}
                hidden={!isExpanded}
                className="border-t border-branding-black/10"
              >
                <div className="px-6 py-4 text-[15px] text-branding-black/80 font-normal leading-relaxed">
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
    <div className="flex flex-col gap-8 w-full mx-auto">
      {/* Header section */}
      <div className="w-full">
        <h3
          className={`${merriweather.className} text-2xl md:text-3xl text-branding-black font-normal mb-3`}
        >
          {t("poetry_intro_title")}
        </h3>
        <p className="max-w-[75ch] text-base text-branding-black/75 font-normal leading-relaxed">
          {t("poetry_intro_desc")}
        </p>
      </div>

      {/* Vocal padding / visualizer section */}
      <div className="w-full bg-white p-5 sm:p-8 rounded-xl border border-branding-black/10">
        <h4
          className={`${merriweather.className} text-xl text-branding-black font-normal mb-3`}
        >
          {t("poetry_transition_title")}
        </h4>
        <p className="text-[15px] text-branding-black/80 font-normal leading-relaxed mb-8">
          {t("poetry_transition_desc")}
        </p>

        {/* Song visualizers */}
        <div className="flex flex-col gap-8 w-full">
          {/* Example 1: Làm trai */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-branding-black/10 pb-8">
            <div className="bg-branding-gray/60 p-5 sm:p-6 rounded-xl text-center flex flex-col items-center justify-center">
              <span className="block text-sm font-medium text-branding-black/65 mb-3">
                {locale === "vi"
                  ? "Bản gốc Ca dao (Văn học)"
                  : "Original folk verse (literary)"}
              </span>
              <pre
                className={`${merriweather.className} text-sm md:text-base text-branding-black font-normal whitespace-pre-line leading-relaxed text-center`}
              >
                {`Làm trai quyết chí tu thân,
Công danh chớ vội, nợ nần chớ lo.
Khi nên, trời giúp công cho,
Làm trai năm liệu bảy lo mới hào.`}
              </pre>
            </div>
            <div className="bg-branding-brown/5 p-5 sm:p-6 rounded-xl text-center flex flex-col items-center justify-center">
              <span className="block text-sm font-medium text-[#956319] mb-3">
                {locale === "vi"
                  ? "Bản hát Dân ca (Nhạc điệu)"
                  : "Sung folk song (melodic)"}
              </span>
              <p className="text-sm md:text-base text-branding-black/95 font-medium leading-relaxed text-center">
                Quyết chí{" "}
                <strong className="text-[#956319] font-bold">mà</strong> tu thân{" "}
                <strong className="text-[#956319] font-bold">ơ</strong>,
                <br />
                Công danh{" "}
                <strong className="text-[#956319] font-bold">
                  là danh
                </strong>{" "}
                chớ vội{" "}
                <strong className="text-[#956319] font-bold">chứ đã</strong> nợ
                nần...
                <br />
                <strong className="text-[#956319] font-bold">mà</strong> không
                lo,
              </p>
            </div>
          </div>

          {/* Example 2: Trống cơm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-branding-gray/60 p-5 sm:p-6 rounded-xl text-center flex flex-col items-center justify-center">
              <span className="block text-sm font-medium text-branding-black/65 mb-3">
                {locale === "vi"
                  ? "Bản gốc Ca dao (Văn học)"
                  : "Original folk verse (literary)"}
              </span>
              <pre
                className={`${merriweather.className} text-sm md:text-base text-branding-black font-normal whitespace-pre-line leading-relaxed text-center`}
              >
                {`Trống cơm khéo vỗ nên vông,
Một bầy con sếu lội sông đi tìm.
Thương ai con mắt lim dim,
Một bầy con nhện đi tìm giăng tơ.
Thương ai duyên nợ tang bồng...`}
              </pre>
            </div>
            <div className="bg-branding-brown/5 p-5 sm:p-6 rounded-xl text-center flex flex-col items-center justify-center">
              <span className="block text-sm font-medium text-[#956319] mb-3">
                {locale === "vi"
                  ? "Bản hát Dân ca (Nhạc điệu)"
                  : "Sung folk song (melodic)"}
              </span>
              <p className="text-sm md:text-base text-branding-black/95 font-medium leading-relaxed text-center">
                <strong className="text-[#956319] font-bold">
                  (Tình bằng)
                </strong>{" "}
                có cái trống cơm, khen ai khéo vỗ{" "}
                <strong className="text-[#956319] font-bold">(ấy mấy)</strong>{" "}
                vông nên vông{" "}
                <strong className="text-[#956319] font-bold">(ấy mấy)</strong>{" "}
                vông nên vông,
                <br />
                Một bầy{" "}
                <strong className="text-[#956319] font-bold">
                  (tang tình)
                </strong>{" "}
                con sếu lội lội lội sông{" "}
                <strong className="text-[#956319] font-bold">(ấy mấy)</strong>{" "}
                đi tìm.
                <br />
                Em nhớ thương ai đôi con mắt{" "}
                <strong className="text-[#956319] font-bold">
                  (ấy mấy)
                </strong>{" "}
                lim dim...
                <br />
                Một bầy{" "}
                <strong className="text-[#956319] font-bold">
                  (tang tình)
                </strong>{" "}
                con nhện{" "}
                <strong className="text-[#956319] font-bold">
                  (ì ới a, ấy mấy)
                </strong>{" "}
                giăng tơ, giăng tơ{" "}
                <strong className="text-[#956319] font-bold">(ấy mấy)</strong>{" "}
                đi tìm.
                <br />
                Em nhớ thương ai, duyên nợ khách tang bồng...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cultural Properties section */}
      <div className="w-full mt-4">
        <h3
          className={`${merriweather.className} text-2xl md:text-3xl text-branding-black font-normal mb-6 border-b border-branding-black/10 pb-3`}
        >
          {t("properties_title")}
        </h3>

        {/* Properties stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 sm:p-8 rounded-xl border border-branding-black/10 flex flex-col gap-4">
            <h4
              className={`${merriweather.className} text-lg text-branding-black font-normal`}
            >
              {t("prop_collective_title")}
            </h4>
            <p className="text-sm md:text-[15px] text-branding-black/80 font-normal leading-relaxed">
              {t("prop_collective_desc")}
            </p>
          </div>

          <div className="bg-white p-5 sm:p-8 rounded-xl border border-branding-black/10 flex flex-col gap-4">
            <h4
              className={`${merriweather.className} text-lg text-branding-black font-normal`}
            >
              {t("prop_oral_title")}
            </h4>
            <p className="text-sm md:text-[15px] text-branding-black/80 font-normal leading-relaxed">
              {t("prop_oral_desc")}
            </p>
          </div>
        </div>
      </div>

      <SourceLine />
    </div>
  );
}
