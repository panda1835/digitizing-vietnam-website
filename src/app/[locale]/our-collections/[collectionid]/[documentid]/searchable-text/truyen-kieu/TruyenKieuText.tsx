"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import type { TruyenKieuRaw, TruyenKieuText } from "./types";
import { useTranslations } from "next-intl";
import localFont from "next/font/local";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import TipBox from "@/components/common/TipBox";
import PaginationSection from "../PaginationSection";
import PageInput from "../PageInput";

const NomNaTong = localFont({
  src: "../../../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function TruyenKieu({ title, dataApiUrl, locale, documentid }) {
  // params: { locale: string; collectionid: string; documentid: string }
  // const { locale, collectionid } = params;
  const t = useTranslations();
  const [rawData, setRawData] = useState<TruyenKieuRaw>();
  const [textData, setTextData] = useState<TruyenKieuText>();
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${dataApiUrl}`);
        const result = await res.json();
        setTextData(result.text);
        setRawData(result.rawText);
        setTotalPages(result.text.length);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataApiUrl]);

  // Ensure page is within valid range
  const pageIndex = Math.min(Math.max(0, currentPage - 1), totalPages - 1);

  if (loading || !textData || !rawData) {
    return (
      <div className="flex flex-col max-width justify-center items-center">
        <div className="mt-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex-col mb-20 w-full">
        {/* Content */}
        <div className="flex flex-col mt-16">
          {/* Image and Text */}
          <div className="flex flex-col md:flex-row md:justify-center space-x-4">
            {/* Image */}
            <div>
              {textData[pageIndex] &&
                textData[pageIndex].$ &&
                (textData[pageIndex].$.pi !== "NA" ? (
                  <Image
                    unoptimized
                    // src="/page01a.jpg"
                    src={`https://backend.digitizingvietnam.com/images/iiif/2/${documentid}/${textData[pageIndex].$.pi}/full/full/0/default.jpg`}
                    alt={`${title}`}
                    width={200}
                    height={300}
                    className="max-w-4xl w-full"
                  />
                ) : (
                  <div className="w-full h-96 items-center justify-center flex bg-gray-200">
                    {t("CollectionItem.missing-page")}
                  </div>
                ))}
              <div className="text-center text-sm mt-2">
                {t("CollectionItem.page")} {currentPage} / {totalPages}
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
            <div className={`text-center ${NomNaTong.className}`}>
              <div className="mb-4">
                <TipBox text={t("Tips.lookupable-text")} />
              </div>

              {textData[pageIndex].div[1].lg[0].l.map((line, index) => (
                <div
                  key={`line-${index}`}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center"
                >
                  <div>
                    {textData[pageIndex].div[0].lg[0] && (
                      <LookupableHanNomText
                        className="text-2xl"
                        text={textData[pageIndex].div[0].lg[0].l[index]._}
                      />
                    )}
                  </div>

                  {(() => {
                    let highlightedLine = line._;
                    if (rawData[pageIndex].div[1].lg[0].l[index].seg) {
                      rawData[pageIndex].div[1].lg[0].l[index].seg.forEach(
                        (s) => {
                          const correspondingNote = rawData[
                            pageIndex
                          ].noteg[0].note.find(
                            (note) => note.$.id === s.$.corresp
                          );
                          highlightedLine = highlightedLine.replace(
                            new RegExp(
                              `(?<!<div[^>]*?>[^<]*)\\b${s._}\\b(?![^<]*?</div>)`,
                              "g"
                            ),
                            `<span class="text-branding-brown relative group"="${
                              s._
                            }">
                            ${s._}
                            <div class="z-50 absolute w-60 left-0 top-full mt-1 hidden group-hover:block bg-branding-gray text-black text-sm p-2 rounded border border-black shadow-lg">
                            ${correspondingNote ? correspondingNote._ : s._}
                            </div>
                            </span>
                            `
                          );
                        }
                      );
                    }
                    return (
                      <div
                        dangerouslySetInnerHTML={{ __html: highlightedLine }}
                        className="text-2xl mb-2"
                      />
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="mt-10">
            <table className="table-auto border-collapse border border-gray-300 w-full text-left">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2 w-32">
                    {locale === "vi" ? "Quốc ngữ" : "Modern Vietnamese"}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {locale === "vi" ? "Chú thích" : "Note"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rawData[pageIndex].noteg[0].note.map((note, index) => (
                  <tr key={`note-${note.$.id}`}>
                    <td className="border border-gray-300 px-4 py-2 text-branding-brown w-32">
                      {
                        rawData[pageIndex].div[1].lg[0].l
                          .flatMap(
                            (l: { seg?: { $: { corresp: string } }[] }) =>
                              l.seg ?? []
                          )
                          .find((seg) => seg.$.corresp === note.$.id)?._
                      }
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {note._}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
