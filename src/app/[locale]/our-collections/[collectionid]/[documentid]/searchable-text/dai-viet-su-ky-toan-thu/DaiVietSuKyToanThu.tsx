import Image from "next/image";
import { getTranslations } from "next-intl/server";

import localFont from "next/font/local";
import PageInput from "../PageInput";
import PaginationSection from "../PaginationSection";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import TipBox from "@/components/common/TipBox";
import { NestedDropdownMenu } from "./TitleMenu";
import { topicIdToImage, titleToTopicId, titles } from "./utils";
import { flattenItems } from "./utils";

const NomNaTong = localFont({
  src: "../../../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default async function DaiVietSuKyToanThu({
  title,
  locale,
  documentid,
  book,
  page,
  topic,
}: {
  title: string;
  locale: string;
  documentid: string;
  book: string;
  page: string;
  topic: string;
}) {
  const t = await getTranslations();
  const currentPage = Number(page) || 1;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  // const topicTitle = titles[Number(book)].children[Number(topic) - 1].title;
  const topicTitle = flattenItems(titles[Number(book)].children)[
    Number(topic) - 1
  ].title;

  const data = await fetch(
    `${apiUrl}/searchable-text/dai-viet-su-ky-toan-thu?page=${currentPage}&book=${book}&topic=${topic}`
  );

  const { count, quocNgu, nom, phienAm, vT, image, chuThich } =
    await data.json();

  const totalPages = count;
  const phienAms = phienAm.split("@");
  const vTs = vT.split(" ");

  const processQuocNgu = (quocNgu: string) => {
    // Remove any html tags in quocNgu
    let processedQuocNgu = quocNgu.replace(/<[^>]*>/g, "").trim();
    // Replace {n} with a span that has a tooltip
    const chuThichNumbers = (processedQuocNgu.match(/\{(\d+)\}/g) || []).map(
      (m) => m.replace(/\{|\}/g, "")
    );
    if (chuThichNumbers.length > 0) {
      processedQuocNgu = processedQuocNgu.replace(/\{(\d+)\}/g, (_, number) => {
        const tooltipText = chuThich
          .filter((ct) => ct.ma_chuthich === number)
          .map((ct) => ct.chu_thich)
          .join("<br>");
        return `<span class="text-branding-brown hover:underline relative group" data-chuthich="${number}">
        ${locale === "en" ? `[Note]` : `[Chú thích]`}
        <div class="z-50 absolute w-60 left-0 top-full mt-1 hidden group-hover:block bg-branding-gray text-black text-lg p-2 rounded border border-black shadow-lg">
          ${tooltipText}
        </div>
          </span>`;
      });
    }
    return `<div>${processedQuocNgu}</div>`;
  };
  const processedQuocNgu = processQuocNgu(quocNgu);

  const imagePath = topicIdToImage(titleToTopicId(topicTitle));
  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex-col w-full">
        {/* Content */}
        <div className="flex flex-col mt-16">
          <div className="mb-10 flex gap-4 items-center">
            <NestedDropdownMenu menuData={titles[Number(book)].children} />
            <div
              className={`${NomNaTong.className} text-3xl text-branding-brown`}
            >
              {topicTitle}
            </div>
          </div>

          {/* Image and Text */}
          <div className="flex flex-col md:flex-row space-x-8">
            {/* Image */}
            <div>
              <Image
                unoptimized
                src={`https://iiif.digitizingvietnam.com/iiif/2/${imagePath}${image}.jpg/full/full/0/default.jpg`}
                alt={`${title}`}
                width={200}
                height={300}
                className="max-w-4xl w-full"
              />

              <div className="text-center text-sm mt-2">
                {t("CollectionItem.page")} {currentPage} / {totalPages} (
                {t("CollectionItem.page")} {image})
              </div>

              <div className="mt-4 ">
                <PageInput totalPages={totalPages} currentPage={currentPage} />
              </div>

              {/* Pagination */}
              <PaginationSection
                currentPage={currentPage}
                totalPages={totalPages}
              />
            </div>
            {/* Text */}
            <div>
              <div className={`text-left ${NomNaTong.className}`}>
                <div className="mb-4">
                  <TipBox text={t("Tips.lookupable-text")} />
                </div>

                {nom.split("@").map((line, index) => (
                  <div
                    key={`line-${index}`}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"
                  >
                    <div className="flex gap-2 items-start">
                      <span className="relative group text-lg text-branding-brown hover:underline">
                        {vTs[index]}
                        <div className="z-50 absolute left-0 top-full mt-1 hidden group-hover:block bg-branding-gray text-black text-base p-2 rounded border border-black shadow-lg whitespace-nowrap">
                          {vTs[index] &&
                            (locale == "en"
                              ? `Page ${vTs[index].split("*")[0]} - Column ${
                                  vTs[index].split("*")[1]
                                } - Character ${vTs[index].split("*")[2]}`
                              : `Trang ${vTs[index].split("*")[0]} - Cột ${
                                  vTs[index].split("*")[1]
                                } - Ký tự ${vTs[index].split("*")[2]}`)}
                        </div>
                      </span>

                      <LookupableHanNomText
                        text={line}
                        className="text-2xl text-left"
                      />
                    </div>

                    <div className="text-2xl">{phienAms[index]}</div>
                  </div>
                ))}
              </div>
              <div
                className={`text-2xl ${NomNaTong.className} mt-8 text-branding-brown`}
              >
                {locale == "vi" ? "Dịch Quốc Ngữ" : "Vietnamese Translation"}
              </div>
              {/* <div className={`text-2xl ${NomNaTong.className} mt-4`}>
                {processedQuocNgu}
              </div> */}
              <div
                className={`text-2xl ${NomNaTong.className} mt-4`}
                dangerouslySetInnerHTML={{ __html: processedQuocNgu }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
