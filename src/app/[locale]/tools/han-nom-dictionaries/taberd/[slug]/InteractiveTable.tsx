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
import CharacterPopup from "./CharacterPopup";
import localFont from "next/font/local";
import { getImageUrl } from "../utils";
import { TaberdDictionaryEntry } from "../types";
const NomNaTong = localFont({
  src: "../../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

interface InteractiveTableProps {
  data: TaberdDictionaryEntry[];
  locale: string;
}

export default function InteractiveTable({
  data,
  locale,
}: InteractiveTableProps) {
  const [selectedCharacter, setSelectedCharacter] =
    useState<TaberdDictionaryEntry | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleRowClick = (item: TaberdDictionaryEntry) => {
    // Convert Entry to TaberdDictionaryEntry format
    const characterData: TaberdDictionaryEntry = {
      id: item.id,
      nom: item.nom,
      qn: item.qn,
      pages: item.pages,
      cols: item.cols,
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
                  {item.nom}
                </span>
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
