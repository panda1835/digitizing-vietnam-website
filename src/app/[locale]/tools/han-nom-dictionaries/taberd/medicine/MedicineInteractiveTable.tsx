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
import TaberdImagePopup from "@/components/common/FullImagePopup";
import { getImageUrl } from "../utils";
import localFont from "next/font/local";

const NomNaTong = localFont({
  src: "../../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

interface MedicineItem {
  id: number;
  han_nom: string;
  quoc_ngu: string;
  trang: number;
  ma_tu: number;
}

interface MedicineInteractiveTableProps {
  data: MedicineItem[];
  locale: string;
}

export default function MedicineInteractiveTable({
  data,
  locale,
}: MedicineInteractiveTableProps) {
  const [selectedItem, setSelectedItem] = useState<MedicineItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleRowClick = (item: MedicineItem) => {
    setSelectedItem(item);
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
              {locale === "en" ? "Han-Nom text" : "Chữ Hán-Nôm"}
            </TableHead>
            <TableHead className="text-lg font-['Helvetica Neue'] font-bold">
              {locale === "en" ? "Vietnamese name" : "Tên tiếng Việt"}
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
                {index + 1}.
              </TableCell>
              <TableCell className="text-lg font-['Helvetica Neue'] font-light">
                <div className={`${NomNaTong.className} text-xl`}>
                  {item.han_nom}
                </div>
              </TableCell>
              <TableCell className="text-lg font-['Helvetica Neue'] font-light">
                {item.quoc_ngu}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TaberdImagePopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        imageUrl={
          selectedItem
            ? getImageUrl(
                {
                  pages: String(selectedItem.trang),
                  id: 0,
                  nom: "",
                  qn: "",
                  cols: "0",
                },
                800
              )[0]
            : ""
        }
      >
        {selectedItem && (
          <div className="space-y-2">
            <div className="flex gap-4">
              <span className="font-semibold">
                {locale === "en" ? "Page:" : "Trang:"}
              </span>
              <span>{selectedItem.trang}</span>
            </div>
            <div className="flex gap-4">
              <span className="font-semibold">
                {locale === "en" ? "Character code:" : "Mã từ:"}
              </span>
              <span>{selectedItem.ma_tu}</span>
            </div>
          </div>
        )}
      </TaberdImagePopup>
    </>
  );
}
