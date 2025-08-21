"use client";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import localFont from "next/font/local";
import { NDTDDictionaryEntry } from "./types";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import { useLocale } from "next-intl";
import { getImageUrl } from "./utils";
import { useState } from "react";
import { X } from "lucide-react";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function Entry({ entry }: { entry: NDTDDictionaryEntry }) {
  const locale = useLocale();
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

  const handleImageClick = (index: number) => {
    setFullImageUrl(getImageUrl(entry, 800)[index]);
  };

  const handleCloseFullImage = () => {
    setFullImageUrl(null);
  };

  return (
    <div className="">
      <Card className="mb-4">
        <CardContent>
          <div className="flex justify-between gap-4 mt-4">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-end text-lg">
                <div className="font-['Helvetica Neue'] font-semibold  whitespace-nowrap">
                  {locale == "en" ? "Nôm text" : "Chữ Nôm"}:
                </div>
                <div className="">
                  <LookupableHanNomText text={entry.nom!} className="text-xl" />
                </div>
              </div>

              <div className="text-lg">
                <span className="font-['Helvetica Neue'] font-semibold ">
                  {locale == "en" ? "Quốc Ngữ" : "Quốc Ngữ"}:
                </span>
                <span className="ml-2 font-['Helvetica Neue']">{entry.qn}</span>
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

      {/* Full-Size Image Popup */}
      {fullImageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={handleCloseFullImage}
        >
          <div className="relative">
            <button
              onClick={handleCloseFullImage}
              className="absolute top-2 right-2 z-10 bg-gray-200 rounded-lg p-2 hover:bg-gray-300"
            >
              <X className="h-6 w-6 text-black" />
            </button>
            <Image
              src={fullImageUrl}
              alt="Full-size image"
              width={800}
              height={1000}
              className="rounded-lg border h-screen w-full"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
