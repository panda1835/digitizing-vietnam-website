"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";

const CompactRadicals = dynamic(
  () => import("@/app/[locale]/tools/han-nom-tools/han-nom-input-method-editor/CompactRadicals"),
  {
    ssr: false,
    loading: () => (
      <div className="text-center py-4 text-[11px] text-branding-black/40 font-light">
        Loading radicals…
      </div>
    ),
  }
);

// ── Script detection ──

function isCJK(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (
    (code >= 0x2e80 && code <= 0x9fff) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0x20000 && code <= 0x2fa1f)
  );
}

function hasHanNom(text: string): boolean {
  return Array.from(text).some(isCJK);
}

// ── Types ──

interface Radical {
  id: number;
  hn: string;
  URN: string;
  strokes: number;
  name: string;
  definition: string;
}

interface ToolsPanelProps {
  selectedText: string;
  documentTitle: string;
  collectionSlug: string;
  documentSlug: string;
  page: number;
  rawText: string | null;
}

export default function ToolsPanel({
  selectedText,
  documentTitle,
  collectionSlug,
  documentSlug,
  page,
  rawText,
}: ToolsPanelProps) {
  const [copied, setCopied] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [corpusQuery, setCorpusQuery] = useState("");

  // Radical lookup state
  const [radicalsOpen, setRadicalsOpen] = useState(false);
  const [radicals, setRadicals] = useState<Radical[]>([]);
  const [radicalsLoaded, setRadicalsLoaded] = useState(false);

  function handleCopy() {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    if (!rawText) return;
    const blob = new Blob([rawText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentSlug}_page_${page}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Lazy-load radicals on first expand
  function handleRadicalsToggle() {
    const opening = !radicalsOpen;
    setRadicalsOpen(opening);
    if (opening && !radicalsLoaded) {
      fetch("/api/radicals")
        .then((r) => r.json())
        .then((data: Radical[]) => {
          setRadicals(data);
          setRadicalsLoaded(true);
        })
        .catch(() => setRadicalsLoaded(true));
    }
  }

  function handleRadicalCharacterSelect(char: string) {
    setLookupQuery(char);
  }

  const citation = `${documentTitle}, p. ${page}. Digitizing Việt Nam. https://digitizingvietnam.com/our-collections/${collectionSlug}/${documentSlug}/reading-workshop?page=${page}`;

  const lookupText = lookupQuery || selectedText;
  const textIsHanNom = lookupText ? hasHanNom(lookupText) : false;

  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col gap-5">
      <h3 className="font-light text-[10px] text-branding-brown uppercase tracking-widest">Tools</h3>

      {/* ── Han-Nom Dictionary Lookup ── */}
      <section className="flex flex-col gap-2">
        <p className="text-xs font-light text-branding-black/60">Han-Nôm Dictionary</p>
        <div className="flex gap-1">
          <input
            type="text"
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            placeholder="Type or select text…"
            className="flex-1 px-2 py-1 text-sm font-light border border-[#e1e1de] rounded bg-white focus:outline-none focus:border-branding-brown transition-colors"
          />
          {lookupQuery && (
            <button
              onClick={() => setLookupQuery("")}
              className="px-2 text-branding-black/40 hover:text-branding-brown text-xs transition-colors"
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>
        {!lookupQuery && !selectedText && (
          <p className="text-[11px] text-branding-black/35 italic font-light">
            Select text in the document or type above
          </p>
        )}
        {lookupText && (
          <div className="mt-1">
            {textIsHanNom ? (
              <>
                <p className="text-[11px] text-branding-black/40 mb-1 font-light">
                  Click a character to look it up:
                </p>
                <LookupableHanNomText text={lookupText} className="text-xl" />
              </>
            ) : (
              <>
                <p className="text-[11px] text-branding-black/40 mb-1 font-light">
                  Selected text (Roman):
                </p>
                <div className="flex flex-wrap gap-1">
                  {lookupText.split(/\s+/).filter(Boolean).map((word, i) => (
                    <button
                      key={i}
                      onClick={() => setLookupQuery(word)}
                      className="px-1.5 py-0.5 text-sm font-light rounded bg-branding-brown/5 text-branding-black/70 hover:bg-branding-brown/15 hover:text-branding-brown border border-transparent hover:border-branding-brown/30 transition-colors"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* ── Radical Lookup ── */}
      <section className="flex flex-col gap-1.5">
        <button
          onClick={handleRadicalsToggle}
          className="flex items-center gap-1.5 text-xs font-light text-branding-black/60 hover:text-branding-brown transition-colors text-left"
        >
          <span className={`text-[9px] transition-transform ${radicalsOpen ? "rotate-90" : ""}`}>▶</span>
          Radical Lookup
        </button>
        {radicalsOpen && (
          <div className="mt-1">
            {radicals.length > 0 ? (
              <CompactRadicals
                radicals={radicals}
                onCharacterSelect={handleRadicalCharacterSelect}
                autoScrollToStroke
              />
            ) : radicalsLoaded ? (
              <p className="text-[11px] text-branding-black/35 italic font-light">
                Could not load radicals.
              </p>
            ) : (
              <p className="text-[11px] text-branding-black/40 font-light">Loading radicals…</p>
            )}
          </div>
        )}
      </section>

      {/* ── Corpus Search ── */}
      <section className="flex flex-col gap-1.5">
        <p className="text-xs font-light text-branding-black/60">Corpus Search</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = (corpusQuery || lookupText || "").trim();
            if (q) window.open(`/en/research/han-nom/search-database?query=${encodeURIComponent(q)}`, "_blank");
          }}
          className="flex gap-1"
        >
          <input
            type="text"
            value={corpusQuery}
            onChange={(e) => setCorpusQuery(e.target.value)}
            placeholder={lookupText ? lookupText : "Search corpus…"}
            className="flex-1 px-2 py-1 text-sm font-light border border-[#e1e1de] rounded bg-white focus:outline-none focus:border-branding-brown transition-colors"
          />
          <button
            type="submit"
            disabled={!(corpusQuery || lookupText)}
            className="px-2 py-1 text-xs font-light rounded bg-branding-brown/10 text-branding-brown border border-branding-brown/20 hover:bg-branding-brown/20 transition-colors disabled:opacity-30"
          >
            Search
          </button>
        </form>
      </section>

      {/* ── Page Text ── */}
      <section className="flex flex-col gap-1.5">
        <p className="text-xs font-light text-branding-black/60">Page Text</p>
        <button
          onClick={handleCopy}
          disabled={!rawText}
          className="px-3 py-1.5 text-xs font-light rounded border border-[#e1e1de] text-branding-black hover:border-branding-brown hover:text-branding-brown disabled:opacity-30 transition-colors"
        >
          {copied ? "Copied!" : "Copy page text"}
        </button>
        <button
          onClick={handleDownload}
          disabled={!rawText}
          className="px-3 py-1.5 text-xs font-light rounded border border-[#e1e1de] text-branding-black hover:border-branding-brown hover:text-branding-brown disabled:opacity-30 transition-colors"
        >
          Download as .txt
        </button>
      </section>

      {/* ── Citation ── */}
      <section className="flex flex-col gap-1.5">
        <p className="text-xs font-light text-branding-black/60">Cite this page</p>
        <textarea
          readOnly
          value={citation}
          rows={4}
          className="text-xs font-light p-2 border border-[#e1e1de] rounded bg-white text-branding-black/70 resize-none focus:outline-none focus:border-branding-brown transition-colors"
        />
      </section>
    </div>
  );
}
