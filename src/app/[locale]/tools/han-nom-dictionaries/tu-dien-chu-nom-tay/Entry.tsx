import { Card, CardContent } from "@/components/ui/card";
import localFont from "next/font/local";
import { abbreviations } from "./abbreviations";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function EntryTDCNT({ entry }: { entry: any }) {
  const formatCitations = (citations: any) => {
    if (!citations || !citations.citations || !citations.citations.citation)
      return "";

    return citations.citations.citation
      .map((citation: any, index: number) => {
        let formattedCitation = "";

        // Source text (Nom characters)
        if (citation.source_text && citation.source_text[0]?.lg?.[0]?.l?.[0]) {
          formattedCitation += citation.source_text[0].lg[0].l[0];
        }

        // Transliteration in parentheses
        if (
          citation.transliteration &&
          citation.transliteration[0]?.lg?.[0]?.l?.[0]
        ) {
          let translit = citation.transliteration[0].lg[0].l[0];
          // Highlight the headword if present
          if (entry.tay) {
            const headwordRegex = new RegExp(`\\b(${entry.tay})\\b`, "gi");
            translit = translit.replace(
              headwordRegex,
              `<span class="text-branding-brown font-bold">$1</span>`
            );
          }
          formattedCitation += `<br/>${translit}`;
        }

        // Reference in parentheses
        if (citation.reference && citation.reference[0]) {
          const ref = citation.reference[0];
          const abbrObj = abbreviations.find((abbr) => abbr.abbr === ref);
          const hoverText = abbrObj ? abbrObj.full : ref;
          formattedCitation += `
            <br/>(<span class="text-blue-500 relative group cursor-pointer">
              ${ref}
              <div class="z-50 text-lg absolute w-40 left-0 top-full mt-1 hidden group-hover:block bg-branding-gray text-black p-2 rounded border border-black shadow-lg">
              ${hoverText}
              </div>
            </span>)
            `;
        }

        // Translation on new line
        if (citation.translation && citation.translation[0]?._) {
          const translation = citation.translation[0]._.trim();
          if (translation) {
            formattedCitation += `<br/><span class="text-gray-700">${translation}</span>`;
          }
        }

        return formattedCitation;
      })
      .join("<br/><br/>");
  };

  const processText = (text: string, hdwd?: string) => {
    let processedText = text;

    if (hdwd) {
      const quoteRegex = new RegExp(
        `(<(?:quote|hi)>[^<]*?)(${hdwd})([^<]*?</(?:quote|hi)>)`,
        "g"
      );
      processedText = processedText.replaceAll(
        quoteRegex,
        `$1<span class="text-branding-brown font-bold">$2</span>$3`
      );
    }

    processedText = processedText
      .replaceAll("<sense_area", "<div")
      .replaceAll("</sense_area", "</div")
      .replaceAll("<sense", "<div")
      .replaceAll("</sense", "</div")
      // .replaceAll("</cit>‖", "</cit>")
      .replaceAll("<cit", "<span")
      .replaceAll("</cit", "</span")
      .replaceAll("<quote>", "<span class='italic'>")
      .replaceAll("</quote>", "</span>")
      .replaceAll("<bibl>", " <span>(")
      .replaceAll("</bibl>", ")</span>")
      // .replaceAll("‖", ", ")
      .replaceAll("<hi>", "<span class='italic'>")
      .replaceAll("</hi>", "</span>")
      .replaceAll("<etym>", "<div>◎ ")
      .replaceAll("</etym>", "</div>");

    abbreviations.forEach((abbr) => {
      const regex = new RegExp(
        `(?:<abbr>|<reference>)${abbr.abbr}(?:<\\/abbr>|<\\/reference>)`,
        "g"
      );
      processedText = processedText.replace(
        regex,
        `
          <span class="text-blue-500 relative group cursor-pointer"="${abbr.abbr}">
            ${abbr.abbr}
            <div class="z-50 text-lg absolute w-40 left-0 top-full mt-1 hidden group-hover:block bg-branding-gray text-black p-2 rounded border border-black shadow-lg">
              ${abbr.full}
            </div>
          </span> 
        `
      );
    });

    return processedText;
  };

  return (
    <div className="">
      <Card className={`${NomNaTong.className} mb-4 p-4 pb-0`}>
        <CardContent>
          <div className="flex gap-3 text-2xl font-semibold text-branding-brown mb-4">
            <LookupableHanNomText text={entry.nom} /> {entry.tay}
          </div>
          <div className="text-xl flex flex-col gap-2">
            <div
              dangerouslySetInnerHTML={{
                __html: processText(entry.sense, entry.tay),
              }}
            ></div>
            {entry.citations && (
              <div
                dangerouslySetInnerHTML={{
                  __html: formatCitations(entry.citations),
                }}
              ></div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
