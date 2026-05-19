"use client";

import { useState } from "react";
import Link from "next/link";

interface IiifResult {
  slug: string;
  pageCount: number;
}

/**
 * Self-originating IIIF import: paste a IIIF Presentation manifest URL →
 * creates a document + blank pages in the Supabase `ocr` schema (no OCR
 * data; OCR is run per-page in the editor afterward). Distinct from the
 * zip importer, which ingests pre-OCR'd data into the filesystem store.
 */
export default function ImportIiifClient({ locale }: { locale: string }) {
  const [manifestUrl, setManifestUrl] = useState("");
  const [title, setTitle] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IiifResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manifestUrl.trim()) {
      setError("A IIIF manifest URL is required.");
      return;
    }
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/ocr/import-iiif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manifestUrl: manifestUrl.trim(),
          ...(title.trim() ? { title: title.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data as IiifResult);
    } catch (e: any) {
      setError(e.message || "Import failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-3 py-2 rounded border border-red-300 bg-red-50 text-sm text-red-800">
          {error}
        </div>
      )}
      {result && (
        <div className="px-3 py-2 rounded border border-emerald-300 bg-emerald-50 text-sm text-emerald-800 space-y-1">
          <div>
            Created{" "}
            <span className="font-semibold">{result.pageCount}</span> blank
            page{result.pageCount === 1 ? "" : "s"} as{" "}
            <code className="font-mono">{result.slug}</code> in Supabase.
          </div>
          <div className="pt-1">
            <Link
              href={`/${locale}/admin/ocr/edit/${encodeURIComponent(
                result.slug
              )}/1`}
              className="text-indigo-700 hover:underline font-medium"
            >
              Open page 1 in the editor →
            </Link>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          IIIF manifest URL
        </label>
        <input
          type="url"
          value={manifestUrl}
          onChange={(e) => setManifestUrl(e.target.value)}
          placeholder="https://dlc.library.columbia.edu/iiif/3/presentation/…/manifest"
          disabled={running}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded font-mono"
        />
        <p className="mt-1 text-xs text-gray-500">
          Presentation API 2 or 3. Pages are created blank with the
          resolved image URL — run OCR per page in the editor.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Title <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="(uses the manifest label if blank)"
          disabled={running}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded"
        />
      </div>

      <button
        type="submit"
        disabled={running || !manifestUrl.trim()}
        className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {running ? "Importing…" : "Create from manifest"}
      </button>
    </form>
  );
}
