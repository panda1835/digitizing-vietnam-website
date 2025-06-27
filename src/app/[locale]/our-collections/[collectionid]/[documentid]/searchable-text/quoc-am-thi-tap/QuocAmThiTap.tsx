import { getTranslations } from "next-intl/server";

import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import { Merriweather } from "next/font/google";
import TipBox from "@/components/common/TipBox";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

import { TOC } from "./TOC";

export default async function QuocAmThiTap({
  locale,
  topic,
  highlightedLine,
}: {
  locale: string;
  topic: string;
  highlightedLine?: number;
}) {
  const t = await getTranslations();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  const data = await fetch(
    `${apiUrl}/searchable-text/quoc-am-thi-tap?topicId=${topic}`
  );

  const {
    id,
    group,
    qn_title,
    title_num,
    hn_title,
    qn_body,
    hn_body,
    all_ids,
    all_groups,
    all_qn_titles,
    all_hn_titles,
    all_title_nums,
  } = await data.json();
  const groupedData = {};

  for (let i = 0; i < all_ids.length; i++) {
    const group = all_groups[i];
    const title = all_qn_titles[i];
    const id = all_ids[i];
    const num = all_title_nums[i];
    const hnTitle = all_hn_titles[i];

    if (!groupedData[group]) {
      groupedData[group] = {};
    }

    if (num == 0) {
      const key = groupedData[group][`${title}`]
        ? `${id} ${title}`
        : `${title}`;
      groupedData[group][key] = [
        {
          id,
          num,
          title,
          hnTitle,
        },
      ];
      continue;
    }

    if (num == 1) {
      groupedData[group][title] = [];
    }

    groupedData[group][all_qn_titles[id - num]].push({
      id,
      num,
      title,
      hnTitle,
    });
  }

  let hnTexts: string[] = [];
  let qnTexts: string[] = [];
  hn_body.body.lg[0].l.map((line: any) => {
    hnTexts.push(line.seg[0]?.split("|").join(""));
    hnTexts.push(line.seg[1]?.split("|").join(""));
  });
  qn_body.body.lg[0].l.map((line: any) => {
    qnTexts.push(line.seg[0]?.split("|").join(" "));
    qnTexts.push(line.seg[1]?.split("|").join(" "));
  });

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex-col w-full">
        <div className="w-full flex flex-col sm:flex-row mt-16 gap-8 pr-4">
          {/* TOC */}
          <div className="flex flex-col">
            <TOC groupedData={groupedData} currentTopic={topic} />
            <div className="mt-4">
              <TipBox text={t("Tips.lookupable-text")} />
            </div>
          </div>

          {/* Text */}
          <div className="mt-5 w-full">
            {/* Title */}
            <div className="text-3xl font-semibold flex flex-col sm:flex-row gap-2">
              <span className={`${merriweather.className}`}>{id}.</span>
              <span>
                <LookupableHanNomText text={hn_title} className="text-3xl" />
              </span>
              <span className={`${merriweather.className}`}>
                - {qn_title} {title_num != 0 ? `bài ${title_num}` : ""}
              </span>{" "}
            </div>

            {/* Han Nom */}
            <div className="w-full mt-8">
              <div className="bg-branding-gray rounded-lg p-4 mt-2 w-full">
                {hnTexts.map((line: any, index: number) => (
                  <div key={index} className="">
                    <div
                      className={`${
                        highlightedLine == index + 1 ? "bg-yellow-200" : ""
                      }`}
                    >
                      <LookupableHanNomText text={line} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quoc Ngu */}
            <div className="w-full mt-8">
              <div className="bg-branding-gray rounded-lg p-4 mt-2 w-full font-['Helvetica Neue'] font-light text-xl">
                {qnTexts.map((line: any, index: number) => (
                  <div key={index} className="">
                    <div
                      className={`${
                        highlightedLine == index + 1 ? "bg-yellow-200" : ""
                      }`}
                    >
                      {line}{" "}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
