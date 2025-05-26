import { getTranslations } from "next-intl/server";

import NavLink from "./NavLink";
import { ScrollArea } from "@/components/ui/scroll-area";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import { Merriweather } from "next/font/google";
import TipBox from "@/components/common/TipBox";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export default async function TinhHoaMuaXuan({
  locale,
  topic,
}: {
  locale: string;
  topic: string;
}) {
  const t = await getTranslations();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const data = await fetch(
    `${apiUrl}/searchable-text/tinh-hoa-mua-xuan?topic=${topic}`
  );

  const {
    nom_topic,
    qn_topic,
    en_topic,
    nom,
    qn,
    en,
    note_en,
    note_vi,
    all_nom_topic,
    all_qn_topic,
    all_en_topic,
  } = await data.json();

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex-col w-full">
        <div className="w-full flex flex-col sm:flex-row mt-16 gap-8">
          {/* TOC */}
          <aside className="w-full lg:w-96 shrink-0 font-light font-['Helvetica Neue']">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-branding-brown uppercase flex justify-center">
                <div className="text-xl font-normal text-white">
                  {locale === "vi" ? "Tinh hoa Mùa xuân" : "Spring Essence"}
                </div>
              </div>
              <ScrollArea className="h-[500px] md:h-[600px] w-full">
                <div className="flex flex-col">
                  {all_qn_topic.map((item: string, index: number) => (
                    <NavLink key={index} topic={item} currentTopic={topic}>
                      <div className="text-lg">
                        {locale === "vi" ? item : all_en_topic[index]}
                      </div>
                      <LookupableHanNomText
                        text={all_nom_topic[index]}
                        className="text-lg"
                      />
                    </NavLink>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="mt-4">
              <TipBox text={t("Tips.lookupable-text")} />
            </div>
          </aside>

          {/* Text */}
          <div className="mt-5 w-full">
            {/* Title */}
            <div className="text-3xl font-semibold flex flex-col sm:flex-row gap-2">
              <span className={`${merriweather.className}`}>
                {locale === "vi" ? qn_topic : en_topic} -
              </span>{" "}
              <span>
                <LookupableHanNomText text={nom_topic} className="text-3xl" />
              </span>
            </div>

            {/* Han Nom */}
            <div className="w-full mt-8">
              {/* Title */}
              <div>
                <LookupableHanNomText
                  text={nom_topic}
                  className="text-branding-brown"
                />
              </div>
              {/* Text */}
              <div className="bg-branding-gray rounded-lg p-4 mt-2 w-full">
                {nom.split("#").map((line, index) => (
                  <div key={index}>
                    <LookupableHanNomText text={line} />
                  </div>
                ))}
              </div>
            </div>

            {/* Quoc Ngu */}
            <div className="w-full mt-8">
              {/* Title */}
              <div
                className={`${merriweather.className} text-2xl text-branding-brown`}
              >
                {qn_topic}
              </div>
              {/* Text */}
              <div className="bg-branding-gray rounded-lg p-4 mt-2 w-full font-['Helvetica Neue'] font-light text-xl">
                {qn.split("#").map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            </div>
            {/* English */}
            <div className="w-full mt-8">
              {/* Title */}
              <div
                className={`${merriweather.className} text-2xl text-branding-brown`}
              >
                {en_topic}
              </div>
              {/* Text */}
              <div className="bg-branding-gray rounded-lg p-4 mt-2 w-full font-['Helvetica Neue'] font-light text-xl">
                {en.split("#").map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            </div>
            {/* Note */}
            <div className="w-full mt-8">
              {/* Title */}
              <div
                className={`${merriweather.className} text-2xl text-branding-brown`}
              >
                {locale === "vi" ? "Chú thích" : "Note"}
              </div>
              {/* Text */}
              <div className=" mt-2 w-full font-['Helvetica Neue'] font-light text-xl">
                {locale === "vi" ? note_vi : note_en}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
