"use client";

import { useState } from "react";
import localFont from "next/font/local";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { getCharactersForRadical } from "./actions";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

interface Radical {
  id: number;
  hn: string;
  URN: string;
  strokes: number;
  name: string;
  definition: string;
}

interface Character {
  nom: string;
  strokes: string;
  definition: string;
}

interface CompactRadicalsProps {
  radicals: Radical[];
  onCharacterSelect: (char: string) => void;
}

export default function CompactRadicals({
  radicals,
  onCharacterSelect,
}: CompactRadicalsProps) {
  const t = useTranslations("Tools.han-nom-tools.tools.radicals");
  const [selectedRadical, setSelectedRadical] = useState<Radical | null>(null);
  const [charactersByStroke, setCharactersByStroke] = useState<
    Record<string, Character[]>
  >({});
  const [selectedStroke, setSelectedStroke] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch characters when a radical is selected
  const handleRadicalClick = async (radical: Radical) => {
    setSelectedRadical(radical);
    setSelectedStroke(null);
    setLoading(true);

    try {
      const data = await getCharactersForRadical(radical.URN);
      setCharactersByStroke(data);
    } catch (err) {
      console.error("Error fetching characters:", err);
      toast.error(t("failed-to-load-characters"));
    } finally {
      setLoading(false);
    }
  };

  // Handle stroke count selection
  const handleStrokeClick = (stroke: string) => {
    setSelectedStroke(selectedStroke === stroke ? null : stroke);
  };

  // Group radicals by stroke count
  const radicalsByStroke = radicals.reduce((acc, radical) => {
    const strokeCount = radical.strokes;
    if (!acc[strokeCount]) {
      acc[strokeCount] = [];
    }
    acc[strokeCount].push(radical);
    return acc;
  }, {} as Record<number, Radical[]>);

  const strokeCounts = Object.keys(radicalsByStroke)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      {/* Radical Selection - Compact Version */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{t("select-radical")}</h3>
        <div className="border rounded-lg p-3 max-h-[300px] overflow-y-auto">
          {strokeCounts.map((strokeCount) => (
            <div key={strokeCount} className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {strokeCount} {strokeCount === 1 ? t("stroke") : t("strokes")}
              </div>
              <div className="flex flex-wrap gap-1">
                {radicalsByStroke[strokeCount].map((radical) => (
                  <button
                    key={radical.id}
                    onClick={() => handleRadicalClick(radical)}
                    className={`
                      ${NomNaTong.className}
                      w-7 h-7 flex items-center justify-center
                      text-sm border transition-all duration-200
                      ${
                        selectedRadical?.id === radical.id
                          ? "bg-branding-brown text-white border-branding-brown shadow-md"
                          : "bg-white hover:bg-branding-brown/10 border-gray-300 hover:border-branding-brown text-branding-black"
                      }
                    `}
                    title={`${radical.name} (${radical.definition})`}
                  >
                    {radical.hn}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Character Selection - Compact Version */}
      {selectedRadical && (
        <div className="space-y-2">
          {/* Radical info */}
          <div className="bg-branding-brown/10 border border-branding-brown rounded-lg p-2">
            <div className="flex items-center gap-2 text-xs">
              <div className={`${NomNaTong.className} text-2xl`}>
                {selectedRadical.hn}
              </div>
              <div>
                <div>
                  <span className="font-semibold">{t("name-label")}</span>{" "}
                  {selectedRadical.name}
                </div>
                <div>
                  <span className="font-semibold">{t("stroke-label")}</span>{" "}
                  {selectedRadical.strokes}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4 text-sm text-gray-500 border rounded-lg">
              {t("loading-characters")}
            </div>
          ) : Object.keys(charactersByStroke).length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500 border rounded-lg">
              {t("no-characters-found")}
            </div>
          ) : (
            <>
              {/* Stroke count selector */}
              <div>
                <div className="text-xs font-semibold mb-1">
                  {t("select-strokes")}
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(charactersByStroke)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map((stroke) => (
                      <button
                        key={stroke}
                        onClick={() => handleStrokeClick(stroke)}
                        className={`
                          px-2 py-0.5 border rounded text-xs font-medium transition-colors
                          ${
                            selectedStroke === stroke
                              ? "bg-branding-brown text-white border-branding-brown"
                              : "bg-white hover:bg-branding-brown/10 border-gray-300 hover:border-branding-brown text-branding-black"
                          }
                        `}
                      >
                        {stroke}
                      </button>
                    ))}
                </div>
              </div>

              {/* Characters display */}
              <div className="border rounded-lg p-3 max-h-[200px] overflow-y-auto">
                {selectedStroke ? (
                  <div className="flex flex-wrap gap-1">
                    {charactersByStroke[selectedStroke].map((char, idx) => (
                      <button
                        key={idx}
                        className={`
                          ${NomNaTong.className}
                          w-8 h-8 flex items-center justify-center
                          text-lg border border-gray-300 bg-white
                          hover:bg-branding-brown/10 hover:border-branding-brown
                          cursor-pointer
                          transition-all
                        `}
                        title={char.definition || t("no-definition")}
                        onClick={() => {
                          onCharacterSelect(char.nom);
                        }}
                      >
                        {char.nom}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-sm py-4">
                    {t("select-stroke-to-view")}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
