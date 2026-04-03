"use client";

import { useEffect, useState } from "react";

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28] as const;
const DEFAULT_FONT_SIZE = 16;

interface TextPaneProps {
  slug: string;
  page: number;
  adminPath: string;
  /** Pre-fetched text from parent — avoids a duplicate network request */
  text?: string | null;
  /** Whether the parent is still loading the text */
  textLoading?: boolean;
}

export default function TextPane({ slug, page, adminPath, text, textLoading }: TextPaneProps) {
  // Use parent-provided text when available, otherwise fetch independently
  const parentProvided = text !== undefined;
  const [rawText, setRawText] = useState<string | null>(parentProvided ? text : null);
  const [loading, setLoading] = useState(parentProvided ? !!textLoading : true);
  const [error, setError] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);

  // Sync from parent when it provides text
  useEffect(() => {
    if (parentProvided) {
      setRawText(text);
      setLoading(!!textLoading);
      setError(false);
    }
  }, [text, textLoading, parentProvided]);

  // Only fetch independently when parent doesn't provide text
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
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRawText(null);
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug, page, parentProvided]);

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

  return (
    <div className="h-full overflow-y-auto p-5">
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
      <pre
        className="whitespace-pre-wrap font-sans leading-relaxed text-branding-black break-words font-light"
        style={{ fontSize: `${fontSize}px` }}
      >
        {rawText}
      </pre>
    </div>
  );
}
