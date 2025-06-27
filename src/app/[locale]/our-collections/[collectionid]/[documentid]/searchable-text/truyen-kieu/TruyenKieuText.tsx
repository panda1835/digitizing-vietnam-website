import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { TruyenKieuRaw, TruyenKieuText } from "./types";
import localFont from "next/font/local";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import TipBox from "@/components/common/TipBox";
import PaginationSection from "../PaginationSection";
import PageInput from "../PageInput";

const NomNaTong = localFont({
  src: "../../../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default async function TruyenKieu({
  title,
  locale,
  documentid,
  page,
  version,
}) {
  const t = await getTranslations();
  const currentPage = Number(page) || 1;
  let textData: TruyenKieuText;
  let rawData: TruyenKieuRaw;
  let totalPages = 0;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const data = await fetch(
    `${apiUrl}/searchable-text/truyen-kieu?version=${version}&page=${currentPage}`
  );

  const { count, text, rawText } = await data.json();

  textData = text;
  rawData = rawText;
  totalPages = count;

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex-col w-full">
        {/* Content */}
        <div className="flex flex-col mt-16">
          {/* Image and Text */}
          <div className="flex flex-col md:flex-row md:justify-center space-x-4">
            {/* Image */}
            <div>
              {textData &&
                textData.$ &&
                (textData.$.pi !== "NA" ? (
                  <Image
                    unoptimized
                    // src="/page01a.jpg"
                    src={`https://backend.digitizingvietnam.com/images/iiif/2/${documentid}/${textData.$.pi}/full/full/0/default.jpg`}
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

              {textData.div[1].lg[0].l.map((line, index) => (
                <div
                  key={`line-${index}`}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center"
                >
                  <div>
                    {textData.div[0].lg[0] && (
                      <LookupableHanNomText
                        className="text-2xl"
                        text={textData.div[0].lg[0].l[index]._}
                      />
                    )}
                  </div>

                  {(() => {
                    let highlightedLine = line._;
                    if (rawData.div[1].lg[0].l[index].seg) {
                      rawData.div[1].lg[0].l[index].seg.forEach((s) => {
                        const correspondingNote = rawData.noteg[0].note.find(
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
                            <div class="z-50 absolute w-60 left-0 top-full mt-1 hidden group-hover:block bg-branding-gray text-black text-lg p-2 rounded border border-black shadow-lg">
                            ${correspondingNote ? correspondingNote._ : s._}
                            </div>
                            </span>
                            `
                        );
                      });
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
                {rawData.noteg[0].note.map((note, index) => (
                  <tr key={`note-${note.$.id}`}>
                    <td className="border border-gray-300 px-4 py-2 text-branding-brown w-32">
                      {
                        rawData.div[1].lg[0].l
                          .flatMap(
                            (l: { seg?: { $: { corresp: string } }[] }) =>
                              l.seg ?? []
                          )
                          .find((seg) => seg.$.corresp === note.$.id)?.["_"]
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
