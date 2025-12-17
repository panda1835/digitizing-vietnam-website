"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import localFont from "next/font/local";
import { useTranslations } from "next-intl";
import nomMap from "./qn_nom.json";
import hanNomList from "./han-nom-list.json";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

interface HanNomItem {
  text: string;
  freq: number;
  qn: string;
}

interface QuocNguSingleCharProps {
  onCharacterSelect: (char: string) => void;
}

export default function QuocNguSingleChar({
  onCharacterSelect,
}: QuocNguSingleCharProps) {
  const t = useTranslations("Tools.han-nom-tools.tools.quoc-ngu-input");
  const [inputWord, setInputWord] = useState("");
  const [candidates, setCandidates] = useState<HanNomItem[]>([]);

  // Create a lookup map for han-nom-list by qn (Quoc Ngu)
  const hanNomMap = (hanNomList as HanNomItem[]).reduce((acc, item) => {
    if (!acc[item.qn]) {
      acc[item.qn] = [];
    }
    acc[item.qn].push(item);
    return acc;
  }, {} as Record<string, HanNomItem[]>);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const word = e.target.value;
    setInputWord(word);

    if (!word.trim()) {
      setCandidates([]);
      return;
    }

    const lowerWord = word.toLowerCase().trim();
    const result: HanNomItem[] = [];

    // Find exact matches from han-nom-list
    const exactMatches = hanNomMap[lowerWord] || [];
    if (exactMatches.length > 0) {
      // Sort exact matches by frequency (ascending)
      result.push(...exactMatches.slice().sort((a, b) => a.freq - b.freq));
    }

    // Find additional exact matches from qn_nom that aren't in han-nom-list
    const qnNomMatches = nomMap[lowerWord] || [];
    const hanNomTexts = new Set(exactMatches.map((item) => item.text));
    const additionalExactMatches = qnNomMatches.filter(
      (text) => !hanNomTexts.has(text)
    );

    // Add additional matches to the exact match list
    if (additionalExactMatches.length > 0) {
      result.push(
        ...additionalExactMatches.map((text) => ({
          text,
          qn: lowerWord,
          freq: 0,
        }))
      );
    }

    setCandidates(result);
  };

  const handleSelect = (char: string) => {
    onCharacterSelect(char);
    setInputWord("");
    setCandidates([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Check if we have candidates and user pressed a number or Enter
    if (candidates.length > 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        handleSelect(candidates[0].text);
      } else if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(e.key, 10) - 1;
        if (index < candidates.length) {
          handleSelect(candidates[index].text);
        }
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Additional handler to prevent any character from being added when using shortcuts
    if (candidates.length > 0 && /^[1-9]$/.test(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Input
          value={inputWord}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onKeyPress={handleKeyPress}
          placeholder={t("placeholder")}
          className="text-lg"
          autoFocus
        />
      </div>

      {candidates.length > 0 && (
        <div className="border rounded-lg p-4">
          <div className="text-sm font-semibold mb-2">
            {t("select-character")}
          </div>
          <div className="flex flex-wrap gap-2">
            {candidates.map((item, i) => (
              <Button
                key={i}
                variant="ghost"
                onClick={() => handleSelect(item.text)}
                className="relative"
              >
                <div className={`${NomNaTong.className} text-xl`}>
                  {item.text}
                </div>
                {i < 9 && (
                  <div className="absolute top-0 right-1 text-xs text-gray-400">
                    {i + 1}
                  </div>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
