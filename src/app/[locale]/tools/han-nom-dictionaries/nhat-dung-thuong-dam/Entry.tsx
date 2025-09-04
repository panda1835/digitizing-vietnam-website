"use client";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import localFont from "next/font/local";
import { NDTDDictionaryEntry } from "./types";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import { useLocale } from "next-intl";
import Link from "next/link";
import { toc } from "./toc";
import { getImageUrl } from "./utils";
import { useState } from "react";
import CharacterPopup from "./[slug]/CharacterPopup";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function Entry({ entry }: { entry: NDTDDictionaryEntry }) {
  const locale = useLocale();
  const topic = toc.find((item) => item.id === entry.ma_loai);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleImageClick = () => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  return (
    <div className="">
      <Card className="mb-4">
        <CardContent>
          <div className="flex justify-between gap-4 mt-4">
            <div className="flex flex-col gap-2">
              <div className="text-lg">
                <span className="font-['Helvetica Neue'] font-semibold ">
                  {locale == "en" ? "Hán-Việt reading" : "Âm Hán Việt"}:
                </span>
                <span className="ml-2 font-['Helvetica Neue']">
                  {entry.han_viet}
                </span>
              </div>

              <div className="text-lg">
                <span className="font-['Helvetica Neue'] font-semibold ">
                  {locale == "en" ? "Hán text" : "Chữ Hán"}:
                </span>
                <span
                  className={`ml-2 font-['Helvetica Neue'] text-xl ${NomNaTong.className}`}
                >
                  {entry.han_nom}
                </span>
              </div>

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
                <span className="ml-2 font-['Helvetica Neue']">
                  {entry.quoc_ngu}
                </span>
              </div>

              {/* <div className="text-lg">
                <span className="font-['Helvetica Neue'] font-semibold ">
                  {locale == "en" ? "English" : "Tiếng Anh"}:
                </span>
                <span className="ml-2 font-['Helvetica Neue']">
                  {entry.english}
                </span>
              </div> */}
              <div className="text-lg">
                <span className="font-['Helvetica Neue'] font-semibold ">
                  {locale == "en" ? "Book section" : "Mục sách"}:
                </span>
                <span className="ml-2 font-['Helvetica Neue']">
                  <Link
                    href={`/tools/han-nom-dictionaries/nhat-dung-thuong-dam/${topic?.id}`}
                    className="text-branding-brown hover:underline"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {topic![locale]}
                  </Link>
                </span>
              </div>
            </div>
            <Image
              unoptimized
              src={getImageUrl(entry, 140)}
              alt={`Image for ${entry.han_nom}`}
              width={140}
              height={0}
              className="rounded-lg border cursor-pointer hover:opacity-80 transition-opacity w-auto h-auto max-w-[100px] max-h-[120px] md:max-w-[180px] md:max-h-[200px] object-contain"
              onClick={handleImageClick}
            />
          </div>
        </CardContent>
      </Card>

      <CharacterPopup
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        character={entry}
        imageUrl={getImageUrl(entry, 800)}
      />
    </div>
  );
}
