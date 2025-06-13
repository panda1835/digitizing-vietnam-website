"use client";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import classificationData from "./hn_classifcation.json";
import localFont from "next/font/local";
import { Link } from "@/i18n/routing";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/components/common/PageHeader";

import LookupableHanNomText from "@/components/common/LookupableHanNomText";
const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

type ClassificationState = Record<string, string | null>;

export default function HanNomFrequencyPage() {
  const [inputText, setInputText] = useState("");
  const [frequencies, setFrequencies] = useState<Record<string, number>>({});
  const [categoryCharacters, setCategoryCharacters] = useState<
    Record<string, string[]>
  >({});
  const [classifications, setClassifications] = useState<ClassificationState>(
    {}
  );
  const t = useTranslations();
  const locale = useLocale();
  const allCategories = [
    "A1",
    "A2",
    "B",
    "C1",
    "C2",
    "D1",
    "D2",
    "E1",
    "E2",
    "F1",
    "F2",
    "G1",
    "G2",
  ];
  useEffect(() => {
    const initialClassifications: ClassificationState = {};
    const initialFrequencies: Record<string, number> = {};
    const initialCategoryCharacters: Record<string, string[]> = {};

    for (const char of Array.from(inputText)) {
      const clsList = classificationData[char];
      if (Array.isArray(clsList)) {
        const uniqueCategories = Array.from(
          new Set(clsList.map((cls) => cls.split(":")[0].trim()))
        );
        if (uniqueCategories.length === 1) {
          const category = uniqueCategories[0];
          initialClassifications[char] = category;
          initialFrequencies[category] =
            (initialFrequencies[category] || 0) + 1;
          if (!initialCategoryCharacters[category])
            initialCategoryCharacters[category] = [];
          if (!initialCategoryCharacters[category].includes(char)) {
            initialCategoryCharacters[category].push(char);
          }
        }
      }
    }

    setClassifications(initialClassifications);
    setFrequencies(initialFrequencies);
    setCategoryCharacters(initialCategoryCharacters);
  }, [inputText]);

  const handleSelectClassification = (char: string, category: string) => {
    if (classifications[char]) return; // Skip if already selected
    setClassifications((prev) => ({ ...prev, [char]: category }));
    setFrequencies((prev) => ({
      ...prev,
      [category]: (prev[category] || 0) + 1,
    }));
    setCategoryCharacters((prev) => {
      const updated = { ...prev };
      if (!updated[category]) updated[category] = [];
      if (!updated[category].includes(char)) {
        updated[category].push(char);
      }
      return updated;
    });
  };

  const getColor = (char: string) => {
    if (classifications[char]) return "text-green-600";
    const cls = classificationData[char];
    if (!cls) return "text-gray-400";
    if (Array.isArray(cls) && cls.length === 1) return "text-green-600";
    return "text-black";
  };

  return (
    <main className="flex flex-col items-center max-width font-light font-['Helvetica Neue']">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t(
            "Tools.han-nom-tools.tools.nom-character-classification-and-analysis-tool.name"
          )}
          subtitle={t(
            "Tools.han-nom-tools.tools.nom-character-classification-and-analysis-tool.description"
          )}
          breadcrumbItems={[
            { label: t("NavigationBar.tools"), href: "tools" },
            {
              label: t("Tools.han-nom-tools.name"),
              href: "tools/han-nom-tools",
            },
            {
              label: t(
                "Tools.han-nom-tools.tools.nom-character-classification-and-analysis-tool.name"
              ),
            },
          ]}
          locale={locale}
        />
        <div className="mt-10 text-lg">
          {locale == "vi"
            ? "Xem danh sách các cấu trúc chữ Nôm tại:"
            : "View the list of Nom structures here:"}{" "}
          <span>
            <Link
              href="/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/chu-nom-structure"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {locale == "vi"
                ? "Sơ đồ phân loại cấu trúc chữ Nôm"
                : "Chữ Nôm Structure"}
            </Link>
          </span>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mt-10">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập văn bản Nôm ở đây..."
            className={`text-lg h-40 md:w-1/2 ${NomNaTong.className}`}
          />
          <div className="flex flex-col md:w-1/2 space-y-4">
            <div
              className={`flex flex-col bg-white border rounded-md p-4 min-h-40 whitespace-pre-wrap break-words`}
            >
              {inputText.split("\n").map((line, lineIdx) => (
                <div key={lineIdx} className="flex flex-wrap">
                  {Array.from(line).map((char, idx) => {
                    const cls = classificationData[char];
                    const currentCategory = classifications[char];
                    const categoryOptions = Array.isArray(cls)
                      ? cls.map((c) => c.split(":")[0].trim())
                      : [cls?.split(":")[0].trim()];
                    const uniqueOptions = Array.from(new Set(categoryOptions));
                    return (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <span>
                            <LookupableHanNomText
                              text={char}
                              className={` ${getColor(char)}`}
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="flex flex-wrap gap-2 max-w-xs">
                          {(uniqueOptions[0]
                            ? uniqueOptions
                            : allCategories
                          ).map((cat) => (
                            <Button
                              key={cat}
                              size="sm"
                              disabled={currentCategory === cat}
                              onClick={() =>
                                handleSelectClassification(char, cat)
                              }
                            >
                              {cat}
                            </Button>
                          ))}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
            {inputText && (
              <div className="text-lg space-y-1 ">
                <div>
                  <span className="text-green-600">
                    {locale == "en" ? "Green" : "Xanh lá"}
                  </span>
                  :{" "}
                  {locale == "en"
                    ? "Confirmed classification"
                    : "Phân loại đã xác nhận"}
                </div>
                <div>
                  <span className="text-black">
                    {locale == "en" ? "Black" : "Đen"}
                  </span>
                  :{" "}
                  {locale == "en"
                    ? "Needs manual classification"
                    : "Cần phân loại"}
                </div>
                <div>
                  <span className="text-gray-400">
                    {locale == "en" ? "Grey" : "Xám"}
                  </span>
                  :{" "}
                  {locale == "en"
                    ? "No classification data"
                    : "Không có dữ liệu phân loại tự động"}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-10">
          {Object.keys(categoryCharacters).length > 0 && (
            <Card>
              <CardContent className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-lg">
                        {locale == "en" ? "Category" : "Phân loại"}
                      </TableHead>
                      <TableHead className="text-lg">
                        {locale == "en" ? "Frequency" : "Tần suất"}
                      </TableHead>
                      <TableHead className="text-lg">
                        {locale == "en" ? "Characters" : "Kí tự"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(categoryCharacters).map(
                      ([category, chars]) => (
                        <TableRow key={category}>
                          <TableCell className="text-lg">{category}</TableCell>
                          <TableCell className="text-lg">
                            {frequencies[category] || 0}
                          </TableCell>
                          <TableCell className={`${NomNaTong.className}`}>
                            <LookupableHanNomText
                              text={chars.join(" ")}
                              className="whitespace-pre-wrap"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
