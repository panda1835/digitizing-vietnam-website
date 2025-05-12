import { Card, CardContent } from "@/components/ui/card";

import localFont from "next/font/local";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function Entry({ entry }: { entry: GDNVHVDictionaryEntry }) {
  return (
    <div className="">
      <Card className={`${NomNaTong.className} mb-4 p-4 pb-0`}>
        <CardContent>
          <div className="text-2xl font-semibold text-branding-brown">
            <span className={``}>{entry.uni}</span>
          </div>
          <div className="text-xl mt-2">
            {entry.qn} ({entry.pinyin.origin._})
          </div>
          <div>
            <ul>
              {entry.text.sense_area.sense.map((sense, i) => (
                <li key={i}>
                  {sense._ ? (
                    <div>
                      {sense._}{" "}
                      <span className="italic">{sense.cit.join(", ")}</span>
                    </div>
                  ) : (
                    sense
                  )}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
