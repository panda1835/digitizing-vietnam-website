"use client";

/**
 * GrammarPoints.jsx
 */
export function GrammarPoints({ grammarPoints }) {
  return (
    <div className="space-y-4">
      {grammarPoints.map((point, i) => (
        <div key={point.id} className="rounded-xl border border-stone-200 overflow-hidden">
          <div className="flex items-start gap-3 px-4 py-3 bg-stone-50 border-b border-stone-200">
            <span className="shrink-0 w-6 h-6 rounded-full bg-red-700 text-white text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <code className="text-red-800 font-mono font-semibold text-sm">{point.pattern}</code>
          </div>
          <div className="px-4 py-3 space-y-3 text-sm">
            <p className="text-stone-700">{point.explanation}</p>
            {point.exampleFromText && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <p className="text-xs font-medium text-amber-700 mb-1">From the text:</p>
                <p className="text-stone-800 italic">{point.exampleFromText}</p>
              </div>
            )}
            {point.additionalExample && (
              <div>
                <p className="text-xs font-medium text-stone-400 mb-1">Another example:</p>
                <p className="text-stone-700 italic">{point.additionalExample}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * CulturalNotes.jsx
 */
export function CulturalNotes({ culturalNotes }) {
  if (!culturalNotes?.length) return null;
  return (
    <div className="space-y-3">
      {culturalNotes.map((note) => (
        <div key={note.id} className="flex gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <span className="text-emerald-600 text-lg shrink-0">🗺️</span>
          <div className="text-sm">
            <span className="font-semibold text-emerald-900">{note.term}: </span>
            <span className="text-emerald-800">{note.note}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ComprehensionQuestions.jsx
 */
export function ComprehensionQuestions({ questions }) {
  return (
    <div className="space-y-5">
      {questions.map((q, i) => (
        <div key={q.id} className="border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-stone-50 border-b border-stone-200">
            <p className="font-medium text-stone-900 text-sm">
              {i + 1}. {q.question}
            </p>
            {q.questionTranslation && (
              <p className="text-stone-500 text-xs mt-0.5 italic">{q.questionTranslation}</p>
            )}
          </div>
          <div className="px-4 py-3">
            {q.type === "multiple-choice" && q.options?.length > 0 ? (
              <div className="space-y-2">
                {q.options.map((opt, j) => (
                  <label key={j} className="flex items-start gap-2 text-sm text-stone-700 cursor-pointer group">
                    <input type="radio" name={`q-${q.id}`} className="mt-0.5 accent-red-700" />
                    <span className="group-hover:text-stone-900 transition-colors">{opt}</span>
                  </label>
                ))}
                <details className="mt-3">
                  <summary className="text-xs text-red-700 cursor-pointer hover:underline">Show answer</summary>
                  <p className="mt-1.5 text-sm text-stone-700 bg-stone-50 rounded-lg px-3 py-2">{q.answer}</p>
                </details>
              </div>
            ) : (
              <details>
                <summary className="text-xs text-red-700 cursor-pointer hover:underline">Show answer</summary>
                <p className="mt-1.5 text-sm text-stone-700 bg-stone-50 rounded-lg px-3 py-2">{q.answer}</p>
              </details>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
