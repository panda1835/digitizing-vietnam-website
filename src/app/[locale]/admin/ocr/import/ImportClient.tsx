"use client";

import { useState } from "react";
import Link from "next/link";

type Mode = "zip" | "iiif";

interface ImportResult {
  slug: string;
  pageCount: number;
  imagesFromZip: number;
  imagesFromIiif: number;
  skipped: number;
}

export default function ImportClient({ locale }: { locale: string }) {
  const [mode, setMode] = useState<Mode>("zip");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [manifestUrl, setManifestUrl] = useState("");
  const [slugOverride, setSlugOverride] = useState("");
  const [titleOverride, setTitleOverride] = useState("");

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!zipFile) {
      setError("Please pick a zip file.");
      return;
    }
    if (mode === "iiif" && !manifestUrl.trim()) {
      setError("IIIF manifest URL is required for the IIIF flow.");
      return;
    }
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("mode", mode);
      fd.append("zip", zipFile);
      if (mode === "iiif") fd.append("manifestUrl", manifestUrl.trim());
      if (slugOverride.trim()) fd.append("slug", slugOverride.trim());
      if (titleOverride.trim()) fd.append("title", titleOverride.trim());
      const res = await fetch("/api/admin/ocr/import", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as ImportResult;
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Import failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="px-3 py-2 rounded border border-red-300 bg-red-50 text-sm text-red-800">
          {error}
        </div>
      )}
      {result && (
        <div className="px-3 py-2 rounded border border-emerald-300 bg-emerald-50 text-sm text-emerald-800 space-y-1">
          <div>
            Imported{" "}
            <span className="font-semibold">{result.pageCount}</span> page
            {result.pageCount === 1 ? "" : "s"} as{" "}
            <code className="font-mono">{result.slug}</code>.
          </div>
          <div className="text-xs">
            Images from zip: {result.imagesFromZip} · Images from IIIF:{" "}
            {result.imagesFromIiif}
            {result.skipped > 0 && ` · Skipped (no image): ${result.skipped}`}
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

      <fieldset className="border border-gray-200 rounded px-3 py-2">
        <legend className="text-xs font-medium text-gray-700 px-1">
          Source
        </legend>
        <div className="space-y-1.5 text-sm">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="zip"
              checked={mode === "zip"}
              onChange={() => setMode("zip")}
              disabled={running}
              className="mt-1"
            />
            <span>
              <span className="font-medium">Zip with images + JSONs</span>
              <span className="block text-xs text-gray-500">
                A zipped <code>data/documents/&lt;slug&gt;/</code> folder
                from the Nôm OCR Training tool. Self-contained — page
                images and per-page JSONs are both inside the zip.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="iiif"
              checked={mode === "iiif"}
              onChange={() => setMode("iiif")}
              disabled={running}
              className="mt-1"
            />
            <span>
              <span className="font-medium">JSONs + IIIF manifest URL</span>
              <span className="block text-xs text-gray-500">
                Zip contains the per-page JSONs only; page images are
                downloaded from a IIIF Presentation manifest you supply.
                Useful when JSONs were exported separately and the source
                images live behind a IIIF endpoint.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Zip file
        </label>
        <input
          type="file"
          accept=".zip,application/zip"
          onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
          disabled={running}
          className="text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          Expected layout: <code>manifest.json</code> at the root or in a
          single top-level directory, plus{" "}
          <code>pages/001.json, pages/001.png, pages/002.json, …</code>
        </p>
      </div>

      {mode === "iiif" && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            IIIF manifest URL
          </label>
          <input
            type="url"
            value={manifestUrl}
            onChange={(e) => setManifestUrl(e.target.value)}
            placeholder="https://dlc.library.columbia.edu/iiif/3/presentation/10.7916/d8-…/manifest"
            disabled={running}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded font-mono"
          />
        </div>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
          Optional: override slug / title
        </summary>
        <div className="mt-2 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={slugOverride}
              onChange={(e) => setSlugOverride(e.target.value)}
              placeholder="(auto-derived from title if blank)"
              disabled={running}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={titleOverride}
              onChange={(e) => setTitleOverride(e.target.value)}
              placeholder="(uses manifest title from zip if blank)"
              disabled={running}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>
      </details>

      <div>
        <button
          type="submit"
          disabled={running || !zipFile}
          className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? "Importing…" : "Import"}
        </button>
      </div>
    </form>
  );
}
