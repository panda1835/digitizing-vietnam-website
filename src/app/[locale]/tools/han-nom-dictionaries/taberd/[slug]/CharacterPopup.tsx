"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import localFont from "next/font/local";
import { useLocale } from "next-intl";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
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
  imageUrl: string[];
}

export default function CharacterPopup({
  isOpen,
  onClose,
  character,
  imageUrl,
}: CharacterPopupProps) {
  const locale = useLocale();
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

  if (!isOpen || !character) return null;

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleImageClick = (url: string) => {
    setFullImageUrl(url);
  };

  const handleCloseFullImage = () => {
    setFullImageUrl(null);
  };

  return (
    <>
      {/* Main Popup */}
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
          <div className="flex-1 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 gap-4">
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
                    {character.qn}
                  </span>
                </div>

                <div className="text-lg">
                  <span className="font-['Helvetica Neue'] font-semibold ">
                    {locale == "en" ? "Column" : "Cột"}:
                  </span>
                  <span className="ml-2 font-['Helvetica Neue']">
                    {character.cols}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between mt-4">
            {/* Image */}
            <div className="flex">
              <Image
                src={imageUrl[0]}
                alt={`Character ${character.qn}`}
                width={400}
                height={500}
                className="rounded-lg border cursor-pointer hover:opacity-80"
                unoptimized
                onClick={() => handleImageClick(imageUrl[0])}
              />
            </div>
            {imageUrl[1] && (
              <div className="flex">
                <Image
                  src={imageUrl[1]}
                  alt={`Character ${character.qn}`}
                  width={400}
                  height={500}
                  className="rounded-lg border cursor-pointer hover:opacity-80"
                  unoptimized
                  onClick={() => handleImageClick(imageUrl[1])}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-Size Image Popup */}
      {fullImageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={handleCloseFullImage}
        >
          <div className="relative">
            <Button
              onClick={handleCloseFullImage}
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 hover:bg-gray-200"
            >
              <X className="h-6 w-6 text-black" />
            </Button>
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
    </>
  );
}
