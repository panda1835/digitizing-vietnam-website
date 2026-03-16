"use client";

/**
 * InputForm.jsx
 * The entry point for the Language Lab — lets users paste a URL or raw text.
 */

import { useState } from "react";
import { Loader2, Link2, FileText } from "lucide-react";

const TABS = [
  { id: "url", label: "From URL", icon: Link2 },
  { id: "text", label: "Paste Text", icon: FileText },
];

export default function InputForm({ onResult }) {
  const [tab, setTab] = useState("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const body = tab === "url" ? { url } : { text };

    try {
      const res = await fetch("/api/language-lab/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      onResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = tab === "url" ? url.trim().length > 0 : text.trim().length > 50;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tab switcher */}
      <div className="flex border-b border-stone-200 mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? "border-red-700 text-red-700"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {tab === "url" ? (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Vietnamese article URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://vnexpress.net/..."
              className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-stone-900 placeholder:text-stone-400 text-sm"
            />
            <p className="mt-1.5 text-xs text-stone-400">
              Paste a link from VnExpress, Tuổi Trẻ, Thanh Niên, or any Vietnamese news site.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Vietnamese text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Dán văn bản tiếng Việt vào đây…"
              rows={8}
              className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-stone-900 placeholder:text-stone-400 text-sm resize-y"
            />
            <p className="mt-1.5 text-xs text-stone-400">
              {text.length} characters — minimum 50 required.
            </p>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-red-700 hover:bg-red-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating study material…
            </>
          ) : (
            "Generate Study Material"
          )}
        </button>
      </form>
    </div>
  );
}
