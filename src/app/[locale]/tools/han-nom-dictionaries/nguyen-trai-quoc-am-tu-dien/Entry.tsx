import { Card, CardContent } from "@/components/ui/card";

import localFont from "next/font/local";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function Entry({ entry }: { entry: any }) {
  const processText = (text: string) => {
    let processedText = text;
    return processedText;
  };

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
          <div className="text-lg">
            <div
              dangerouslySetInnerHTML={{ __html: processEtym(entry.etym) }}
            ></div>
            <div
              dangerouslySetInnerHTML={{ __html: processText(entry.text) }}
            ></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
