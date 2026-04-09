"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AnalysisResult {
  analysis: string;
  title: string;
  pageCount: number;
  textLength: number;
  truncated: boolean;
  focus?: string;
  createdAt?: string;
}

export default function AnalyzeClient({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState("");

  // Load saved analysis on mount
  useEffect(() => {
    fetch(`/api/ocr/analyze/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.analysis) {
          setResult(data);
          if (data.focus) setFocus(data.focus);
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, [slug]);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ocr/analyze/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus: focus.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return <div className="text-sm text-gray-400 py-8">Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href={`/${locale}/reading-workshop`}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          ← Text Lab
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        Text Analysis
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        AI-powered analysis of <span className="font-medium text-gray-700">{result?.title ?? decodeURIComponent(slug)}</span>
      </p>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
            Specific question or focus (optional)
          </label>
          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. What Buddhist traditions does this text reference?"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-400"
            disabled={loading}
            onKeyDown={(e) => { if (e.key === "Enter") handleAnalyze(); }}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {loading ? "Analyzing with Claude..." : result ? "Re-analyze" : "Analyze Document"}
          </button>
          {loading && (
            <p className="text-xs text-gray-400">
              This may take 30-60 seconds depending on document length...
            </p>
          )}
          {result?.createdAt && !loading && (
            <p className="text-xs text-gray-400">
              Last analyzed {new Date(result.createdAt).toLocaleDateString()} at {new Date(result.createdAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{result.pageCount} pages</span>
            <span>{(result.textLength / 1000).toFixed(1)}k characters</span>
            {result.truncated && (
              <span className="text-amber-600">Text was truncated for analysis</span>
            )}
          </div>

          {/* Analysis content */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-6">
              {result.analysis.split(/^### /m).filter(Boolean).map((section, i) => {
                const lines = section.split("\n");
                const title = lines[0]?.trim();
                const body = lines.slice(1).join("\n").trim();
                if (!title) return null;

                const colors: Record<number, string> = {
                  0: "border-blue-400 bg-blue-50",
                  1: "border-indigo-400 bg-indigo-50",
                  2: "border-amber-400 bg-amber-50",
                  3: "border-green-400 bg-green-50",
                  4: "border-purple-400 bg-purple-50",
                  5: "border-rose-400 bg-rose-50",
                };

                return (
                  <div key={i} className={`border-l-4 pl-4 py-3 mb-4 rounded-r-lg ${colors[i] ?? "border-gray-300 bg-gray-50"}`}>
                    <h3 className="text-sm font-bold text-gray-800 mb-2">{title}</h3>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {body}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const blob = new Blob([result.analysis], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `analysis-${slug}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Download analysis as .txt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
