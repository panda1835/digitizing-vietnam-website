"use client";

import { useState } from "react";
import { ExternalLink, BookOpen, AlignLeft, HelpCircle, Globe, ChevronLeft } from "lucide-react";
import VocabList from "./VocabList";
import { GrammarPoints, CulturalNotes, ComprehensionQuestions } from "./StudyComponents";
import WordLookupPopup from "./WordLookupPopup";

const DIFFICULTY_STYLES = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
};

const TABS = [
  { id: "text", label: "Annotated Text", icon: AlignLeft },
  { id: "vocab", label: "Vocabulary", icon: BookOpen },
  { id: "grammar", label: "Grammar", icon: BookOpen },
  { id: "questions", label: "Comprehension", icon: HelpCircle },
];

export default function StudyPage({ material, onReset }) {
  const [activeTab, setActiveTab] = useState("text");

  return (
    <div className="w-full max-w-4xl mx-auto">
      <WordLookupPopup />
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
