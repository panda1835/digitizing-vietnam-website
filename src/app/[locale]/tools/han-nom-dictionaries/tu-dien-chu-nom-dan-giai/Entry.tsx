import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import localFont from "next/font/local";

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
  return (
    <div className="">
      <Card className={`${NomNaTong.className} mb-4 p-4 pb-0`}>
        <CardContent>
          <h3 className="text-2xl font-semibold text-branding-brown mb-4">
            <span className={``}>{entry.hn}</span> ({entry.qn})
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
                    <div className=" mt-2">
                      {"〇"} {citation.passage[0].source_text[0]}
                    </div>
                    <div className="">
                      {" "}
                      {citation.passage[0].transliteration[0]}
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="text-blue-500 text-base">
                            {citation.reference_list[0].reference[0]}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xl">
                          <div>
                            {refs
                              .filter(
                                (r) =>
                                  r.short_title[0] ===
                                  citation.reference_list[0].reference[0].split(
                                    ","
                                  )[0]
                              )
                              .map((r, k) => (
                                <div key={k}>
                                  <div>{r.details[0].full_title[0]}</div>
                                  <div>{r.details[0].hn_title[0]}</div>
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
