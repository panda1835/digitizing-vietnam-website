"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import nomMap from "./qn_nom.json";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import { PageHeader } from "@/components/common/PageHeader";
import localFont from "next/font/local";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function HanNomTranslator() {
  const [inputText, setInputText] = useState("");
  const [words, setWords] = useState<string[][]>([]);
  const [candidates, setCandidates] = useState<string[][][]>([]);
  const [selectedChars, setSelectedChars] = useState<string[][]>([]);
  const [activeIndex, setActiveIndex] = useState<{
    line: number;
    word: number;
  } | null>(null);
  const [hoveredCandidateIndex, setHoveredCandidateIndex] = useState<
    number | null
  >(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);

    const lines = text.split("\n").map((line) => line.trim().split(/\s+/));
    const mappedCandidates = lines.map((line) =>
      line.map((word) => nomMap[word.toLowerCase()] || [])
    );

    const mappedSelected = lines.map((line, i) =>
      line.map((word, j) => {
        if (words[i]?.[j] === word && selectedChars[i]?.[j]) {
          return selectedChars[i][j];
        }
        return mappedCandidates[i][j]?.[0] || "";
      })
    );

    setWords(lines);
    setCandidates(mappedCandidates);
    setSelectedChars(mappedSelected);
    setActiveIndex(
      lines.length > 0
        ? { line: lines.length - 1, word: lines[lines.length - 1].length - 1 }
        : null
    );
    setHoveredCandidateIndex(null);
    setIsSelecting(false);
  };

  const handleSelect = (lineIndex: number, wordIndex: number, char: string) => {
    const updated = selectedChars.map((line, i) =>
      line.map((c, j) => (i === lineIndex && j === wordIndex ? char : c))
    );
    setSelectedChars(updated);
    setIsSelecting(false);
    setHoveredCandidateIndex(null);
  };

  const t = useTranslations();
  const locale = useLocale();

  const handleCopy = () => {
    const textToCopy = selectedChars.map((line) => line.join("")).join("\n");
    navigator.clipboard.writeText(textToCopy);
    toast.success(t("Toast.copied"));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!activeIndex) return;

    const totalCandidates =
      candidates[activeIndex.line]?.[activeIndex.word]?.length || 0;

    if (isSelecting) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setHoveredCandidateIndex((prev) =>
          prev === null ? 0 : (prev + 1) % totalCandidates
        );
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setHoveredCandidateIndex((prev) =>
          prev === null
            ? totalCandidates - 1
            : (prev - 1 + totalCandidates) % totalCandidates
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (hoveredCandidateIndex !== null) {
          handleSelect(
            activeIndex.line,
            activeIndex.word,
            candidates[activeIndex.line][activeIndex.word][
              hoveredCandidateIndex
            ]
          );
        }
      } else if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        if (index < totalCandidates) {
          const char = candidates[activeIndex.line][activeIndex.word][index];
          const updated = selectedChars.map((line, i) =>
            line.map((c, j) =>
              i === activeIndex.line && j === activeIndex.word ? char : c
            )
          );
          setSelectedChars(updated);
          setHoveredCandidateIndex(index); // Update the highlight
          // Don't disable selection mode yet — allow more keypresses
        }
      }
    } else {
      if (e.key === "ArrowDown") {
        setIsSelecting(true);
        setHoveredCandidateIndex(0);
      }
    }
  };

  return (
    <div className="flex-col mb-20 w-full">
      <PageHeader
        title={t("Tools.han-nom-tools.tools.han-nom-input-method-editor.name")}
        subtitle={t(
          "Tools.han-nom-tools.tools.han-nom-input-method-editor.description"
        )}
        breadcrumbItems={[
          { label: t("NavigationBar.tools"), href: "tools" },
          { label: t("Tools.han-nom-tools.name"), href: "tools/han-nom-tools" },
          {
            label: t(
              "Tools.han-nom-tools.tools.han-nom-input-method-editor.name"
            ),
          },
        ]}
        locale={locale}
      />
      <div className="flex flex-col md:flex-row gap-4 mt-10">
        {/* Input Box */}
        <div className="w-full md:w-1/2">
          <Textarea
            value={inputText}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t(
              "Tools.han-nom-tools.tools.han-nom-input-method-editor.type-in-quoc-ngu"
            )}
            className="h-40"
          />
        </div>

        {/* Output Box */}
        <div className="w-full md:w-1/2">
          <Card>
            <CardContent className="py-4 space-y-4">
              <div className="flex justify-between items-start">
                <div className="text-xl whitespace-pre-line">
                  <LookupableHanNomText
                    text={selectedChars.map((line) => line.join("")).join("\n")}
                  />
                </div>
                <div className="flex h-full justify-stretch items-start">
                  <Button size="icon" className="bg-black" onClick={handleCopy}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {activeIndex && words[activeIndex.line]?.[activeIndex.word] && (
                  <div className="space-y-1">
                    <div className="font-medium text-xl">
                      {words[activeIndex.line][activeIndex.word]}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {candidates[activeIndex.line][activeIndex.word]?.map(
                        (char, i) => {
                          const isHovered =
                            isSelecting && hoveredCandidateIndex === i;
                          const isSelected =
                            selectedChars[activeIndex.line][
                              activeIndex.word
                            ] === char;

                          return (
                            <Button
                              key={i}
                              variant={isSelected ? "default" : "ghost"}
                              onClick={() =>
                                handleSelect(
                                  activeIndex.line,
                                  activeIndex.word,
                                  char
                                )
                              }
                              className={`relative ${
                                isHovered ? "ring-2 ring-blue-500" : ""
                              }`}
                            >
                              <div className={`${NomNaTong.className} text-xl`}>
                                {char}
                              </div>
                              {i < 9 && (
                                <div className="absolute top-0 right-1 text-xs text-gray-400">
                                  {i + 1}
                                </div>
                              )}
                            </Button>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
