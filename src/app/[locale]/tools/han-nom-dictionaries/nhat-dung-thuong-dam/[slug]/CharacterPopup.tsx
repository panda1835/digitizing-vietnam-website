"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import localFont from "next/font/local";
import { useLocale } from "next-intl";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import FullImagePopup from "@/components/common/FullImagePopup";
import { toc } from "../toc";
import Link from "next/link";
import { NDTDDictionaryEntry } from "../types"; // Adjust the import path as necessary
const NomNaTong = localFont({
  src: "../../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

interface CharacterPopupProps {
  isOpen: boolean;
  onClose: () => void;
  character: NDTDDictionaryEntry | null;
  imageUrl: string;
}

export default function CharacterPopup({
  isOpen,
  onClose,
  character,
  imageUrl,
}: CharacterPopupProps) {
  const locale = useLocale();
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);

  if (!isOpen || !character) return null;

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the click is on the backdrop itself, not on the popup content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleImageClick = () => {
    setIsImagePopupOpen(true);
  };

  const topic = toc.find((item) => item.id === character.ma_loai);
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-end items-center mb-4">
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          <div className="flex-shrink-0">
            <Image
              src={imageUrl}
              alt={`Character ${character.han_nom}`}
              width={400}
              height={500}
              className="rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
              unoptimized
              onClick={handleImageClick}
            />
          </div>

          {/* Character Information */}
          <div className="flex-1 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 gap-4">
                <div className="text-lg">
                  <span className="font-['Helvetica Neue'] font-semibold ">
                    {locale == "en" ? "Hán-Việt reading" : "Âm Hán Việt"}:
                  </span>
                  <span className="ml-2 font-['Helvetica Neue']">
                    {character.han_viet}
                  </span>
                </div>

                <div className="text-lg">
                  <span className="font-['Helvetica Neue'] font-semibold ">
                    {locale == "en" ? "Hán text" : "Chữ Hán"}:
                  </span>
                  <span
                    className={`ml-2 font-['Helvetica Neue'] text-xl ${NomNaTong.className}`}
                  >
                    {character.han_nom}
                  </span>
                </div>

                <div className="flex gap-2 items-end text-lg">
                  <div className="font-['Helvetica Neue'] font-semibold  whitespace-nowrap">
                    {locale == "en" ? "Nôm text" : "Chữ Nôm"}:
                  </div>
                  <div className="">
                    <LookupableHanNomText
                      text={character.nom}
                      className="text-xl"
                    />
                  </div>
                </div>

                <div className="text-lg">
                  <span className="font-['Helvetica Neue'] font-semibold ">
                    {locale == "en" ? "Quốc Ngữ" : "Quốc Ngữ"}:
                  </span>
                  <span className="ml-2 font-['Helvetica Neue']">
                    {character.quoc_ngu}
                  </span>
                </div>

                {/* Temporary remove this as it's more like a personal note than official*/}
                {/* <div className="text-lg">
                  <span className="font-['Helvetica Neue'] font-semibold ">
                    {locale == "en" ? "English" : "Tiếng Anh"}:
                  </span>
                  <span className="ml-2 font-['Helvetica Neue']">
                    {character.english}
                  </span>
                </div> */}

                <div className="text-lg">
                  <span className="font-['Helvetica Neue'] font-semibold ">
                    {locale == "en" ? "Column" : "Cột"}:
                  </span>
                  <span className="ml-2 font-['Helvetica Neue']">
                    {character.cot}
                  </span>
                </div>

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
            </div>
          </div>
        </div>
      </div>

      {/* Full Image Popup */}
      <FullImagePopup
        isOpen={isImagePopupOpen}
        onClose={() => setIsImagePopupOpen(false)}
        imageUrl={imageUrl}
      />
    </div>
  );
}
