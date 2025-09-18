import { Card, CardContent } from "@/components/ui/card";
import localFont from "next/font/local";
import { abbreviations } from "./abbreviations";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function EntryQATD({ entry }: { entry: any }) {
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
      const regex = new RegExp(`<abbr>${abbr.abbr}<\\/abbr>`, "g");
      processedText = processedText.replace(
        regex,
        `
          <span class="text-blue-500 relative group cursor-pointer"="${abbr.abbr}">
            ${abbr.abbr}
            <div class="z-50 text-lg absolute w-40 left-0 top-full mt-1 hidden group-hover:block bg-branding-gray text-black p-2 rounded border border-black shadow-lg">
              ${abbr.qn}
            </div>
          </span> 
        `
      );
    });

    const decimalRegex = /(\d+)\.(\d+)/g;
    processedText = processedText.replace(decimalRegex, (match, a, b) => {
      return `<a href="/our-collections/quoc-am-thi-tap/nguyen-trai-quoc-am-thi-tap?topic=${a}&line=${b}" class="text-blue-500 underline" target="_blank" rel="noopener noreferrer">${match}</a>`;
    });

    return processedText;
  };

  return (
    <div className="">
      <Card className={`${NomNaTong.className} mb-4 p-4 pb-0`}>
        <CardContent>
          <div className="text-2xl flex gap-3 font-semibold text-branding-brown mb-4">
            <span>
              {entry.han}
              <LookupableHanNomText text={entry.nom} />
            </span>
            <span className={``}>{entry.hdwd}</span>{" "}
          </div>
          <div className="text-xl flex flex-col gap-2">
            <div
              dangerouslySetInnerHTML={{ __html: processText(entry.etym) }}
            ></div>
            <div
              dangerouslySetInnerHTML={{
                __html: processText(entry.text, entry.hdwd),
              }}
            ></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
