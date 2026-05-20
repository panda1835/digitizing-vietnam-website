"use client";

import { useRef, useState } from "react";
import type { SpatialCharacter } from "@/lib/ocr-store";
import { cropBboxToPixelArray } from "@/lib/nomnaviet-ocr";

/**
 * Document-level exports, shared by the Edit Documents list and the
 * per-document OCR browser. Replaces the per-page editor's "Download
 * .txt" / "Export training data" buttons so a single click covers the
 * whole document.
 *
 *  - .txt          → links to the server route (assembles every page's
 *                     reading-order text). One request, no client work.
 *  - Training data → client loop over every page: pull the saved glyphs
 *                     (the edit GET route) + the page image, crop each
 *                     bbox, emit one JSONL line per glyph. Identical
 *                     schema to the old per-page export, just whole-doc
 *                     with `page` per line. Progress + cancel because a
 *                     large document means N page images.
 */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DocExportButtons({
  slug,
  pageCount,
  compact = false,
}: {
  slug: string;
  pageCount: number;
  /** Tighter styling for the Edit Documents list rows. */
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; chars: number }>({
    done: 0,
    chars: 0,
  });
  const [msg, setMsg] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const enc = encodeURIComponent(slug);
  const btn = compact
    ? "px-2 py-0.5 text-[11px] rounded border"
    : "px-3 py-1.5 text-sm rounded border";
  const neutral =
    "border-gray-300 text-gray-700 bg-white hover:border-primary-blue hover:text-primary-blue disabled:opacity-50";

  async function exportTraining() {
    setBusy(true);
    setMsg(null);
    cancelRef.current = false;
    const lines: string[] = [];
    let chars = 0;
    try {
      for (let p = 1; p <= pageCount; p++) {
        if (cancelRef.current) break;
        setProgress({ done: p - 1, chars });
        let data: { spatialData?: SpatialCharacter[] };
        try {
          const r = await fetch(
            `/api/admin/ocr/edit/${enc}/${p}`
          );
          if (!r.ok) continue; // page may not exist / no data — skip
          data = await r.json();
        } catch {
          continue;
        }
        const sd = data.spatialData ?? [];
        if (sd.length === 0) continue;

        let img: HTMLImageElement;
        try {
          img = await loadImage(`/api/admin/ocr/page-image/${enc}/${p}`);
        } catch {
          setMsg(`Page ${p}: image unavailable — skipped`);
          continue;
        }
        for (const c of sd) {
          if (!c.bbox || c.bbox.length < 4) continue;
          if (c.uncertain) continue;
          if (!c.text || c.text.trim().length === 0) continue;
          const pixels = await cropBboxToPixelArray(img, c.bbox, 0.1);
          lines.push(
            JSON.stringify({
              pixels,
              label: c.text,
              source: "admin-edit",
              slug,
              page: p,
              offset: c.offset,
              ...(c.ids ? { ids: c.ids } : {}),
              ...(c.noReadingForm ? { noReadingForm: true } : {}),
            })
          );
          chars++;
        }
        setProgress({ done: p, chars });
      }
      if (lines.length === 0) {
        setMsg(
          cancelRef.current
            ? "Cancelled — nothing exported."
            : "No eligible glyphs to export."
        );
        return;
      }
      download(
        `${slug}-training.jsonl`,
        new Blob([lines.join("\n") + "\n"], {
          type: "application/x-ndjson",
        })
      );
      setMsg(
        `${cancelRef.current ? "Cancelled — partial. " : ""}Exported ${
          lines.length
        } glyph${lines.length === 1 ? "" : "s"}.`
      );
    } catch (e: any) {
      setMsg(`Export failed: ${e?.message ?? "unknown"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`flex items-center gap-2 ${
        compact ? "text-[11px]" : "text-sm"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <a
        href={`/api/admin/ocr/export-txt/${enc}`}
        download={`${slug}.txt`}
        className={`${btn} ${neutral} no-underline`}
        title="Download the whole document as reading-order plain text"
      >
        .txt
      </a>
      {!busy ? (
        <button
          type="button"
          onClick={exportTraining}
          className={`${btn} ${neutral}`}
          title="Export per-glyph training data (image crop + label) for every page"
        >
          Training data
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            cancelRef.current = true;
          }}
          className={`${btn} border-red-300 text-red-700 bg-white hover:bg-red-50`}
        >
          Cancel ({progress.done}/{pageCount}, {progress.chars})
        </button>
      )}
      {msg && (
        <span className="text-gray-500" title={msg}>
          {msg}
        </span>
      )}
    </div>
  );
}
