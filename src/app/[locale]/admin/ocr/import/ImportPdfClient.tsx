"use client";

import { useRef, useState } from "react";
import Link from "next/link";

/**
 * Self-originating PDF import. pdf.js rasterizes the PDF entirely in the
 * browser; each page is resolution-clamped + JPEG-compressed here and
 * POSTed one at a time to /api/admin/ocr/import-pdf, which streams it to
 * the `ocr-pages` Storage bucket and rows it into the Supabase `ocr`
 * schema. The raw PDF never leaves the browser; only small page JPEGs
 * are uploaded, so the DB/Storage stay lean.
 */

// Long-edge cap (px). Enough for small Nôm/commentary glyphs; Kandianguji
// gains nothing past this and bigger images just bloat Storage.
const MAX_EDGE = 2200;

const QUALITY: Record<string, number> = {
  smaller: 0.72,
  balanced: 0.85,
  sharp: 0.92,
};

function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("JPEG encode failed"))),
      "image/jpeg",
      quality
    );
  });
}

export default function ImportPdfClient({ locale }: { locale: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [quality, setQuality] = useState<keyof typeof QUALITY>("balanced");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    slug: string;
    pageCount: number;
  } | null>(null);
  const cancelRef = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a PDF file.");
      return;
    }
    const docTitle =
      title.trim() || file.name.replace(/\.pdf$/i, "").trim() || "Untitled PDF";

    cancelRef.current = false;
    setRunning(true);
    setError(null);
    setResult(null);
    setStatus("Loading pdf.js…");

    try {
      const pdfjs: any = await import("pdfjs-dist");
      // Version-pinned worker from unpkg — avoids bundler worker config
      // and is guaranteed to match the installed pdfjs-dist.
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const buf = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjs.getDocument({ data: buf }).promise;
      const total: number = pdf.numPages;
      const q = QUALITY[quality];

      let slug = "";
      for (let n = 1; n <= total; n++) {
        if (cancelRef.current) {
          setStatus(`Cancelled after ${n - 1}/${total} page(s).`);
          break;
        }
        setStatus(`Rendering page ${n}/${total}…`);
        const page = await pdf.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const scale = MAX_EDGE / Math.max(base.width, base.height);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("2D canvas unavailable");
        await page.render({ canvasContext: ctx, viewport }).promise;
        const blob = await canvasToJpeg(canvas, q);
        // Free the bitmap before the next (large) page.
        canvas.width = 0;
        canvas.height = 0;

        setStatus(
          `Uploading page ${n}/${total} (${Math.round(
            blob.size / 1024
          )} KB)…`
        );
        const fd = new FormData();
        fd.append("image", blob, `${n}.jpg`);
        fd.append("pageNumber", String(n));
        fd.append("title", docTitle);
        if (slug) fd.append("slug", slug);
        const res = await fetch("/api/admin/ocr/import-pdf", {
          method: "POST",
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        slug = data.slug;
        setResult({ slug, pageCount: data.pageCount });
      }

      if (!cancelRef.current) {
        setStatus(null);
      }
    } catch (e: any) {
      setError(e?.message || "PDF import failed");
      setStatus(null);
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
      {status && (
        <div className="px-3 py-2 rounded border border-blue-200 bg-blue-50 text-sm text-blue-800">
          {status}
        </div>
      )}
      {result && (
        <div className="px-3 py-2 rounded border border-emerald-300 bg-emerald-50 text-sm text-emerald-800 space-y-1">
          <div>
            <span className="font-semibold">{result.pageCount}</span> page
            {result.pageCount === 1 ? "" : "s"} uploaded as{" "}
            <code className="font-mono">{result.slug}</code> in Supabase.
          </div>
          <div className="pt-1">
            <Link
              href={`/${locale}/admin/ocr/edit/${encodeURIComponent(
                result.slug
              )}`}
              className="text-indigo-700 hover:underline font-medium"
            >
              Open the document dashboard →
            </Link>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          PDF file
        </label>
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
            setError(null);
          }}
          disabled={running}
          className="text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          Rendered in your browser at ≤{MAX_EDGE}px long edge and
          JPEG-compressed before upload — the raw PDF never leaves this
          page.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Title{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="(uses the file name if blank)"
            disabled={running}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Quality
          </label>
          <select
            value={quality}
            onChange={(e) =>
              setQuality(e.target.value as keyof typeof QUALITY)
            }
            disabled={running}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded"
          >
            <option value="smaller">Smaller (q0.72)</option>
            <option value="balanced">Balanced (q0.85)</option>
            <option value="sharp">Sharp (q0.92)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={running || !file}
          className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? "Importing…" : "Import PDF"}
        </button>
        {running && (
          <button
            type="button"
            onClick={() => {
              cancelRef.current = true;
            }}
            className="px-3 py-2 rounded border border-red-300 text-red-700 text-sm hover:bg-red-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
