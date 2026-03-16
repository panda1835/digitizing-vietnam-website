"use client";

import { useState } from "react";
import { Download, ChevronUp, ChevronDown } from "lucide-react";
import { createAnkiDownload } from "@/lib/language-lab/ankiExport";

const POS_COLORS = {
  noun: "bg-blue-100 text-blue-700",
  verb: "bg-green-100 text-green-700",
  adjective: "bg-purple-100 text-purple-700",
  adverb: "bg-yellow-100 text-yellow-700",
  conjunction: "bg-orange-100 text-orange-700",
  particle: "bg-pink-100 text-pink-700",
  classifier: "bg-teal-100 text-teal-700",
  other: "bg-stone-100 text-stone-600",
};

export default function VocabList({ vocabulary, deckName = "DigitizingVietnam" }) {
  const [expanded, setExpanded] = useState(null);
  const [sortBy, setSortBy] = useState("order"); // order | pos | alpha

  const sorted = [...vocabulary].sort((a, b) => {
    if (sortBy === "alpha") return a.word.localeCompare(b.word, "vi");
    if (sortBy === "pos") return (a.partOfSpeech ?? "").localeCompare(b.partOfSpeech ?? "");
    return 0; // original order
  });

  function handleAnkiExport() {
    const { url, filename } = createAnkiDownload(vocabulary, deckName);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Sort by</span>
          {[["order", "Text Order"], ["alpha", "A–Z"], ["pos", "Part of Speech"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setSortBy(val)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                sortBy === val
                  ? "bg-red-700 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={handleAnkiExport}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-300 hover:border-red-700 hover:text-red-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export to Anki
        </button>
      </div>

      {/* Vocab rows */}
      <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
        {sorted.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-stone-900 text-base">{item.word}</span>
                {item.partOfSpeech && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      POS_COLORS[item.partOfSpeech] ?? POS_COLORS.other
                    }`}
                  >
                    {item.partOfSpeech}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-stone-600 text-sm">{item.definition}</span>
                {expanded === item.id ? (
                  <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                )}
              </div>
            </button>

            {expanded === item.id && (
              <div className="px-4 pb-4 pt-1 bg-stone-50 text-sm space-y-2">
                {item.exampleSentence && (
                  <div className="border-l-2 border-red-300 pl-3">
                    <p className="text-stone-800 italic">{item.exampleSentence}</p>
                    <p className="text-stone-500 mt-0.5">{item.exampleTranslation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
