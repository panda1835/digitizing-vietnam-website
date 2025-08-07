"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CharacterPopup from "@/app/[locale]/tools/han-nom-dictionaries/nhat-dung-thuong-dam/[slug]/CharacterPopup";
import localFont from "next/font/local";
import { getImageUrl } from "../utils";
import { NDTDDictionaryEntry } from "../types";
const NomNaTong = localFont({
  src: "../../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

interface InteractiveTableProps {
  data: NDTDDictionaryEntry[];
  locale: string;
}

export default function InteractiveTable({
  data,
  locale,
}: InteractiveTableProps) {
  const [selectedCharacter, setSelectedCharacter] =
    useState<NDTDDictionaryEntry | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleRowClick = (item: NDTDDictionaryEntry) => {
    // Convert Entry to NDTDDictionaryEntry format
    const characterData: NDTDDictionaryEntry = {
      id: typeof item.id === "string" ? parseInt(item.id) : item.id,
      ma_loai: item.ma_loai ? item.ma_loai : 1,
      han_viet: item.han_viet,
      han_nom: item.han_nom,
      nom: item.nom || item.han_nom,
      quoc_ngu: item.quoc_ngu || item.han_viet,
      english: item.english || "",
      trang: item.trang || "",
      cot: item.cot || "",
    };

    setSelectedCharacter(characterData);
    setIsPopupOpen(true);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-lg font-['Helvetica Neue'] font-bold">
              #
            </TableHead>
            <TableHead className="w-[200px] text-lg font-['Helvetica Neue'] font-bold">
              {locale == "en" ? "Han Nom" : "Hán Nôm"}
            </TableHead>
            <TableHead className="text-lg font-['Helvetica Neue'] font-bold">
              {locale == "en" ? "English" : "Âm Hán Việt"}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={item.id}
              className="cursor-pointer hover:bg-branding-brown hover:text-white transition-colors duration-200"
              onClick={() => handleRowClick(item)}
            >
              <TableCell className="text-lg font-['Helvetica Neue'] font-light">
                {index + 1}.{" "}
              </TableCell>
              <TableCell className="text-lg font-['Helvetica Neue'] font-light">
                <span className={`text-xl ${NomNaTong.className}`}>
                  {item.han_nom}
                </span>
              </TableCell>
              <TableCell className="text-lg font-['Helvetica Neue'] font-light">
                {locale == "vi" ? item.han_viet : item.english}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CharacterPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        character={selectedCharacter}
        imageUrl={getImageUrl(selectedCharacter)}
      />
    </>
  );
}
