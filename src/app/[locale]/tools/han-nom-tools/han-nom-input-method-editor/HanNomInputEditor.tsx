"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import nomMap from "./qn_nom.json";
import hanNomList from "./han-nom-list.json";
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

interface HanNomItem {
  text: string;
  freq: number;
  qn: string;
}

interface CandidateResult {
  [key: string]: HanNomItem[];
}

export default function HanNomTranslator() {
  const [inputText, setInputText] = useState("");
  const [words, setWords] = useState<string[][]>([]);
  const [candidates, setCandidates] = useState<CandidateResult[][]>([]);
  const [selectedChars, setSelectedChars] = useState<string[][]>([]);
  const [activeIndex, setActiveIndex] = useState<{
    line: number;
    word: number;
  } | null>(null);
  const [hoveredCandidateIndex, setHoveredCandidateIndex] = useState<
    number | null
  >(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);

  // Create a lookup map for han-nom-list by qn (Quoc Ngu)
  const hanNomMap = (hanNomList as HanNomItem[]).reduce((acc, item) => {
    if (!acc[item.qn]) {
      acc[item.qn] = [];
    }
    acc[item.qn].push(item);
    return acc;
  }, {} as Record<string, HanNomItem[]>);

  const getCandidatesForWord = (word: string): CandidateResult => {
    const lowerWord = word.toLowerCase();
    const result: CandidateResult = {};

    // Find exact matches from han-nom-list
    const exactMatches = hanNomMap[lowerWord] || [];
    if (exactMatches.length > 0) {
      // Sort exact matches by frequency (ascending)
      result[lowerWord] = exactMatches.slice().sort((a, b) => a.freq - b.freq);
    }

    // Find additional exact matches from qn_nom that aren't in han-nom-list
    const qnNomMatches = nomMap[lowerWord] || [];
    const hanNomTexts = new Set(exactMatches.map((item) => item.text));
    const additionalExactMatches = qnNomMatches.filter(
      (text) => !hanNomTexts.has(text)
    );

    // Add additional matches to the exact match list
    if (additionalExactMatches.length > 0) {
      if (!result[lowerWord]) {
        result[lowerWord] = [];
      }
      result[lowerWord].push(
        ...additionalExactMatches.map((text) => ({
          text,
          qn: lowerWord,
          freq: 0,
        }))
      );
    }

    // Find compound words that start with the input word
    const compoundMatches = (hanNomList as HanNomItem[]).filter(
      (item) =>
        item.qn.toLowerCase().startsWith(lowerWord + " ") &&
        item.qn !== lowerWord
    );

    // Group compound matches by their qn
    compoundMatches.forEach((item) => {
      if (!result[item.qn]) {
        result[item.qn] = [];
      }
      result[item.qn].push(item);
    });

    return result;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;

    // Check for number shortcuts (word followed by digit)
    const lines = text.split("\n");
    let hasNumberShortcut = false;
    let modifiedText = text;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const words = line.trim().split(/\s+/);

      for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        const word = words[wordIndex];
        const match = word.match(/^(.+?)([1-9])$/);

        if (match) {
          const [, baseWord, digit] = match;
          const digitIndex = parseInt(digit, 10) - 1;

          // Get candidates for the base word
          const wordCandidates = getCandidatesForWord(baseWord);
          const exactMatch = wordCandidates[baseWord.toLowerCase()];

          if (exactMatch && exactMatch[digitIndex]) {
            // Replace the word with digit with just the base word
            words[wordIndex] = baseWord;
            lines[lineIndex] = words.join(" ");
            modifiedText = lines.join("\n");

            // Auto-select the character
            hasNumberShortcut = true;
            setTimeout(() => {
              const updatedSelectedChars = selectedChars.map((line, i) =>
                line.map((c, j) =>
                  i === lineIndex && j === wordIndex
                    ? exactMatch[digitIndex].text
                    : c
                )
              );
              setSelectedChars(updatedSelectedChars);
            }, 0);

            break;
          }
        }
      }
      if (hasNumberShortcut) break;
    }

    setInputText(modifiedText);

    const processedLines = modifiedText
      .split("\n")
      .map((line) => line.trim().split(/\s+/));
    const mappedCandidates = processedLines.map((line) =>
      line.map((word) => getCandidatesForWord(word))
    );

    const mappedSelected = processedLines.map((line, i) =>
      line.map((word, j) => {
        if (words[i]?.[j] === word && selectedChars[i]?.[j]) {
          return selectedChars[i][j];
        }
        // Get the first character from the exact match (the word itself)
        const wordCandidates = mappedCandidates[i][j];
        const exactMatch = wordCandidates[word.toLowerCase()];
        return exactMatch?.[0]?.text || "";
      })
    );

    setWords(processedLines);
    setCandidates(mappedCandidates);
    if (!hasNumberShortcut) {
      setSelectedChars(mappedSelected);
    }
    setActiveIndex(
      processedLines.length > 0
        ? {
            line: processedLines.length - 1,
            word: processedLines[processedLines.length - 1].length - 1,
          }
        : null
    );
    setHoveredCandidateIndex(null);
    setIsSelecting(false);
  };

  const handleSelect = (
    lineIndex: number,
    wordIndex: number,
    char: string,
    selectedQn?: string
  ) => {
    // If a compound word is selected, replace the current word in the input text
    if (
      selectedQn &&
      selectedQn !== words[lineIndex][wordIndex].toLowerCase()
    ) {
      const lines = inputText.split("\n");
      const currentLine = lines[lineIndex];
      const wordsInLine = currentLine.trim().split(/\s+/);

      // Replace the word at wordIndex with the selected compound word
      wordsInLine[wordIndex] = selectedQn;
      lines[lineIndex] = wordsInLine.join(" ");

      const newInputText = lines.join("\n");
      setInputText(newInputText);

      // Trigger the change handler to update all states
      const event = {
        target: { value: newInputText },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      handleChange(event);

      return;
    }

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

    const currentCandidates = candidates[activeIndex.line]?.[activeIndex.word];
    const currentWord =
      words[activeIndex.line]?.[activeIndex.word]?.toLowerCase();
    const exactCandidates = currentCandidates?.[currentWord] || [];
    const totalExactCandidates = exactCandidates.length;

    if (isSelecting) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setHoveredCandidateIndex((prev) =>
          prev === null ? 0 : (prev + 1) % totalExactCandidates
        );
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setHoveredCandidateIndex((prev) =>
          prev === null
            ? totalExactCandidates - 1
            : (prev - 1 + totalExactCandidates) % totalExactCandidates
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (
          hoveredCandidateIndex !== null &&
          exactCandidates[hoveredCandidateIndex]
        ) {
          handleSelect(
            activeIndex.line,
            activeIndex.word,
            exactCandidates[hoveredCandidateIndex].text,
            currentWord
          );
        }
      } else if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        if (index < totalExactCandidates && exactCandidates[index]) {
          const char = exactCandidates[index].text;
          handleSelect(activeIndex.line, activeIndex.word, char, currentWord);
          setHoveredCandidateIndex(index);
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
                  <div className="space-y-4">
                    {/* Display all candidates grouped by qn, sorted alphabetically */}
                    {candidates[activeIndex.line][activeIndex.word] && (
                      <div className="space-y-3">
                        {Object.keys(
                          candidates[activeIndex.line][activeIndex.word]
                        )
                          .sort((a, b) => {
                            const currentWord =
                              words[activeIndex.line][
                                activeIndex.word
                              ].toLowerCase();
                            const aIsExact = a === currentWord;
                            const bIsExact = b === currentWord;

                            // Exact match comes first
                            if (aIsExact && !bIsExact) return -1;
                            if (!aIsExact && bIsExact) return 1;

                            // Both are exact or both are compound, sort alphabetically
                            return a.localeCompare(b);
                          })
                          .map((qn) => {
                            const items =
                              candidates[activeIndex.line][activeIndex.word][
                                qn
                              ];
                            const isExactMatch =
                              qn ===
                              words[activeIndex.line][
                                activeIndex.word
                              ].toLowerCase();

                            return (
                              <div key={qn} className="space-y-2">
                                <div className="font-medium text-xl">{qn}</div>
                                <div className="flex flex-wrap gap-2">
                                  {items.map((item, i) => {
                                    const isHovered =
                                      isExactMatch &&
                                      isSelecting &&
                                      hoveredCandidateIndex === i;
                                    const isSelected =
                                      selectedChars[activeIndex.line][
                                        activeIndex.word
                                      ] === item.text;

                                    return (
                                      <Button
                                        key={i}
                                        variant={
                                          isSelected ? "default" : "ghost"
                                        }
                                        onClick={() =>
                                          handleSelect(
                                            activeIndex.line,
                                            activeIndex.word,
                                            item.text,
                                            qn
                                          )
                                        }
                                        className={`relative ${
                                          isHovered
                                            ? "ring-2 ring-blue-500"
                                            : ""
                                        }`}
                                      >
                                        <div
                                          className={`${NomNaTong.className} text-xl`}
                                        >
                                          {item.text}
                                        </div>
                                        {isExactMatch && i < 9 && (
                                          <div className="absolute top-0 right-1 text-xs text-gray-400">
                                            {i + 1}
                                          </div>
                                        )}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
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
