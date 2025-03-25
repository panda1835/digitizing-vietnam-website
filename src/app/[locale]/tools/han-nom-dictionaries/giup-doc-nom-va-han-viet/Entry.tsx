import { Card, CardContent } from "@/components/ui/card";

import localFont from "next/font/local";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function Entry({ entry }: { entry: GDNVHVDictionaryEntry }) {
  return (
    <div className="">
      <Card className={`${NomNaTong.className} mb-2`}>
        <CardContent>
          <h3 className="text-2xl font-semibold">
            <span className={``}>{entry.orthography[0].orth.join(" ")}</span>
          </h3>
          <div className="text-xl">
            {entry.hdwd[0]._} ({entry.origin[0]._})
          </div>
          <div>
            <ul>
              {entry.sense_area.map((senseArea, i) => (
                <li key={i}>
                  <ul className="list-disc ml-4">
                    {senseArea.sense.map((sense, j) => (
                      <li key={j}>{sense}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
