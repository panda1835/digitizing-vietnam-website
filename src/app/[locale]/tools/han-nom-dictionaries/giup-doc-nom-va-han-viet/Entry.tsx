import { Card, CardContent } from "@/components/ui/card";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import localFont from "next/font/local";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function Entry({ entry }: { entry: GDNVHVDictionaryEntry }) {
  return (
    <div className="">
      <Card className={`${NomNaTong.className} mb-4 p-4 pb-0`}>
        <CardContent>
          <div className="text-2xl flex gap-3 font-semibold text-branding-brown mb-4">
            <LookupableHanNomText text={entry.uni} />
            <span>
              {entry.qn} ({entry.pinyin.origin._})
            </span>
          </div>
          <div className="text-lg">
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
