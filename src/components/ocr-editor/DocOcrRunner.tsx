"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SpatialCharacter, ConfirmedColumn } from "@/lib/ocr-store";
import { detectColumns } from "@/components/ocr-editor/useColumnDetection";
import {
  rerecognizeWithNomNaViet,
  NomNaVietUnavailableError,
} from "@/lib/nomnaviet-ocr";

/**
 * Document-dashboard batch OCR runner — DVN's client-side equivalent of
 * text-search's `nom_ocr_doc_viewer` "Run on missing pages" toolbar.
 *
 * DVN's NNV pass runs in the browser (lib/nomnaviet-ocr), so unlike
 * text-search's Flask SSE this loops pages client-side, reusing the exact
 * blocks the per-page editor uses:
 *   page-image → POST /api/admin/ocr/run (Kandianguji) → detectColumns
 *   → [optional] rerecognizeWithNomNaViet → PUT /api/admin/ocr/edit.
 *
 * Sequential by page (NNV is rate-limited ~1 char/s). Cancel takes effect
 * at the next page boundary — a page mid-NNV can't be interrupted.
 */

type Stage = "kandi" | "kandi+nnv" | "nnv";
type Scope = "missing" | "all";
type PageState = "pending" | "running" | "done" | "error" | "skip";

interface PageInfo {
  pageNumber: number;
  chars: number;
  skipped: boolean;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

export default function DocOcrRunner({
  slug,
  pages,
}: {
  slug: string;
  pages: PageInfo[];
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("kandi+nnv");
  const [scope, setScope] = useState<Scope>("missing");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [current, setCurrent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageState, setPageState] = useState<Record<number, PageState>>({});
  const cancelRef = useRef(false);

  const targets = useMemo(() => {
    const live = pages.filter((p) => !p.skipped);
    if (stage === "nnv") return live.filter((p) => p.chars > 0);
    return scope === "all" ? live : live.filter((p) => p.chars === 0);
  }, [pages, stage, scope]);

  const imageUrl = (page: number) =>
    `/api/admin/ocr/page-image/${encodeURIComponent(slug)}/${page}`;
  const editUrl = (page: number) =>
    `/api/admin/ocr/edit/${encodeURIComponent(slug)}/${page}`;

  async function runKandi(page: number): Promise<{
    spatialData: SpatialCharacter[];
    columns: ConfirmedColumn[];
    imageWidth?: number;
    imageHeight?: number;
  }> {
    const imgRes = await fetch(imageUrl(page));
    if (!imgRes.ok)
      throw new Error(`page image HTTP ${imgRes.status}`);
    const blob = await imgRes.blob();
    const fd = new FormData();
    fd.append("image", blob, "page.jpg");
    const res = await fetch("/api/admin/ocr/run", {
      method: "POST",
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `run HTTP ${res.status}`);
    const sd: SpatialCharacter[] = data.spatialData ?? [];
    const columns: ConfirmedColumn[] = detectColumns(sd, "auto", undefined, {
      surfaceCommentary: true,
    }).map((c) => ({ bbox: c.bbox }));
    return {
      spatialData: sd,
      columns,
      imageWidth:
        typeof data.pageWidth === "number" ? data.pageWidth : undefined,
      imageHeight:
        typeof data.pageHeight === "number" ? data.pageHeight : undefined,
    };
  }

  async function persist(page: number, body: Record<string, unknown>) {
    const res = await fetch(editUrl(page), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || `save HTTP ${res.status}`);
    }
  }

  async function processPage(page: number) {
    let spatialData: SpatialCharacter[] = [];
    let columns: ConfirmedColumn[] | undefined;
    let imageWidth: number | undefined;
    let imageHeight: number | undefined;

    if (stage === "kandi" || stage === "kandi+nnv") {
      const k = await runKandi(page);
      spatialData = k.spatialData;
      columns = k.columns;
      imageWidth = k.imageWidth;
      imageHeight = k.imageHeight;
    } else {
      // NNV-only: load the page's existing glyphs/columns.
      const res = await fetch(editUrl(page));
      if (!res.ok) throw new Error(`load HTTP ${res.status}`);
      const data = await res.json();
      spatialData = data.spatialData ?? [];
      columns = data.columns;
      imageWidth = data.imageWidth;
      imageHeight = data.imageHeight;
      if (spatialData.length === 0)
        throw new Error("no glyphs — run Kandianguji first");
    }

    if (stage === "kandi") {
      await persist(page, { spatialData, columns, imageWidth, imageHeight });
      return;
    }

    // NNV pass (kandi+nnv or nnv).
    const img = await loadImage(imageUrl(page));
    const { spatialData: merged } = await rerecognizeWithNomNaViet(
      img,
      spatialData,
      { concurrency: 1, slotJitterMs: 1000, topK: 9 }
    );
    await persist(page, {
      spatialData: merged,
      ...(columns ? { columns } : {}),
      imageWidth,
      imageHeight,
      nnvCompletedAt: new Date().toISOString(),
    });
  }

  async function run() {
    if (targets.length === 0) return;
    cancelRef.current = false;
    setRunning(true);
    setError(null);
    setDone(0);
    setPageState(
      Object.fromEntries(targets.map((t) => [t.pageNumber, "pending"]))
    );
    let completed = 0;
    try {
      for (const t of targets) {
        if (cancelRef.current) break;
        setCurrent(t.pageNumber);
        setPageState((s) => ({ ...s, [t.pageNumber]: "running" }));
        try {
          await processPage(t.pageNumber);
          setPageState((s) => ({ ...s, [t.pageNumber]: "done" }));
        } catch (e: any) {
          if (e instanceof NomNaVietUnavailableError) {
            setPageState((s) => ({ ...s, [t.pageNumber]: "error" }));
            setError(
              `Nôm Na Việt unavailable on page ${t.pageNumber}: ${e.message}. Stopped.`
            );
            break;
          }
          setPageState((s) => ({ ...s, [t.pageNumber]: "error" }));
          setError(`Page ${t.pageNumber}: ${e.message}`);
          // Continue with remaining pages — one bad page shouldn't abort all.
        }
        completed++;
        setDone(completed);
      }
    } finally {
      setCurrent(null);
      setRunning(false);
      router.refresh(); // refresh the server-rendered status table
    }
  }

  const pill = (st: PageState | undefined) =>
    st === "done"
      ? "bg-branding-brown text-white"
      : st === "running"
      ? "bg-primary-blue text-white animate-pulse"
      : st === "error"
      ? "bg-red-500 text-white"
      : "bg-gray-100 text-gray-500";

  return (
    <div className="border border-gray-200 rounded-md bg-white p-3 mb-4 font-halyard">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm text-gray-700 flex items-center gap-1">
          Pass
          <select
            value={stage}
            disabled={running}
            onChange={(e) => setStage(e.target.value as Stage)}
            className="border border-gray-300 rounded text-sm px-1 py-0.5 disabled:opacity-50"
          >
            <option value="kandi">Kandianguji only (fast)</option>
            <option value="kandi+nnv">Kandianguji + Nôm Na Việt</option>
            <option value="nnv">Nôm Na Việt only (pages with Kandi)</option>
          </select>
        </label>
        {stage !== "nnv" && (
          <label className="text-sm text-gray-700 flex items-center gap-1">
            Scope
            <select
              value={scope}
              disabled={running}
              onChange={(e) => setScope(e.target.value as Scope)}
              className="border border-gray-300 rounded text-sm px-1 py-0.5 disabled:opacity-50"
            >
              <option value="missing">Missing pages (no OCR yet)</option>
              <option value="all">All pages</option>
            </select>
          </label>
        )}
        <span className="text-xs text-gray-500">
          {targets.length} page{targets.length === 1 ? "" : "s"} targeted
        </span>
        {!running ? (
          <button
            onClick={run}
            disabled={targets.length === 0}
            className="ml-auto px-3 py-1.5 rounded text-sm text-white bg-primary-blue hover:bg-[#00124f] disabled:opacity-50"
          >
            Run OCR ▶
          </button>
        ) : (
          <button
            onClick={() => {
              cancelRef.current = true;
            }}
            className="ml-auto px-3 py-1.5 rounded text-sm text-white bg-red-600 hover:bg-red-700"
          >
            Cancel (after current page)
          </button>
        )}
      </div>

      <p className="text-[11px] text-gray-500 mt-2">
        Keep this tab open. Nôm Na Việt is rate-limited (~1 char/sec) —
        expect ~1–3 min per page. Cancel stops at the next page boundary.
      </p>

      {(running || done > 0 || error) && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              {running
                ? current !== null
                  ? `Running page ${current}…`
                  : "Starting…"
                : "Finished"}
            </span>
            <span className="font-mono">
              {done}/{targets.length}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-blue transition-all"
              style={{
                width: `${
                  targets.length
                    ? Math.round((done / targets.length) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {targets.map((t) => (
              <span
                key={t.pageNumber}
                title={`page ${t.pageNumber}: ${
                  pageState[t.pageNumber] ?? "pending"
                }`}
                className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${pill(
                  pageState[t.pageNumber]
                )}`}
              >
                {t.pageNumber}
              </span>
            ))}
          </div>
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
