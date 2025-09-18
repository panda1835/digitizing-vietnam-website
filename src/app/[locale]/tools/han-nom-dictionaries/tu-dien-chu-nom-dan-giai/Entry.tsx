import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import localFont from "next/font/local";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function Entry({
  entry,
  refs,
}: {
  entry: DictionaryEntry;
  refs: Reference[];
}) {
  const highlightHeadword = (text: string, headword: string) => {
    if (!headword || !text) return text;

    // Try exact match first
    const exactRegex = new RegExp(`\\b(${headword})\\b`, "gi");
    let highlighted = text.replace(
      exactRegex,
      `<span class="text-branding-brown font-bold">$1</span>`
    );

    // If exact match didn't work, try individual words
    if (highlighted === text) {
      const words = headword.split(/\s+/);
      words.forEach((word) => {
        if (word.trim()) {
          // Escape special regex characters
          const escapedWord = word
            .trim()
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          // Use explicit word boundaries that work better with Vietnamese
          const wordRegex = new RegExp(
            `(^|\\s)(${escapedWord})(?=\\s|$)`,
            "giu"
          );
          highlighted = highlighted.replace(
            wordRegex,
            `$1<span class="text-branding-brown font-bold">$2</span>`
          );
        }
      });
    }

    return highlighted;
  };

  return (
    <div className="">
      <Card className={`${NomNaTong.className} mb-4 p-4 pb-0`}>
        <CardContent>
          <h3 className="text-2xl flex gap-3 font-semibold text-branding-brown mb-4">
            <LookupableHanNomText text={entry.hn} /> {entry.qn}
          </h3>
          <div className={`text-xl`}>
            {entry.derivations.sense_list[0].$.struct}
          </div>

          {entry.derivations.sense_list[0].sense.map((sense, i) => (
            <div key={i}>
              <p className="text-lg text-gray-600">
                {sense.$.type}{" "}
                {typeof sense.def[0] === "object"
                  ? sense.def[0]._.replace("__", sense.def[0].$.ref)
                  : sense.def[0]}
              </p>
              <div>
                {sense.source_list[0].citation.map((citation, j) => (
                  <div key={j} className="text-lg text-gray-600">
                    <div className="flex gap-1 mt-2">
                      {"〇"}{" "}
                      <LookupableHanNomText
                        text={citation.passage[0].source_text[0]}
                        className="text-lg"
                      />
                    </div>
                    <div className="">
                      {" "}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: highlightHeadword(
                            citation.passage[0].transliteration[0],
                            entry.qn
                          ),
                        }}
                      />
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="text-blue-500 text-base">
                            {citation.reference_list[0].reference &&
                              citation.reference_list[0].reference[0]}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xl">
                          <div>
                            {citation.reference_list[0].reference &&
                              refs
                                .filter(
                                  (r) =>
                                    r.short_title[0] ===
                                    citation.reference_list[0].reference[0].split(
                                      ","
                                    )[0]
                                )
                                .map((r, k) => (
                                  <div key={k}>
                                    <div>
                                      <span>{r.details[0].full_title[0]}</span>{" "}
                                      - <span>{r.details[0].hn_title[0]}</span>
                                    </div>
                                    <div>{r.details[0].desc[0]}</div>
                                  </div>
                                ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
