"use client";

import { useState } from "react";
import InputForm from "@/components/language-lab/InputForm";
import StudyPage from "@/components/language-lab/StudyPage";

export default function GeneratePage() {
  const [result, setResult] = useState(null);

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {!result ? (
          <>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-700 mb-3">
                <span>Vietnamese Language Lab</span>
              </div>
              <h1 className="text-4xl font-bold text-stone-900 mb-3">
                Turn Any Article into a Lesson
              </h1>
              <p className="text-stone-500 text-lg max-w-xl mx-auto leading-relaxed">
                Paste a link to any Vietnamese news article or text, and we'll automatically
                generate vocabulary, grammar notes, and study materials.
              </p>
            </div>

            <InputForm onResult={setResult} />

            <div className="mt-10 text-center">
              <p className="text-xs text-stone-400 mb-3">Try it with articles from:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["VnExpress", "Tuổi Trẻ", "Thanh Niên", "Nhân Dân", "Báo Mới"].map((name) => (
                  <span key={name} className="text-xs px-3 py-1 rounded-full bg-stone-100 text-stone-500">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <StudyPage material={result} onReset={() => setResult(null)} />
        )}
      </div>
    </main>
  );
}
