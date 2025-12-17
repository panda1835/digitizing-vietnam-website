"use client";

import { Button } from "@/components/ui/button";
import localFont from "next/font/local";

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

interface QuocNguSuggestionsProps {
  candidates: CandidateResult;
  currentWord: string;
  selectedChar: string;
  isSelecting: boolean;
  hoveredIndex: number | null;
  onSelect: (char: string, qn?: string) => void;
}

export default function QuocNguSuggestions({
  candidates,
  currentWord,
  selectedChar,
  isSelecting,
  hoveredIndex,
  onSelect,
}: QuocNguSuggestionsProps) {
  return (
    <div className="space-y-3">
      {Object.keys(candidates)
        .sort((a, b) => {
          const lowerWord = currentWord.toLowerCase();
          const aIsExact = a === lowerWord;
          const bIsExact = b === lowerWord;

          // Exact match comes first
          if (aIsExact && !bIsExact) return -1;
          if (!aIsExact && bIsExact) return 1;

          // Both are exact or both are compound, sort alphabetically
          return a.localeCompare(b);
        })
        .map((qn) => {
          const items = candidates[qn];
          const isExactMatch = qn === currentWord.toLowerCase();

          return (
            <div key={qn} className="space-y-2">
              <div className="font-medium text-lg">{qn}</div>
              <div className="flex flex-wrap gap-2">
                {items.map((item, i) => {
                  const isHovered =
                    isExactMatch && isSelecting && hoveredIndex === i;
                  const isSelected = selectedChar === item.text;

                  return (
                    <Button
                      key={i}
                      variant={isSelected ? "default" : "ghost"}
                      onClick={() => onSelect(item.text, qn)}
                      className={`relative ${
                        isHovered ? "ring-2 ring-blue-500" : ""
                      }`}
                    >
                      <div className={`${NomNaTong.className} text-xl`}>
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
  );
}
