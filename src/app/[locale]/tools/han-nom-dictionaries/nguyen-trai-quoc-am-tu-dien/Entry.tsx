import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import localFont from "next/font/local";
import { abbreviations } from "./abbreviations";
const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function Entry({ entry }: { entry: any }) {
  const processText = (text: string, hdwd: string) => {
    let processedText = text;
    processedText = processedText
      .replaceAll("<sense_area", "<div")
      .replaceAll("</sense_area", "</div")
      .replaceAll("<sense", "<div")
      .replaceAll("</sense", "</div")
      .replaceAll("</cit>‖", "</cit>")
      .replaceAll("<cit", "<div")
      .replaceAll("</cit", "</div")
      .replaceAll("<quote>", "<span class='italic'>")
      .replaceAll("</quote>", "</span>")
      .replaceAll("<bibl>", " <span>(")
      .replaceAll("</bibl>", ")</span>")
      .replaceAll("‖", ", ");

    abbreviations.forEach((abbr) => {
      const regex = new RegExp(`<abbr>${abbr.abbr}<\\/abbr>`, "g");
      processedText = processedText.replace(
        regex,
        // `<span class="hover-component" title="${abbr.qn}">${abbr.abbr}</span>`
        `
          <span class="text-branding-brown relative group"="${abbr.abbr}">
            ${abbr.abbr}
            <div class="z-50 absolute w-40 left-0 top-full mt-1 hidden group-hover:block bg-branding-gray text-black text-sm p-2 rounded border border-black shadow-lg">
              ${abbr.qn}
            </div>
          </span>
        `
      );
    });

    const decimalRegex = /(\d+)\.(\d+)/g;
    processedText = processedText.replace(decimalRegex, (match, a) => {
      return `<a href="/our-collections/quoc-am-thi-tap/nguyen-trai-quoc-am-thi-tap?topic=${a}" class="text-blue-500 underline" target="_blank" rel="noopener noreferrer">${match}</a>`;
    });

    processedText = processedText.replace(
      hdwd,
      `<span class="text-branding-brown font-bold">${hdwd}</span>`
    );
    return processedText;
  };
  console.log("hello", processText(entry.text, entry.hdwd));

  const processEtym = (etym: string) => {
    let processedEtym = etym;
    return processedEtym;
  };
  return (
    <div className="">
      <Card className={`${NomNaTong.className} mb-4 p-4 pb-0`}>
        <CardContent>
          <div className="text-2xl font-semibold text-branding-brown mb-4">
            <span className={``}>{entry.hdwd}</span>{" "}
            <span>
              ({entry.han}
              {entry.nom})
            </span>
          </div>
          <div className="text-lg flex flex-col gap-2">
            <div
              dangerouslySetInnerHTML={{ __html: processEtym(entry.etym) }}
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
