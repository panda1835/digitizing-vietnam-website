"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, Loader2, X } from "lucide-react";

interface LookupResult {
  word: string;
  ipaHanoi: string;
  ipaSaigon?: string;
  partOfSpeech: string;
  definition: string;
  toneInfo?: string;
  example?: string;
  exampleTranslation?: string;
}

interface PopupState {
  word: string;
  x: number;  // viewport x centre of selection
  y: number;  // viewport y top of selection
  result: LookupResult | null;
  loading: boolean;
  error: string | null;
}

// Module-level cache survives re-renders
const resultCache = new Map<string, LookupResult>();

export default function WordLookupPopup() {
  const [popup, setPopup] = useState<PopupState | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const pendingWord = useRef<string>("");

  const dismiss = useCallback(() => setPopup(null), []);

  const lookup = useCallback(async (word: string, x: number, y: number) => {
    const key = word.toLowerCase();

    if (resultCache.has(key)) {
      setPopup({ word, x, y, result: resultCache.get(key)!, loading: false, error: null });
      return;
    }

    setPopup({ word, x, y, result: null, loading: true, error: null });
    pendingWord.current = word;

    try {
      const res = await fetch("/api/language-lab/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      const data = await res.json();

      // Discard if user has already moved on to a different word
      if (pendingWord.current !== word) return;

      if (data.error) {
        setPopup((prev) => prev && { ...prev, loading: false, error: data.error });
      } else {
        resultCache.set(key, data);
        setPopup((prev) => prev && { ...prev, loading: false, result: data });
      }
    } catch (e: any) {
      if (pendingWord.current === word) {
        setPopup((prev) => prev && { ...prev, loading: false, error: "Lookup failed." });
      }
    }
  }, []);

  // Listen for text selections
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Ignore clicks inside the popup itself
      if (popupRef.current?.contains(e.target as Node)) return;

      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) { dismiss(); return; }

        const word = sel.toString().trim();
        // Only handle short selections that look like Vietnamese (contain diacritics or are simple words)
        if (!word || word.length < 1 || word.length > 60 || word.includes("\n")) {
          dismiss();
          return;
        }

        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;

        lookup(word, x, y);
      }, 10);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [lookup, dismiss]);

  // Dismiss on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dismiss]);

  if (!popup) return null;

  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(popup.word);
    u.lang = "vi-VN";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  // Position popup above the selection, clamped to viewport
  const POPUP_WIDTH = 340;
  const MARGIN = 12;
  let left = popup.x - POPUP_WIDTH / 2;
  left = Math.max(MARGIN, Math.min(left, window.innerWidth - POPUP_WIDTH - MARGIN));
  const top = popup.y - 8; // popup sits above; translateY(-100%) handles upward offset

  return (
    <div
      ref={popupRef}
      className="fixed z-[60] w-[340px] bg-white border border-stone-200 rounded-xl shadow-2xl text-sm"
      style={{ left, top, transform: "translateY(calc(-100% - 8px))" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2 border-b border-stone-100">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-lg font-bold text-stone-900 leading-tight">{popup.word}</span>
          {popup.result?.partOfSpeech && (
            <span className="text-xs bg-stone-100 text-stone-500 rounded-full px-2 py-0.5 shrink-0">
              {popup.result.partOfSpeech}
            </span>
          )}
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-stone-400 hover:text-stone-700 transition-colors mt-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 py-3 space-y-2.5">
        {popup.loading && (
          <div className="flex items-center gap-2 text-stone-400 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Looking up…</span>
          </div>
        )}

        {popup.error && (
          <p className="text-xs text-red-600">{popup.error}</p>
        )}

        {popup.result && (
          <>
            {/* IPA + audio */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {popup.result.ipaHanoi && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-stone-400 shrink-0">Hà Nội</span>
                    <span className="font-mono text-xs text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                      {popup.result.ipaHanoi}
                    </span>
                  </div>
                )}
                <button
                  onClick={speak}
                  title="Play pronunciation"
                  className="ml-auto shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors text-xs font-medium"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Play
                </button>
              </div>
              {popup.result.ipaSaigon && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-stone-400 shrink-0">Sài Gòn</span>
                  <span className="font-mono text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    {popup.result.ipaSaigon}
                  </span>
                </div>
              )}
              {popup.result.toneInfo && (
                <p className="text-xs text-stone-400">{popup.result.toneInfo}</p>
              )}
            </div>

            {/* Definition */}
            <p className="text-stone-700 leading-relaxed">{popup.result.definition}</p>

            {/* Example */}
            {popup.result.example && (
              <div className="pt-1.5 border-t border-stone-100">
                <p className="text-stone-600 italic text-xs">{popup.result.example}</p>
                {popup.result.exampleTranslation && (
                  <p className="text-stone-400 text-xs mt-0.5">{popup.result.exampleTranslation}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
