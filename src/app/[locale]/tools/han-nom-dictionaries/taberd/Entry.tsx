"use client";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { TaberdDictionaryEntry } from "./types";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import { useLocale } from "next-intl";
import { getImageUrl } from "./utils";
import { useState } from "react";
import TaberdImagePopup from "../../../../../components/common/FullImagePopup";
import localFont from "next/font/local";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function Entry({ entry }: { entry: TaberdDictionaryEntry }) {
  const locale = useLocale();
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const handleImageClick = (index: number) => {
    setSelectedImageUrl(getImageUrl(entry, 800)[index]);
  };

  return (
    <div className="">
      <Card className="mb-4">
        <CardContent>
          <div className="flex justify-between gap-4 mt-4">
            <div className="flex flex-col gap-2">
              <h3
                className={`text-2xl flex gap-3 ${NomNaTong.className} font-semibold text-branding-brown mb-4`}
              >
                <LookupableHanNomText text={entry.nom} />
                {entry.qn}
              </h3>

              <div className="text-lg">
                <span className="font-['Helvetica Neue'] font-semibold ">
                  {locale == "en" ? "Page" : "Trang"}:
                </span>
                <span className="ml-2 font-['Helvetica Neue']">
                  {entry.pages}
                </span>
              </div>

              <div className="text-lg">
                <span className="font-['Helvetica Neue'] font-semibold ">
                  {locale == "en" ? "Column" : "Cột"}:
                </span>
                <span className="ml-2 font-['Helvetica Neue']">
                  {entry.cols}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {getImageUrl(entry, 140).map((url: string, idx: number) => (
                <Image
                  key={idx}
                  unoptimized
                  src={url}
                  alt={`Image for ${entry.qn} ${idx + 1}`}
                  width={140}
                  height={0}
                  className="rounded-lg border cursor-pointer hover:opacity-80 transition-opacity w-auto h-auto max-w-[100px] max-h-[120px] md:max-w-[180px] md:max-h-[200px] object-contain"
                  onClick={() => handleImageClick(idx)}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <TaberdImagePopup
        isOpen={!!selectedImageUrl}
        onClose={() => setSelectedImageUrl(null)}
        imageUrl={selectedImageUrl || ""}
      >
        <div className="space-y-2">
          <div className="flex gap-4">
            <span className="font-semibold">
              {locale === "en" ? "Pages:" : "Trang:"}
            </span>
            <span>{entry.pages}</span>
          </div>
          <div className="flex gap-4">
            <span className="font-semibold">
              {locale === "en" ? "Columns:" : "Cột:"}
            </span>
            <span>{entry.cols}</span>
          </div>
        </div>
      </TaberdImagePopup>
    </div>
  );
}
