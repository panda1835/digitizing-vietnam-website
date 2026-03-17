"use client";

import { useState, useCallback, useMemo } from "react";
import { ExternalLink, BookOpen, AlignLeft, HelpCircle, Globe, ChevronLeft, Trash2, Download } from "lucide-react";
import VocabList from "./VocabList";
import { GrammarPoints, CulturalNotes, ComprehensionQuestions } from "./StudyComponents";
import WordLookupPopup, { LookupResult } from "./WordLookupPopup";

const DIFFICULTY_STYLES = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
};

const POS_COLORS: Record<string, string> = {
  noun: "bg-blue-100 text-blue-700",
  verb: "bg-green-100 text-green-700",
  adjective: "bg-purple-100 text-purple-700",
  adverb: "bg-orange-100 text-orange-700",
  conjunction: "bg-pink-100 text-pink-700",
  particle: "bg-teal-100 text-teal-700",
  classifier: "bg-indigo-100 text-indigo-700",
  other: "bg-stone-100 text-stone-600",
};

export default function StudyPage({ material, onReset }) {
  const [activeTab, setActiveTab] = useState("text");
  const [savedVocab, setSavedVocab] = useState<LookupResult[]>([]);

  const savedWords = useMemo(
    () => new Set(savedVocab.map((v) => v.word.toLowerCase())),
    [savedVocab]
  );

  const handleSave = useCallback((result: LookupResult) => {
    setSavedVocab((prev) => {
      if (prev.some((v) => v.word.toLowerCase() === result.word.toLowerCase())) return prev;
      return [...prev, result];
    });
  }, []);

  const handleRemove = useCallback((word: string) => {
    setSavedVocab((prev) => prev.filter((v) => v.word.toLowerCase() !== word.toLowerCase()));
  }, []);

  const TABS = [
    { id: "text", label: "Annotated Text", icon: AlignLeft },
    { id: "vocab", label: "Vocabulary", icon: BookOpen },
    { id: "myvocab", label: "My Vocab", icon: BookOpen },
    { id: "grammar", label: "Grammar", icon: BookOpen },
    { id: "questions", label: "Comprehension", icon: HelpCircle },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <WordLookupPopup onSave={handleSave} savedWords={savedWords} />
      {/* Back button */}
      {onReset && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Generate another
        </button>
      )}

      {/* Article header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 leading-snug">{material.title}</h1>
            {material.sourceUrl && (
              <a
                href={material.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-red-700 hover:underline mt-1"
              >
                <Globe className="w-3.5 h-3.5" />
                View original source
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          {material.difficulty && (
            <span
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wide ${
                DIFFICULTY_STYLES[material.difficulty] ?? DIFFICULTY_STYLES.intermediate
              }`}
            >
              {material.difficulty}
            </span>
          )}
        </div>

        {material.summary && (
          <p className="mt-3 text-stone-600 text-sm leading-relaxed border-l-4 border-stone-200 pl-4">
            {material.summary}
          </p>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-stone-200 mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === id
                ? "border-red-700 text-red-700"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            {label}
            {id === "vocab" && material.vocabulary?.length > 0 && (
              <span className="ml-1 text-xs bg-stone-100 text-stone-500 rounded-full px-1.5 py-0.5">
                {material.vocabulary.length}
              </span>
            )}
            {id === "myvocab" && savedVocab.length > 0 && (
              <span className="ml-1 text-xs bg-red-100 text-red-700 rounded-full px-1.5 py-0.5">
                {savedVocab.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "text" && (
          <AnnotatedText html={material.annotatedHtml} vocabulary={material.vocabulary} />
        )}
        {activeTab === "vocab" && material.vocabulary?.length > 0 && (
          <VocabList vocabulary={material.vocabulary} deckName={material.title} />
        )}
        {activeTab === "myvocab" && (
          <MyVocabTab
            savedVocab={savedVocab}
            onRemove={handleRemove}
            deckName={material.title}
            posColors={POS_COLORS}
          />
        )}
        {activeTab === "grammar" && (
          <div className="space-y-6">
            {material.grammarPoints?.length > 0 && (
              <GrammarPoints grammarPoints={material.grammarPoints} />
            )}
            {material.culturalNotes?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
                  Cultural Notes
                </h3>
                <CulturalNotes culturalNotes={material.culturalNotes} />
              </div>
            )}
          </div>
        )}
        {activeTab === "questions" && material.comprehensionQuestions?.length > 0 && (
          <ComprehensionQuestions questions={material.comprehensionQuestions} />
        )}
      </div>
    </div>
  );
}

/**
 * Renders the annotated HTML with hover cards for vocabulary words.
 */
function AnnotatedText({ html, vocabulary }) {
  const [hovered, setHovered] = useState<{ id: string | undefined; rect: DOMRect } | null>(null);
  const vocabMap = Object.fromEntries((vocabulary ?? []).map((v) => [v.id, v]));

  // We inject the HTML and intercept mouseover via event delegation
  return (
    <div className="relative">
      <div
        className="prose prose-stone max-w-none text-stone-800 leading-relaxed [&_.vl-word]:border-b-2 [&_.vl-word]:border-red-400 [&_.vl-word]:border-dashed [&_.vl-word]:cursor-pointer [&_.vl-word]:transition-colors hover:[&_.vl-word]:bg-red-50"
        dangerouslySetInnerHTML={{ __html: html }}
        onMouseOver={(e) => {
          const el = (e.target as HTMLElement).closest(".vl-word") as HTMLElement | null;
          if (el) setHovered({ id: el.dataset.id, rect: el.getBoundingClientRect() });
        }}
        onMouseOut={(e) => {
          if (!(e.target as HTMLElement).closest(".vl-word")) setHovered(null);
        }}
      />

      {/* Hover card */}
      {hovered?.id && vocabMap[hovered.id] && (
        <VocabHoverCard vocab={vocabMap[hovered.id]} />
      )}
    </div>
  );
}

function VocabHoverCard({ vocab }) {
  return (
    <div className="fixed z-50 bottom-6 right-6 w-72 bg-white border border-stone-200 rounded-xl shadow-xl p-4 pointer-events-none">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xl font-bold text-stone-900">{vocab.word}</span>
        {vocab.partOfSpeech && (
          <span className="text-xs bg-stone-100 text-stone-500 rounded-full px-2 py-0.5 shrink-0 mt-1">
            {vocab.partOfSpeech}
          </span>
        )}
      </div>
      <p className="text-stone-700 text-sm">{vocab.definition}</p>
      {vocab.exampleSentence && (
        <div className="mt-2 pt-2 border-t border-stone-100">
          <p className="text-stone-600 text-xs italic">{vocab.exampleSentence}</p>
          <p className="text-stone-400 text-xs">{vocab.exampleTranslation}</p>
        </div>
      )}
    </div>
  );
}

function MyVocabTab({
  savedVocab,
  onRemove,
  deckName,
  posColors,
}: {
  savedVocab: LookupResult[];
  onRemove: (word: string) => void;
  deckName: string;
  posColors: Record<string, string>;
}) {
  if (savedVocab.length === 0) {
    return (
      <div className="text-center py-16 text-stone-400">
        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium text-stone-500">No saved vocabulary yet</p>
        <p className="text-xs mt-1 max-w-xs mx-auto">
          Highlight any word or phrase in the Annotated Text tab and click{" "}
          <span className="font-medium text-stone-600">Save to My Vocab</span> to build your personal list.
        </p>
      </div>
    );
  }

  const exportAnki = () => {
    const rows = savedVocab.map((v) => {
      const back = [
        `<b>${v.partOfSpeech}</b>`,
        v.definition,
        v.ipaHanoi ? `IPA (Hà Nội): ${v.ipaHanoi}` : "",
        v.ipaSaigon ? `IPA (Sài Gòn): ${v.ipaSaigon}` : "",
        v.example ? `<i>${v.example}</i>` : "",
        v.exampleTranslation ?? "",
      ]
        .filter(Boolean)
        .join("<br>");
      const tag = deckName.replace(/\s+/g, "_").replace(/[^\w]/g, "");
      return `${v.word}\t${back}\t${tag}`;
    });
    const content = rows.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-vocab.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-500">
          {savedVocab.length} word{savedVocab.length !== 1 ? "s" : ""} saved — highlight text and click{" "}
          <span className="font-medium">Save to My Vocab</span> to add more.
        </p>
        <button
          onClick={exportAnki}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export to Anki
        </button>
      </div>

      <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
        {savedVocab.map((item) => (
          <div key={item.word} className="flex items-start gap-3 px-4 py-3 bg-white">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-semibold text-stone-900">{item.word}</span>
                {item.partOfSpeech && (
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 ${
                      posColors[item.partOfSpeech] ?? posColors.other
                    }`}
                  >
                    {item.partOfSpeech}
                  </span>
                )}
                {item.ipaHanoi && (
                  <span className="font-mono text-xs text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                    {item.ipaHanoi}
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-700">{item.definition}</p>
              {item.example && (
                <p className="text-xs text-stone-400 italic mt-0.5">
                  {item.example}
                  {item.exampleTranslation && (
                    <span className="not-italic"> — {item.exampleTranslation}</span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={() => onRemove(item.word)}
              className="shrink-0 text-stone-300 hover:text-red-500 transition-colors mt-0.5"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
