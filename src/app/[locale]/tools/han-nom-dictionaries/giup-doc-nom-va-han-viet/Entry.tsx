import { Card, CardContent } from "@/components/ui/card";

import localFont from "next/font/local";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function Entry({ entry }: { entry: GDNVHVDictionaryEntry }) {
  return (
    <div className="">
      <Card className={`${NomNaTong.className} mb-4 p-4`}>
        <CardContent>
          <div className="text-2xl font-semibold text-branding-brown">
            <span className={``}>{entry.orthography[0].orth.join(" ")}</span>
          </div>
          <div className="text-xl mt-2">
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
