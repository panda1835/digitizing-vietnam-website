"use client";

import { useState } from "react";
import { Merriweather } from "next/font/google";
import localFont from "next/font/local";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { getCharactersForRadical } from "./actions";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });
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

interface RadicalsClientProps {
  initialRadicals: Radical[];
}

export default function RadicalsClient({
  initialRadicals,
}: RadicalsClientProps) {
  const t = useTranslations("Tools.han-nom-tools.tools.radicals");
  const [radicals] = useState<Radical[]>(initialRadicals);
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
    // Scroll to characters section after loading
    setTimeout(() => {
      const element = document.getElementById("characters-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
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
    <div>
      <div
        className={`${merriweather.className} text-branding-black text-4xl mb-8`}
      >
        {t("name")}
      </div>

      {/* Main content area */}
      <div className="space-y-8">
        {/* Radicals organized by stroke count */}
        <div>
          <h2 className="text-xl font-semibold mb-4">{t("select-radical")}</h2>
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            {/* Radicals display area */}
            <div className="bg-white p-6 min-h-[400px]">
              {strokeCounts.map((strokeCount) => (
                <div
                  key={strokeCount}
                  className="mb-6"
                  data-stroke={strokeCount}
                >
                  <div className="text-sm font-semibold text-gray-600 mb-2">
                    {strokeCount}{" "}
                    {strokeCount === 1 ? t("stroke") : t("strokes")}:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {radicalsByStroke[strokeCount].map((radical) => (
                      <button
                        key={radical.id}
                        onClick={() => handleRadicalClick(radical)}
                        className={`
                          ${NomNaTong.className}
                          w-9 h-9 flex items-center justify-center
                          text-lg border-2 transition-all duration-200
                          ${
                            selectedRadical?.id === radical.id
                              ? "bg-branding-brown text-white border-branding-brown shadow-md scale-110"
                              : "bg-white hover:bg-branding-brown/10 border-gray-300 hover:border-branding-brown text-branding-black"
                          }
                        `}
                        title={`${radical.name} (${radical.definition}) - ${radical.strokes} strokes`}
                      >
                        {radical.hn}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Character display section */}
        {selectedRadical && (
          <div id="characters-section">
            {/* Radical info header */}
            <div className="bg-branding-brown/10 border-2 border-branding-brown rounded-lg p-4 mb-4">
              <div className="flex items-center gap-4">
                <div className={`${NomNaTong.className} text-5xl`}>
                  {selectedRadical.hn}
                </div>
                <div className="text-sm">
                  <div>
                    <span className="font-semibold">{t("name-label")}</span>{" "}
                    {selectedRadical.name}
                  </div>
                  <div>
                    <span className="font-semibold">
                      {t("definition-label")}
                    </span>{" "}
                    {selectedRadical.definition}
                  </div>
                  <div>
                    <span className="font-semibold">
                      {t("radical-strokes")}
                    </span>{" "}
                    {selectedRadical.strokes}
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500 border-2 border-gray-300 rounded-lg">
                {t("loading-characters")}
              </div>
            ) : Object.keys(charactersByStroke).length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-gray-300 rounded-lg">
                {t("no-characters-found")}
              </div>
            ) : (
              <>
                {/* Stroke count selector */}
                <div className="mb-4">
                  <div className="text-sm font-semibold mb-2">
                    {t("select-strokes")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(charactersByStroke)
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map((stroke) => (
                        <button
                          key={stroke}
                          onClick={() => handleStrokeClick(stroke)}
                          className={`
                            px-3 py-1 border rounded text-sm font-medium transition-colors
                            ${
                              selectedStroke === stroke
                                ? "bg-branding-brown text-white border-branding-brown shadow-md scale-110"
                                : "bg-white hover:bg-branding-brown/10 border-gray-300 hover:border-branding-brown text-branding-black"
                            }
                          `}
                        >
                          {stroke}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Characters display box */}
                <div className="border-2 border-gray-300 rounded-lg bg-white p-6 min-h-[300px]">
                  {selectedStroke ? (
                    <div className="flex flex-wrap gap-2">
                      {charactersByStroke[selectedStroke].map((char, idx) => (
                        <div
                          key={idx}
                          className={`
                            ${NomNaTong.className}
                            w-12 h-12 flex items-center justify-center
                            text-2xl border border-gray-300 bg-white
                            hover:bg-branding-brown/10 hover:border-branding-brown
                            cursor-pointer
                            transition-all
                          `}
                          title={char.definition || t("no-definition")}
                          onClick={() => {
                            navigator.clipboard
                              .writeText(char.nom)
                              .then(() => {
                                toast.success(t("copied-to-clipboard"));
                              })
                              .catch(() => {
                                toast.error(t("failed-to-copy"));
                              });
                          }}
                        >
                          {char.nom}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      {t("select-stroke-to-view")}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
