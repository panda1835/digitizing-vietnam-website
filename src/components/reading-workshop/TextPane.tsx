"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28] as const;
const DEFAULT_FONT_SIZE = 24;
const HIGHLIGHT_DURATION = 8000; // ms before highlight fades out

interface ColumnSection {
  type: "main" | "commentary";
  text: string;
}

interface StructuredColumn {
  index: number;
  isRow: boolean;
  sections: ColumnSection[];
}

interface TextPaneProps {
  slug: string;
  page: number;
  adminPath: string;
  text?: string | null;
  columns?: StructuredColumn[] | null;
  textLoading?: boolean;
  highlightQuery?: string | null;
}

export default function TextPane({ slug, page, adminPath, text, columns, textLoading, highlightQuery }: TextPaneProps) {
  const parentProvided = text !== undefined;
  const [rawText, setRawText] = useState<string | null>(parentProvided ? text : null);
  const [rawColumns, setRawColumns] = useState<StructuredColumn[] | null>(columns ?? null);
  const [loading, setLoading] = useState(parentProvided ? !!textLoading : true);
  const [error, setError] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [showHighlight, setShowHighlight] = useState(!!highlightQuery);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrolledRef = useRef(false);

  // Start fade-out timer when highlight is active
  useEffect(() => {
    if (highlightQuery) {
      setShowHighlight(true);
      scrolledRef.current = false;
      highlightTimerRef.current = setTimeout(() => setShowHighlight(false), HIGHLIGHT_DURATION);
    } else {
      setShowHighlight(false);
    }
    return () => { if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current); };
  }, [highlightQuery, page]);

  // Scroll the first highlighted mark into view
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showHighlight || scrolledRef.current) return;
    const timer = setTimeout(() => {
      const mark = containerRef.current?.querySelector("mark[data-search-hl]");
      if (mark) {
        mark.scrollIntoView({ behavior: "smooth", block: "center" });
        scrolledRef.current = true;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [showHighlight, rawText, rawColumns]);

  useEffect(() => {
    if (parentProvided) {
      setRawText(text);
      setRawColumns(columns ?? null);
      setLoading(!!textLoading);
      setError(false);
    }
  }, [text, columns, textLoading, parentProvided]);

  useEffect(() => {
    if (parentProvided) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`/api/page-text/${encodeURIComponent(slug)}/${page}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) {
          setRawText(data.text ?? null);
          setRawColumns(data.columns ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRawText(null);
          setRawColumns(null);
          setError(true);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [slug, page, parentProvided]);

  /** Wrap occurrences of the query in <mark> tags with fade animation. */
  const highlightText = useCallback(
    (str: string): React.ReactNode => {
      if (!highlightQuery || !showHighlight) return str;
      const query = highlightQuery.toLowerCase();
      const lower = str.toLowerCase();
      const parts: React.ReactNode[] = [];
      let cursor = 0;
      let key = 0;
      while (cursor < lower.length) {
        const idx = lower.indexOf(query, cursor);
        if (idx === -1) {
          parts.push(str.slice(cursor));
          break;
        }
        if (idx > cursor) parts.push(str.slice(cursor, idx));
        parts.push(
          <mark
            key={key++}
            data-search-hl=""
            className="search-highlight-mark"
          >
            {str.slice(idx, idx + highlightQuery.length)}
          </mark>
        );
        cursor = idx + highlightQuery.length;
      }
      return parts.length ? parts : str;
    },
    [highlightQuery, showHighlight]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-branding-brown/40 text-sm font-light select-none">
        Loading…
      </div>
    );
  }

  if (error || rawText === null) {
    return (
      <div className="flex flex-col items-start justify-start p-6 gap-4 h-full">
        <p className="text-branding-black/40 text-sm italic font-light">
          No transcription for this page yet.
        </p>
        <a
          href={adminPath}
          className="text-xs text-branding-brown hover:underline font-light"
        >
          Add via admin OCR panel →
        </a>
      </div>
    );
  }

  const fontControls = (
    <div className="flex items-center gap-1.5 mb-4">
      <span className="text-[10px] text-branding-black/40 uppercase tracking-wider font-light mr-1">Size</span>
      <button
        onClick={() => setFontSize((s) => FONT_SIZES[Math.max(0, FONT_SIZES.indexOf(s as any) - 1)] ?? s)}
        disabled={fontSize <= FONT_SIZES[0]}
        className="w-6 h-6 flex items-center justify-center text-xs rounded border border-[#e1e1de] text-branding-black disabled:opacity-30 hover:border-branding-brown hover:text-branding-brown transition-colors"
      >
        −
      </button>
      <span className="text-xs text-branding-black/50 min-w-[2.5ch] text-center tabular-nums">{fontSize}</span>
      <button
        onClick={() => setFontSize((s) => FONT_SIZES[Math.min(FONT_SIZES.length - 1, FONT_SIZES.indexOf(s as any) + 1)] ?? s)}
        disabled={fontSize >= FONT_SIZES[FONT_SIZES.length - 1]}
        className="w-6 h-6 flex items-center justify-center text-xs rounded border border-[#e1e1de] text-branding-black disabled:opacity-30 hover:border-branding-brown hover:text-branding-brown transition-colors"
      >
        +
      </button>
    </div>
  );

  const highlightStyle = (
    <style>{`
      .search-highlight-mark {
        background: #fbbf24;
        color: inherit;
        border-radius: 2px;
        padding: 0 1px;
        animation: searchHlFade ${HIGHLIGHT_DURATION}ms ease-out forwards;
      }
      @keyframes searchHlFade {
        0%, 60% { background: #fbbf24; }
        100%    { background: transparent; }
      }
    `}</style>
  );

  // Structured column view (OCR documents with commentary detection)
  if (rawColumns && rawColumns.length > 0) {
    return (
      <div ref={containerRef} className="h-full overflow-y-auto p-5">
        {highlightStyle}
        {fontControls}
        <div className="space-y-0" style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }}>
          {rawColumns.map((col) => (
            <div key={col.index} className="font-sans text-branding-black font-light leading-relaxed">
              {col.sections.map((sec, si) => {
                if (!sec.text.trim()) return null;
                const rendered = highlightText(sec.text.replace(/\n/g, ""));
                if (sec.type === "commentary") {
                  return (
                    <span
                      key={si}
                      className="text-amber-800/80 border-b border-amber-200/50"
                      style={{ fontSize: `${Math.round(fontSize * 0.75)}px` }}
                    >
                      {rendered}
                    </span>
                  );
                }
                return <span key={si}>{rendered}</span>;
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback: plain text
  return (
    <div ref={containerRef} className="h-full overflow-y-auto p-5">
      {highlightStyle}
      {fontControls}
      {rawText ? (
        <pre
          className="whitespace-pre-wrap font-sans leading-relaxed text-branding-black break-words font-light"
          style={{ fontSize: `${fontSize}px` }}
        >
          {highlightText(rawText)}
        </pre>
      ) : (
        <p className="text-branding-black/30 text-sm italic font-light">
          This page is blank or has no recognized text.
        </p>
      )}
    </div>
  );
}
