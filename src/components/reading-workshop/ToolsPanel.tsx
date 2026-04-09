"use client";

import { useState, useCallback } from "react";
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

interface DocSearchResult {
  page: number;
  snippet: string;
  matchCount: number;
}

interface CorpusSearchResult {
  work: string;
  location: string;
  slug: string;
  page?: number | null;
  text: string;
  type: "han" | "nom" | "qn";
  externalPath?: string;
  book?: string;
  topic?: number | null;
  line?: string;
}

interface ToolsPanelProps {
  selectedText: string;
  documentTitle: string;
  collectionSlug: string;
  documentSlug: string;
  page: number;
  rawText: string | null;
  onNavigateToPage?: (page: number, query?: string) => void;
}

export default function ToolsPanel({
  selectedText,
  documentTitle,
  collectionSlug,
  documentSlug,
  page,
  rawText,
  onNavigateToPage,
}: ToolsPanelProps) {
  const [copied, setCopied] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");

  // Radical lookup state
  const [radicalsOpen, setRadicalsOpen] = useState(false);
  const [radicals, setRadicals] = useState<Radical[]>([]);
  const [radicalsLoaded, setRadicalsLoaded] = useState(false);

  // Document search state
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [docSearchResults, setDocSearchResults] = useState<DocSearchResult[]>([]);
  const [docSearchLoading, setDocSearchLoading] = useState(false);

  // Corpus search state
  const [corpusQuery, setCorpusQuery] = useState("");
  const [corpusResults, setCorpusResults] = useState<CorpusSearchResult[]>([]);
  const [corpusLoading, setCorpusLoading] = useState(false);

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

  // Document search
  const handleDocSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setDocSearchResults([]); return; }
    setDocSearchLoading(true);
    try {
      const res = await fetch(`/api/ocr/search/${encodeURIComponent(documentSlug)}?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setDocSearchResults(data.results ?? []);
    } catch {
      setDocSearchResults([]);
    } finally {
      setDocSearchLoading(false);
    }
  }, [documentSlug]);

  // Corpus search
  const handleCorpusSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setCorpusResults([]); return; }
    setCorpusLoading(true);
    try {
      const res = await fetch(`/api/research/han-nom/search-database?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setCorpusResults(Array.isArray(data) ? data : []);
    } catch {
      setCorpusResults([]);
    } finally {
      setCorpusLoading(false);
    }
  }, []);

  function highlightSnippet(snippet: string, query: string) {
    const lower = snippet.toLowerCase();
    const qLower = query.toLowerCase();
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    let key = 0;
    while (cursor < lower.length) {
      const idx = lower.indexOf(qLower, cursor);
      if (idx === -1) { parts.push(snippet.slice(cursor)); break; }
      if (idx > cursor) parts.push(snippet.slice(cursor, idx));
      parts.push(<mark key={key++} className="bg-amber-200/80 rounded-sm px-px">{snippet.slice(idx, idx + query.length)}</mark>);
      cursor = idx + query.length;
    }
    return parts;
  }

  const citation = `${documentTitle}, p. ${page}. Digitizing Việt Nam. https://digitizingvietnam.com/our-collections/${collectionSlug}/${documentSlug}/reading-workshop?page=${page}`;
  const lookupText = lookupQuery || selectedText;
  const textIsHanNom = lookupText ? hasHanNom(lookupText) : false;

  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col gap-5">
      <h3 className="font-light text-[10px] text-branding-brown uppercase tracking-widest">Tools</h3>

      {/* ── Document Search ── */}
      <section className="flex flex-col gap-2">
        <p className="text-xs font-light text-branding-black/60">Search Document</p>
        <form
          onSubmit={(e) => { e.preventDefault(); handleDocSearch(docSearchQuery); }}
          className="flex gap-1"
        >
          <input
            type="text"
            value={docSearchQuery}
            onChange={(e) => setDocSearchQuery(e.target.value)}
            placeholder="Search this document…"
            className="flex-1 px-2 py-1 text-sm font-light border border-[#e1e1de] rounded bg-white focus:outline-none focus:border-branding-brown transition-colors"
          />
          <button
            type="submit"
            disabled={!docSearchQuery.trim() || docSearchLoading}
            className="px-2 py-1 text-xs font-light rounded bg-branding-brown/10 text-branding-brown border border-branding-brown/20 hover:bg-branding-brown/20 transition-colors disabled:opacity-30"
          >
            {docSearchLoading ? "…" : "Go"}
          </button>
        </form>
        {docSearchResults.length > 0 && (
          <div className="flex flex-col gap-1 mt-1 max-h-[200px] overflow-y-auto">
            <p className="text-[10px] text-branding-black/40 font-light">
              {docSearchResults.length} page{docSearchResults.length !== 1 ? "s" : ""} with matches
            </p>
            {docSearchResults.map((r) => (
              <button
                key={r.page}
                onClick={() => onNavigateToPage?.(r.page, docSearchQuery)}
                className="text-left px-2 py-1.5 rounded border border-[#e1e1de] hover:border-branding-brown/40 hover:bg-branding-brown/5 transition-colors"
              >
                <span className="text-[10px] text-branding-brown font-medium">
                  Page {r.page}
                </span>
                {r.matchCount > 1 && (
                  <span className="text-[9px] text-branding-black/40 ml-1">
                    ({r.matchCount} matches)
                  </span>
                )}
                <p className="text-[11px] text-branding-black/60 font-light mt-0.5 line-clamp-2">
                  {highlightSnippet(r.snippet, docSearchQuery)}
                </p>
              </button>
            ))}
          </div>
        )}
        {!docSearchLoading && docSearchResults.length === 0 && docSearchQuery.trim() && (
          <p className="text-[11px] text-branding-black/35 italic font-light">No matches found.</p>
        )}
      </section>

      {/* ── Corpus Search ── */}
      <section className="flex flex-col gap-2">
        <p className="text-xs font-light text-branding-black/60">Corpus Search</p>
        <form
          onSubmit={(e) => { e.preventDefault(); handleCorpusSearch(corpusQuery); }}
          className="flex gap-1"
        >
          <input
            type="text"
            value={corpusQuery}
            onChange={(e) => setCorpusQuery(e.target.value)}
            placeholder="Search entire corpus…"
            className="flex-1 px-2 py-1 text-sm font-light border border-[#e1e1de] rounded bg-white focus:outline-none focus:border-branding-brown transition-colors"
          />
          <button
            type="submit"
            disabled={!corpusQuery.trim() || corpusLoading}
            className="px-2 py-1 text-xs font-light rounded bg-branding-brown/10 text-branding-brown border border-branding-brown/20 hover:bg-branding-brown/20 transition-colors disabled:opacity-30"
          >
            {corpusLoading ? "…" : "Search"}
          </button>
        </form>
        {corpusLoading && (
          <p className="text-[11px] text-branding-black/40 font-light">Searching…</p>
        )}
        {!corpusLoading && corpusResults.length === 0 && corpusQuery.trim() && (
          <p className="text-[11px] text-branding-black/35 italic font-light">No results found.</p>
        )}
        {corpusResults.length > 0 && (
          <div className="flex flex-col gap-1 mt-1 max-h-[250px] overflow-y-auto">
            <p className="text-[10px] text-branding-black/40 font-light">
              {corpusResults.length} result{corpusResults.length !== 1 ? "s" : ""}
            </p>
            {corpusResults.map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  if (r.externalPath) {
                    const url = new URL(r.externalPath, window.location.origin);
                    if (r.page) url.searchParams.set("page", r.page.toString());
                    if (r.book) url.searchParams.set("book", r.book);
                    if (r.topic) url.searchParams.set("topic", r.topic.toString());
                    if (r.line) url.searchParams.set("line", r.line);
                    if (corpusQuery) url.searchParams.set("q", corpusQuery);
                    window.open(`${url.pathname}${url.search}`, "_blank");
                  }
                }}
                className="text-left px-2 py-1.5 rounded border border-[#e1e1de] hover:border-branding-brown/40 hover:bg-branding-brown/5 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-branding-brown font-medium truncate">
                    {r.work}
                  </span>
                  <span className="text-[9px] text-branding-black/40 flex-shrink-0">
                    {r.location}
                  </span>
                  <span className={`text-[8px] px-1 rounded-full flex-shrink-0 ${
                    r.type === "han" ? "bg-red-50 text-red-600" : r.type === "nom" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                  }`}>
                    {r.type === "han" ? "Hán" : r.type === "nom" ? "Nôm" : "QN"}
                  </span>
                </div>
                <p
                  className="text-[11px] text-branding-black/60 font-light mt-0.5 line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: r.text }}
                />
              </button>
            ))}
          </div>
        )}
      </section>

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
          Download page as .txt
        </button>
        <button
          onClick={() => {
            const a = document.createElement("a");
            a.href = `/api/ocr/download/${encodeURIComponent(documentSlug)}`;
            a.click();
          }}
          className="px-3 py-1.5 text-xs font-light rounded border border-[#e1e1de] text-branding-black hover:border-branding-brown hover:text-branding-brown transition-colors"
        >
          Download entire document .txt
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
