"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28] as const;
const DEFAULT_FONT_SIZE = 24;
const HIGHLIGHT_DURATION = 8000; // ms before highlight fades out
const CONFIDENCE_THRESHOLD = 0.85; // chars below this get an underline tint

interface SectionChar {
  text: string;
  confidence: number;
  hasBbox: boolean;
}

interface ColumnSection {
  type: "main" | "commentary";
  text: string;
  chars?: SectionChar[];
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
  pageAvgConfidence?: number | null;
}

/** Map an OCR confidence score to an underline color (lower = redder). */
function confidenceTint(c: number): string {
  if (c >= CONFIDENCE_THRESHOLD) return "transparent";
  // Ramp from amber at threshold down to red at 0.5 and below.
  const t = Math.max(0, Math.min(1, (CONFIDENCE_THRESHOLD - c) / (CONFIDENCE_THRESHOLD - 0.5)));
  // amber #f59e0b → red #dc2626
  const r = Math.round(0xf5 + (0xdc - 0xf5) * t);
  const g = Math.round(0x9e + (0x26 - 0x9e) * t);
  const b = Math.round(0x0b + (0x26 - 0x0b) * t);
  return `rgb(${r},${g},${b})`;
}

/** Color-grade for the avg-confidence badge text. */
function avgConfidenceClass(avg: number): string {
  if (avg >= 0.9) return "text-emerald-600";
  if (avg >= 0.75) return "text-amber-600";
  return "text-red-600";
}

export default function TextPane({ slug, page, adminPath, text, columns, textLoading, highlightQuery, pageAvgConfidence: pageAvgConfidenceProp }: TextPaneProps) {
  const parentProvided = text !== undefined;
  const [rawText, setRawText] = useState<string | null>(parentProvided ? text : null);
  const [rawColumns, setRawColumns] = useState<StructuredColumn[] | null>(columns ?? null);
  const [pageAvgConfidence, setPageAvgConfidence] = useState<number | null>(pageAvgConfidenceProp ?? null);
  const [loading, setLoading] = useState(parentProvided ? !!textLoading : true);
  const [error, setError] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [showConfidence, setShowConfidence] = useState(true);
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
      setPageAvgConfidence(pageAvgConfidenceProp ?? null);
      setLoading(!!textLoading);
      setError(false);
    }
  }, [text, columns, textLoading, parentProvided, pageAvgConfidenceProp]);

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
          setPageAvgConfidence(typeof data.pageAvgConfidence === "number" ? data.pageAvgConfidence : null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRawText(null);
          setRawColumns(null);
          setPageAvgConfidence(null);
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

  const hasPerCharData = !!rawColumns?.some((col) => col.sections.some((s) => s.chars && s.chars.length > 0));
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

      {hasPerCharData && (
        <button
          onClick={() => setShowConfidence((v) => !v)}
          title={showConfidence ? "Hide low-confidence marks" : "Show low-confidence marks"}
          className={`ml-3 px-2 h-6 flex items-center text-[10px] font-light rounded border transition-colors ${
            showConfidence
              ? "border-amber-300 text-amber-700 bg-amber-50/50"
              : "border-[#e1e1de] text-branding-black/50 hover:border-branding-brown hover:text-branding-brown"
          }`}
        >
          {showConfidence ? "Conf ✓" : "Conf"}
        </button>
      )}

      {pageAvgConfidence != null && (
        <span className={`ml-auto text-[11px] font-light tabular-nums ${avgConfidenceClass(pageAvgConfidence)}`}>
          Avg: {Math.round(pageAvgConfidence * 100)}%
        </span>
      )}
    </div>
  );

  /** Render a section's chars with confidence-based underlines. */
  const renderCharsWithConfidence = (chars: SectionChar[], keyPrefix: string): React.ReactNode => {
    return chars.map((c, i) => {
      const tint = c.hasBbox ? confidenceTint(c.confidence) : "transparent";
      if (tint === "transparent") return <span key={`${keyPrefix}-${i}`}>{c.text}</span>;
      return (
        <span
          key={`${keyPrefix}-${i}`}
          style={{ borderBottom: `2px solid ${tint}` }}
          title={`Confidence: ${Math.round(c.confidence * 100)}%`}
        >
          {c.text}
        </span>
      );
    });
  };

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
    // Use per-char rendering when we have confidence data and the toggle is on,
    // AND no search-highlight is active (search-mark would conflict with per-char spans).
    const usePerCharRender = hasPerCharData && showConfidence && !(highlightQuery && showHighlight);
    return (
      <div ref={containerRef} className="h-full overflow-y-auto p-5">
        {highlightStyle}
        {fontControls}
        <div className="space-y-0" style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }}>
          {rawColumns.map((col) => (
            <div key={col.index} className="font-sans text-branding-black font-light leading-relaxed">
              {col.sections.map((sec, si) => {
                if (!sec.text.trim()) return null;
                let rendered: React.ReactNode;
                if (usePerCharRender && sec.chars && sec.chars.length > 0) {
                  const visibleChars = sec.chars.filter((c) => c.text !== "\n");
                  rendered = renderCharsWithConfidence(visibleChars, `${col.index}-${si}`);
                } else {
                  rendered = highlightText(sec.text.replace(/\n/g, ""));
                }
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
