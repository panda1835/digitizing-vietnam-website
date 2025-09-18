import { Merriweather } from "next/font/google";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { abbreviations } from "../abbreviations";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export default function Abbreviations({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div>
      <div className={`${merriweather.className} text-branding-black text-4xl`}>
        {locale === "en" ? "Symbols and Abbreviations" : "Ký hiệu chữ viết tắt"}
      </div>
      <div className="mt-10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] text-lg font-['Helvetica Neue'] font-bold">
                {locale == "en" ? "Abbreviations" : "Kí hiệu"}
              </TableHead>
              <TableHead className="text-lg font-['Helvetica Neue'] font-bold">
                {locale == "en" ? "Meaning" : "Ý nghĩa"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {abbreviations.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-lg font-['Helvetica Neue'] font-light">
                  {item.abbr}
                </TableCell>
                <TableCell className="text-lg font-['Helvetica Neue'] font-light">
                  {item.full}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
