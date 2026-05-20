"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { SpatialCharacter, ConfirmedColumn } from "@/lib/ocr-store";
import { detectColumns } from "@/components/ocr-editor/useColumnDetection";
import {
  rerecognizeWithNomNaViet,
  NomNaVietUnavailableError,
} from "@/lib/nomnaviet-ocr";

/**
 * Document-dashboard batch OCR runner — DVN's client-side port of
 * text-search's `nom_ocr_doc_viewer` parallel batch (app.py
 * `run_pipeline_batch`).
 *
 * Pipelined: Kandianguji is a *producer* that races ahead page-by-page;
 * Nôm Na Việt is a *consumer* that picks up each page once its Kandi
 * pass has persisted. They are independent except NNV needs Kandi for a
 * page first — so Kandi never waits for the (much slower, rate-limited)
 * NNV pass. Each pipeline has its own progress: Kandi by page; NNV by
 * page *and* per-char within the page it's on.
 *
 * All client-side (DVN's NNV runs in the browser), reusing the exact
 * blocks the per-page editor uses:
 *   page-image → POST /api/admin/ocr/run → detectColumns → PUT   (Kandi)
 *   rerecognizeWithNomNaViet → PUT (+nnvCompletedAt)             (NNV)
 *
 * Cancel halts the producer immediately and the consumer at the next
 * page boundary (a page mid-NNV can't be interrupted).
 */

type Stage = "kandi" | "kandi+nnv" | "nnv";
type Scope = "missing" | "all";
type PState = "pending" | "running" | "done" | "error";

interface PageInfo {
  pageNumber: number;
  chars: number;
  skipped: boolean;
  nnvDone: boolean;
}

/** A page handed from the Kandi producer to the NNV consumer. */
interface QItem {
  page: number;
  needsLoad: boolean; // true = pre-seeded (Kandi already done elsewhere)
  spatialData?: SpatialCharacter[];
  imageWidth?: number;
  imageHeight?: number;
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  const [error, setError] = useState<string | null>(null);

  // Independent progress for each pipeline.
  const [kandi, setKandi] = useState({
    total: 0,
    done: 0,
    current: null as number | null,
    state: {} as Record<number, PState>,
  });
  const [nnv, setNnv] = useState({
    total: 0,
    done: 0,
    current: null as number | null,
    charDone: 0,
    charTotal: 0,
    state: {} as Record<number, PState>,
  });

  const cancelRef = useRef(false);
  const queueRef = useRef<QItem[]>([]);
  const producerDoneRef = useRef(false);

  // Plan preview (also drives the run).
  const plan = useMemo(() => {
    const live = pages.filter((p) => !p.skipped);
    if (stage === "nnv") {
      // "missing" (default) = pages with Kandi glyphs that NNV hasn't
      // covered yet — i.e. resume, don't restart from page 1. "all" =
      // deliberately re-run NNV over every page with glyphs. (Without
      // the !nnvDone filter this re-OCR'd already-finished pages.)
      const nnvSeed =
        scope === "all"
          ? live.filter((p) => p.chars > 0)
          : live.filter((p) => p.chars > 0 && !p.nnvDone);
      return { kandiPages: [] as number[], nnvSeed };
    }
    const kandiPages =
      scope === "all"
        ? live
        : live.filter((p) => p.chars === 0);
    const kandiSet = new Set(kandiPages.map((p) => p.pageNumber));
    // Pages Kandi already covered but NNV hasn't — go straight to NNV
    // (mirrors text-search's nnv_only_pages pre-seed).
    const nnvSeed =
      stage === "kandi+nnv"
        ? live.filter(
            (p) =>
              !kandiSet.has(p.pageNumber) && p.chars > 0 && !p.nnvDone
          )
        : [];
    return { kandiPages: kandiPages.map((p) => p.pageNumber), nnvSeed };
  }, [pages, stage, scope]);

  const kandiPlan = plan.kandiPages;
  const nnvPlanCount =
    stage === "kandi" ? 0 : kandiPlan.length + plan.nnvSeed.length;

  const imageUrl = (page: number) =>
    `/api/admin/ocr/page-image/${encodeURIComponent(slug)}/${page}`;
  const editUrl = (page: number) =>
    `/api/admin/ocr/edit/${encodeURIComponent(slug)}/${page}`;

  async function runKandi(page: number): Promise<QItem> {
    const imgRes = await fetch(imageUrl(page));
    if (!imgRes.ok) throw new Error(`page image HTTP ${imgRes.status}`);
    const blob = await imgRes.blob();
    const fd = new FormData();
    fd.append("image", blob, "page.jpg");
    const res = await fetch("/api/admin/ocr/run", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `run HTTP ${res.status}`);
    const sd: SpatialCharacter[] = data.spatialData ?? [];
    const columns: ConfirmedColumn[] = detectColumns(sd, "auto", undefined, {
      surfaceCommentary: true,
    }).map((c) => ({ bbox: c.bbox }));
    const imageWidth =
      typeof data.pageWidth === "number" ? data.pageWidth : undefined;
    const imageHeight =
      typeof data.pageHeight === "number" ? data.pageHeight : undefined;
    await persist(page, { spatialData: sd, columns, imageWidth, imageHeight });
    return { page, needsLoad: false, spatialData: sd, imageWidth, imageHeight };
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

  // ── Producer: Kandi, page by page, racing ahead ──────────────────────
  async function producer() {
    for (const page of kandiPlan) {
      if (cancelRef.current) break;
      setKandi((k) => ({
        ...k,
        current: page,
        state: { ...k.state, [page]: "running" },
      }));
      try {
        const item = await runKandi(page);
        setKandi((k) => ({
          ...k,
          done: k.done + 1,
          state: { ...k.state, [page]: "done" },
        }));
        if (stage === "kandi+nnv") queueRef.current.push(item);
      } catch (e: any) {
        setKandi((k) => ({
          ...k,
          done: k.done + 1,
          state: { ...k.state, [page]: "error" },
        }));
        setError(`Kandianguji p${page}: ${e?.message ?? "failed"}`);
        // One bad page shouldn't stop Kandi racing ahead.
      }
    }
    setKandi((k) => ({ ...k, current: null }));
    producerDoneRef.current = true;
  }

  // ── Consumer: NNV, picking up Kandi-finished pages ───────────────────
  async function consumer() {
    while (true) {
      if (cancelRef.current) return;
      const item = queueRef.current.shift();
      if (!item) {
        if (producerDoneRef.current) return;
        await sleep(300); // wait for the producer to hand off more pages
        continue;
      }

      const page = item.page;
      setNnv((n) => ({
        ...n,
        current: page,
        charDone: 0,
        charTotal: 0,
        state: { ...n.state, [page]: "running" },
      }));
      try {
        let spatialData = item.spatialData ?? [];
        let imageWidth = item.imageWidth;
        let imageHeight = item.imageHeight;
        if (item.needsLoad) {
          const res = await fetch(editUrl(page));
          if (!res.ok) throw new Error(`load HTTP ${res.status}`);
          const data = await res.json();
          spatialData = data.spatialData ?? [];
          imageWidth = data.imageWidth;
          imageHeight = data.imageHeight;
        }
        if (spatialData.length === 0)
          throw new Error("no glyphs (Kandi produced nothing)");

        const img = await loadImage(imageUrl(page));
        const { spatialData: merged } = await rerecognizeWithNomNaViet(
          img,
          spatialData,
          {
            concurrency: 1,
            slotJitterMs: 1000,
            topK: 9,
            onProgress: (d, t) =>
              setNnv((n) =>
                n.current === page
                  ? { ...n, charDone: d, charTotal: t }
                  : n
              ),
          }
        );
        // Omit columns → Kandi's persisted columns are preserved.
        await persist(page, {
          spatialData: merged,
          imageWidth,
          imageHeight,
          nnvCompletedAt: new Date().toISOString(),
        });
        setNnv((n) => ({
          ...n,
          done: n.done + 1,
          state: { ...n.state, [page]: "done" },
        }));
      } catch (e: any) {
        setNnv((n) => ({
          ...n,
          done: n.done + 1,
          state: { ...n.state, [page]: "error" },
        }));
        if (e instanceof NomNaVietUnavailableError) {
          setError(
            `Nôm Na Việt unavailable (p${page}): ${e.message}. Stopped.`
          );
          cancelRef.current = true; // also halt the Kandi producer
          return;
        }
        setError(`Nôm Na Việt p${page}: ${e?.message ?? "failed"}`);
        // Other per-page error: keep consuming the rest.
      }
    }
  }

  async function run() {
    if (kandiPlan.length === 0 && nnvPlanCount === 0) return;
    cancelRef.current = false;
    queueRef.current = [];
    producerDoneRef.current = stage === "nnv"; // no producer in nnv-only
    setError(null);
    setRunning(true);
    setKandi({
      total: kandiPlan.length,
      done: 0,
      current: null,
      state: Object.fromEntries(kandiPlan.map((p) => [p, "pending"])),
    });
    const nnvPages =
      stage === "kandi"
        ? []
        : [...kandiPlan, ...plan.nnvSeed.map((p) => p.pageNumber)].sort(
            (a, b) => a - b
          );
    setNnv({
      total: nnvPages.length,
      done: 0,
      current: null,
      charDone: 0,
      charTotal: 0,
      state: Object.fromEntries(nnvPages.map((p) => [p, "pending"])),
    });
    // Pre-seed already-Kandi'd pages straight into the NNV queue.
    if (stage !== "kandi") {
      for (const p of plan.nnvSeed)
        queueRef.current.push({ page: p.pageNumber, needsLoad: true });
    }

    try {
      const jobs: Promise<void>[] = [];
      if (stage !== "nnv") jobs.push(producer());
      if (stage !== "kandi") jobs.push(consumer());
      await Promise.all(jobs);
    } finally {
      setKandi((k) => ({ ...k, current: null }));
      setNnv((n) => ({ ...n, current: null }));
      setRunning(false);
      router.refresh(); // refresh the server-rendered status table
    }
  }

  const pill = (st: PState | undefined) =>
    st === "done"
      ? "bg-branding-brown text-white"
      : st === "running"
      ? "bg-primary-blue text-white animate-pulse"
      : st === "error"
      ? "bg-red-500 text-white"
      : "bg-gray-100 text-gray-500";

  function track(
    label: string,
    t: { total: number; done: number; current: number | null; state: Record<number, PState> },
    extra?: ReactNode
  ) {
    if (t.total === 0) return null;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            <span className="font-semibold">{label}</span>
            {t.current !== null ? ` — page ${t.current}` : ""}
            {extra}
          </span>
          <span className="font-mono">
            {t.done}/{t.total}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-blue transition-all"
            style={{
              width: `${t.total ? Math.round((t.done / t.total) * 100) : 0}%`,
            }}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {Object.keys(t.state)
            .map(Number)
            .sort((a, b) => a - b)
            .map((p) => (
              <span
                key={p}
                title={`page ${p}: ${t.state[p]}`}
                className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${pill(
                  t.state[p]
                )}`}
              >
                {p}
              </span>
            ))}
        </div>
      </div>
    );
  }

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
            <option value="kandi+nnv">
              Kandianguji + Nôm Na Việt (pipelined)
            </option>
            <option value="nnv">Nôm Na Việt only (pages with Kandi)</option>
          </select>
        </label>
        <label className="text-sm text-gray-700 flex items-center gap-1">
          Scope
          <select
            value={scope}
            disabled={running}
            onChange={(e) => setScope(e.target.value as Scope)}
            className="border border-gray-300 rounded text-sm px-1 py-0.5 disabled:opacity-50"
          >
            <option value="missing">
              {stage === "nnv"
                ? "Pages without Nôm Na Việt yet"
                : "Missing pages (no OCR yet)"}
            </option>
            <option value="all">
              {stage === "nnv"
                ? "All pages (re-run Nôm Na Việt)"
                : "All pages (re-run)"}
            </option>
          </select>
        </label>
        <span className="text-xs text-gray-500">
          {stage !== "nnv" && `Kandi ${kandiPlan.length}`}
          {stage === "kandi+nnv" && " · "}
          {stage !== "kandi" && `NNV ${nnvPlanCount}`} page
          {(stage === "kandi" ? kandiPlan.length : nnvPlanCount) === 1
            ? ""
            : "s"}
        </span>
        {!running ? (
          <button
            onClick={run}
            disabled={kandiPlan.length === 0 && nnvPlanCount === 0}
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
            Cancel
          </button>
        )}
      </div>

      <p className="text-[11px] text-gray-500 mt-2">
        Keep this tab open. Kandianguji races ahead page-by-page; Nôm Na
        Việt (rate-limited ~1 char/sec, ~1–3 min/page) trails behind on
        pages Kandi has finished. Cancel halts Kandi at once and Nôm Na
        Việt at the next page boundary.
      </p>

      {(running || kandi.done > 0 || nnv.done > 0 || error) && (
        <div className="mt-3 space-y-3">
          {track("Kandianguji", kandi)}
          {track(
            "Nôm Na Việt",
            nnv,
            nnv.current !== null && nnv.charTotal > 0 ? (
              <span className="text-gray-500">
                {" "}
                · char {nnv.charDone}/{nnv.charTotal}
              </span>
            ) : null
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
