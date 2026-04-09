"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";

import { getMiradorStore } from "@/components/mirador/Mirador";
import LayoutToggle, { LayoutMode } from "@/components/reading-workshop/LayoutToggle";
import ImagePane from "@/components/reading-workshop/ImagePane";
import TextPane from "@/components/reading-workshop/TextPane";
import ToolsPanel from "@/components/reading-workshop/ToolsPanel";
import SearchHighlightOverlay from "@/components/reading-workshop/SearchHighlightOverlay";
import dynamic from "next/dynamic";

const OCREditor = dynamic(() => import("@/components/ocr-editor/OCREditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      Loading OCR editor…
    </div>
  ),
});

type WorkshopMode = "read" | "ocr-edit";

interface ReadingWorkshopProps {
  manifestUrl: string;
  documentSlug: string;
  collectionSlug: string;
  documentTitle: string;
  ocrStatus: string;
  pageCount: number;
  initialPage: number;
}

// Nav bar: py-[28px] top+bottom = 56px + ~40px logo/links ≈ 96px
const NAV_HEIGHT = 96;
// Title bar above the workshop (← Back + document title row) ≈ 45px
const TITLE_BAR_HEIGHT = 45;
// Workshop toolbar (layout toggles + buttons) ≈ 42px
const TOOLBAR_HEIGHT = 42;

export default function ReadingWorkshop({
  manifestUrl,
  documentSlug,
  collectionSlug,
  documentTitle,
  ocrStatus,
  pageCount,
  initialPage,
}: ReadingWorkshopProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read page from URL so refresh restores the correct page
  const urlPage = parseInt(searchParams.get("page") ?? "", 10);
  const startPage = !isNaN(urlPage) && urlPage > 0 ? urlPage : initialPage;

  // Search query for temporary highlighting (from URL or document search)
  const urlQuery = searchParams.get("q") || null;
  const [activeHighlight, setActiveHighlight] = useState<string | null>(urlQuery);

  const [layout, setLayout] = useState<LayoutMode>("side");
  // Auto-enter OCR editor for queued/pending documents that need OCR work
  const [mode, setMode] = useState<WorkshopMode>(
    ocrStatus === "queued" || ocrStatus === "pending" ? "ocr-edit" : "read"
  );
  const [showTools, setShowTools] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [rawText, setRawText] = useState<string | null>(null);
  const [textColumns, setTextColumns] = useState<any[] | null>(null);
  const [textLoading, setTextLoading] = useState(true);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const ocrAbortRef = useRef<AbortController | null>(null);

  // Sorted canvas info: id, label, and derived text page number
  interface CanvasInfo { id: string; label: string; textPage: number }
  const [canvases, setCanvases] = useState<CanvasInfo[]>([]);
  // Reverse lookup: canvasId → sorted position (1-based)
  const [canvasIdToPos, setCanvasIdToPos] = useState<Record<string, number>>({});
  // Ref for the lookup so Mirador subscription always reads latest
  const canvasIdToPosRef = useRef(canvasIdToPos);
  canvasIdToPosRef.current = canvasIdToPos;
  // Current position in the sorted canvas list (1-based), seeded from URL
  const [currentPos, setCurrentPos] = useState(startPage);
  // Track whether we've navigated Mirador to our target page yet.
  // Until we do, ignore canvas change events from Mirador's initial load.
  const miradorSyncedRef = useRef(false);

  // Fetch the IIIF manifest — process the first page immediately, then the rest
  useEffect(() => {
    let cancelled = false;

    function parseLabel(label: string): { num: number; side: string } {
      // "page001a", "page2b", "Page 003"
      const m = label.match(/page\s*0*(\d+)([ab]?)\s*$/i);
      if (m) return { num: parseInt(m[1], 10), side: m[2].toLowerCase() };
      // "Image 001", "q.01-02, Image 003" — extract the Image number specifically
      const m2 = label.match(/image\s*0*(\d+)/i);
      if (m2) return { num: parseInt(m2[1], 10), side: "" };
      // Last resort: use the last number in the label
      const allNums = [...label.matchAll(/(\d+)/g)];
      if (allNums.length > 0) {
        const last = allNums[allNums.length - 1];
        return { num: parseInt(last[1], 10), side: "" };
      }
      return { num: -1, side: "" };
    }

    function parseCanvas(c: any): CanvasInfo & { _num: number; _side: string } {
      const id = c.id ?? c["@id"] ?? "";
      const label: string = typeof c.label === "string"
        ? c.label
        : c.label?.["@value"] ?? c.label?.en?.[0] ?? "";
      const { num, side } = parseLabel(label);
      let textPage = 0;
      if (num > 0) {
        textPage = side ? (num - 1) * 2 + (side === "a" ? 1 : 2) : num;
      }
      return { id, label, textPage, _num: num, _side: side };
    }

    function sortAndFinalize(infos: (CanvasInfo & { _num: number; _side: string })[]) {
      // Check if label-based sorting is reliable: all nums must be unique
      const nums = infos.map((c) => c._num).filter((n) => n > 0);
      const uniqueNums = new Set(nums);
      const reliableSort = uniqueNums.size === nums.length && nums.length > 0;

      if (reliableSort) {
        infos.sort((a, b) => {
          if (a._num !== b._num) return a._num - b._num;
          return a._side < b._side ? -1 : a._side > b._side ? 1 : 0;
        });
      }
      // Otherwise keep manifest order — assign textPage by position
      const sorted: CanvasInfo[] = infos.map(({ id, label, textPage }, i) => ({
        id,
        label,
        textPage: reliableSort ? textPage : i + 1,
      }));
      const lookup: Record<string, number> = {};
      sorted.forEach((c, i) => { lookup[c.id] = i + 1; });
      return { sorted, lookup };
    }

    fetch(manifestUrl)
      .then((r) => r.json())
      .then((manifest) => {
        if (cancelled) return;
        const rawCanvases: any[] =
          manifest.items ?? manifest.sequences?.[0]?.canvases ?? [];

        if (rawCanvases.length === 0) return;

        // Parse all canvases into info objects
        const allInfos = rawCanvases.map(parseCanvas);

        // Immediately finalize the first batch (just the starting page area)
        // so the UI becomes interactive right away
        const FIRST_BATCH = Math.min(allInfos.length, startPage + 1);
        const firstBatch = allInfos.slice(0, FIRST_BATCH);
        const { sorted: firstSorted, lookup: firstLookup } = sortAndFinalize(firstBatch);
        setCanvases(firstSorted);
        setCanvasIdToPos(firstLookup);

        // Then finalize the full list on the next frame so the UI doesn't block
        if (allInfos.length > FIRST_BATCH) {
          requestAnimationFrame(() => {
            if (cancelled) return;
            const { sorted, lookup } = sortAndFinalize(allInfos);
            setCanvases(sorted);
            setCanvasIdToPos(lookup);
          });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [manifestUrl, startPage]);

  // Subscribe to the Mirador Redux store to detect canvas navigation
  useEffect(() => {
    if (canvases.length === 0) return;

    let unsubscribe: (() => void) | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    function attach(store: any) {
      let prevCanvasId: string | null = null;

      // Navigate Mirador to the target page before subscribing,
      // so we don't pick up Mirador's default canvas-1 event.
      const targetCanvasId = canvases[currentPos - 1]?.id;
      if (targetCanvasId && currentPos !== 1) {
        import("mirador/dist/es/src/state/actions").then(({ setCanvas }) => {
          const state = store.getState();
          const windowIds = Object.keys(state.windows || {});
          if (windowIds.length > 0) {
            store.dispatch(setCanvas(windowIds[0], targetCanvasId));
          }
          miradorSyncedRef.current = true;
        });
      } else {
        miradorSyncedRef.current = true;
      }

      unsubscribe = store.subscribe(() => {
        // Ignore canvas changes until we've navigated to our target page
        if (!miradorSyncedRef.current) return;

        const state = store.getState();
        const windowIds = Object.keys(state.windows || {});
        if (windowIds.length === 0) return;
        const canvasId = state.windows[windowIds[0]]?.canvasId;
        if (!canvasId || canvasId === prevCanvasId) return;
        prevCanvasId = canvasId;

        const pos = canvasIdToPosRef.current[canvasId];
        if (!pos) return;

        setCurrentPos(pos);
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(pos));
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }

    // Poll until the Mirador store is available (it may not exist yet if
    // the viewer is still mounting after an OCR-edit → read transition).
    pollTimer = setInterval(() => {
      const s = getMiradorStore();
      if (s) {
        clearInterval(pollTimer!);
        pollTimer = null;
        attach(s);
      }
    }, 200);

    return () => {
      unsubscribe?.();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [canvases.length, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Current page position and derived text page
  const page = currentPos;
  const canvasCount = canvases.length || pageCount;
  const currentCanvas = canvases[page - 1];
  const textPage = currentCanvas?.textPage ?? page;

  // Fetch text for the current page (shared with TextPane and ToolsPanel)
  useEffect(() => {
    if (textPage <= 0) { setRawText(null); setTextLoading(false); return; }
    let cancelled = false;
    setRawText(null);
    setTextColumns(null);
    setTextLoading(true);
    fetch(`/api/page-text/${encodeURIComponent(documentSlug)}/${textPage}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (!cancelled) { setRawText(data?.text ?? null); setTextColumns(data?.columns ?? null); setTextLoading(false); } })
      .catch(() => { if (!cancelled) { setRawText(null); setTextColumns(null); setTextLoading(false); } });
    return () => { cancelled = true; };
  }, [documentSlug, textPage]);

  // Navigate Mirador to a specific position (when page buttons are used).
  // setCanvas is a thunk that computes visibleCanvases before dispatching.
  function setPage(p: number) {
    setCurrentPos(p);

    // Keep URL in sync so refresh restores this page
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });

    if (canvases.length === 0) return;
    const targetCanvasId = canvases[p - 1]?.id;
    if (!targetCanvasId) return;

    const store = getMiradorStore();
    if (!store) return;

    const state = store.getState();
    const windowIds = Object.keys(state.windows || {});
    if (windowIds.length === 0) return;

    // Use Mirador's setCanvas thunk so visibleCanvases is computed correctly
    import("mirador/dist/es/src/state/actions").then(({ setCanvas }) => {
      store.dispatch(setCanvas(windowIds[0], targetCanvasId));
    });
  }

  const handleTextSelect = useCallback(() => {
    const sel = window.getSelection()?.toString().trim() ?? "";
    if (sel) setSelectedText(sel);
  }, []);

  // Navigate to a page from document search, with optional highlight
  const handleNavigateToPage = useCallback((targetPage: number, query?: string) => {
    setPage(targetPage);
    setActiveHighlight(query ?? null);
  }, []);

  async function handleRerunOcr() {
    if (ocrRunning) return;
    const controller = new AbortController();
    ocrAbortRef.current = controller;
    setOcrRunning(true);
    setOcrMessage("Starting…");
    try {
      const res = await fetch("/api/ocr/process-iiif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: documentSlug }),
        signal: controller.signal,
      });
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type === "page_start") {
              setOcrMessage(`Page ${msg.page}/${msg.totalPages}`);
            } else if (msg.type === "page_done") {
              setOcrMessage(`Page ${msg.page}/${msg.totalPages} done`);
            } else if (msg.type === "done") {
              setOcrMessage(`OCR complete — ${msg.processedCount}/${msg.totalCanvases} pages`);
              // Reload text for current page
              setTextLoading(true);
              fetch(`/api/page-text/${encodeURIComponent(documentSlug)}/${textPage}`)
                .then((r) => r.ok ? r.json() : null)
                .then((d) => { setRawText(d?.text ?? null); setTextColumns(d?.columns ?? null); setTextLoading(false); })
                .catch(() => { setTextLoading(false); });
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        setOcrMessage("Stopped — progress saved");
        // Reload text in case some pages were processed
        setTextLoading(true);
        fetch(`/api/page-text/${encodeURIComponent(documentSlug)}/${textPage}`)
          .then((r) => r.ok ? r.json() : null)
          .then((d) => { setRawText(d?.text ?? null); setTextColumns(d?.columns ?? null); setTextLoading(false); })
          .catch(() => { setTextLoading(false); });
      } else {
        setOcrMessage(`OCR error: ${e.message}`);
      }
    } finally {
      setOcrRunning(false);
      ocrAbortRef.current = null;
    }
  }

  function handleStopOcr() {
    ocrAbortRef.current?.abort();
  }

  const adminPath = `/en/admin/ocr/${documentSlug}`;
  const hasOcr = (ocrStatus === "partial" || ocrStatus === "complete" || ocrStatus === "corrected" || ocrStatus === "pending") && pageCount > 0;
  const hasPages = hasOcr || pageCount > 0;

  // Workshop container height: viewport minus nav + title bar
  const workshopHeight = `calc(100vh - ${NAV_HEIGHT + TITLE_BAR_HEIGHT}px)`;
  // Height available for the content panes (minus the toolbar row)
  const paneHeight = `calc(100vh - ${NAV_HEIGHT + TITLE_BAR_HEIGHT + TOOLBAR_HEIGHT}px)`;

  return (
    <div
      style={{ height: workshopHeight, overflow: "hidden" }}
      className="flex flex-col bg-branding-white"
    >
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2 border-b border-[#e1e1de] bg-branding-white flex-wrap">
        <LayoutToggle mode={layout} onChange={setLayout} />

        {/* Page navigation — inline in toolbar */}
        {hasPages && canvasCount > 1 && mode === "read" && (
          <div className="flex items-center gap-2 ml-4 text-sm font-light">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2 py-0.5 rounded border border-[#e1e1de] text-branding-black disabled:opacity-30 hover:border-branding-brown hover:text-branding-brown transition-colors"
            >
              ←
            </button>
            <span className="text-branding-black/70 tabular-nums">
              {page} / {canvasCount}
            </span>
            <button
              disabled={page >= canvasCount}
              onClick={() => setPage(page + 1)}
              className="px-2 py-0.5 rounded border border-[#e1e1de] text-branding-black disabled:opacity-30 hover:border-branding-brown hover:text-branding-brown transition-colors"
            >
              →
            </button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {ocrMessage && (
            <span className="text-xs text-branding-black/60 font-light max-w-[250px] truncate" title={ocrMessage}>
              {ocrMessage}
            </span>
          )}
          {ocrRunning ? (
            <button
              onClick={handleStopOcr}
              className="px-3 py-1 text-sm rounded border font-light transition-colors border-red-300 text-red-600 hover:bg-red-50"
            >
              Stop OCR
            </button>
          ) : (
            <button
              onClick={handleRerunOcr}
              className="px-3 py-1 text-sm rounded border font-light transition-colors border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              Re-run OCR
            </button>
          )}
          {hasOcr && (
            <Link
              href={`/${pathname.split("/")[1]}/admin/ocr/analyze/${encodeURIComponent(documentSlug)}`}
              className="px-3 py-1 text-sm rounded border font-light transition-colors border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              Analyze
            </Link>
          )}
          {hasOcr && (
            <button
              onClick={() => {
                const newMode = mode === "read" ? "ocr-edit" : "read";
                if (newMode === "ocr-edit") {
                  // Update URL so OCR editor opens on the current page
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", String(page));
                  router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                }
                setMode(newMode);
              }}
              className={`px-3 py-1 text-sm rounded border font-light transition-colors ${
                mode === "ocr-edit"
                  ? "bg-branding-brown text-white border-branding-brown"
                  : "border-[#e1e1de] text-branding-black hover:border-branding-brown hover:text-branding-brown"
              }`}
            >
              {mode === "ocr-edit" ? "Exit OCR Edit" : "Edit OCR"}
            </button>
          )}
          <button
            onClick={() => setShowTools(!showTools)}
            className={`px-3 py-1 text-sm rounded border font-light transition-colors ${
              showTools
                ? "bg-branding-brown text-white border-branding-brown"
                : "border-[#e1e1de] text-branding-black hover:border-branding-brown hover:text-branding-brown"
            }`}
          >
            Tools
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div style={{ height: paneHeight, overflow: "hidden" }}>
        {mode === "ocr-edit" ? (
          <div style={{ height: paneHeight }}>
            <OCREditor
              key={`ocr-${page}`}
              slug={documentSlug}
              initialPage={page}
              pageCount={pageCount}
              manifestUrl={manifestUrl}
            />
          </div>
        ) : (
          <div
            style={{ display: "flex", height: paneHeight }}
            className={layout === "stack" ? "flex-col" : "flex-row"}
            onMouseUp={handleTextSelect}
          >
            {/* Image pane */}
            {layout !== "text-only" && (
              <div
                style={{
                  position: "relative",
                  flexShrink: 0,
                  width: layout === "image-only" ? "100%" : layout === "stack" ? "100%" : showTools ? "42%" : "55%",
                  height: layout === "stack" ? `calc(${paneHeight} * 0.55)` : paneHeight,
                }}
              >
                <ImagePane
                  manifestUrl={manifestUrl}
                  canvasId={currentCanvas?.id}
                  paneHeight={layout === "stack" ? `calc(${paneHeight} * 0.55)` : paneHeight}
                />
                {activeHighlight && (
                  <SearchHighlightOverlay
                    slug={documentSlug}
                    page={textPage}
                    query={activeHighlight}
                  />
                )}
              </div>
            )}

            {/* Text pane */}
            {layout !== "image-only" && (
              <div
                style={{
                  height: layout === "stack" ? `calc(${paneHeight} * 0.45)` : paneHeight,
                  overflow: "auto",
                  borderLeft: layout === "side" ? "1px solid #e1e1de" : undefined,
                  borderTop: layout === "stack" ? "1px solid #e1e1de" : undefined,
                  flex: layout === "stack" ? undefined : 1,
                  width: layout === "stack" || layout === "text-only" ? "100%" : undefined,
                  minWidth: 0,
                  maxWidth: layout === "side" && !showTools ? "38%" : undefined,
                  background: "#fbfbfb",
                }}
              >
                {layout === "text-only" ? (
                  <div className="max-w-3xl mx-auto">
                    <TextPane
                      slug={documentSlug}
                      page={textPage}
                      adminPath={adminPath}
                      text={rawText}
                      columns={textColumns}
                      textLoading={textLoading}
                      highlightQuery={activeHighlight}
                    />
                  </div>
                ) : (
                  <TextPane
                    slug={documentSlug}
                    page={textPage}
                    adminPath={adminPath}
                    text={rawText}
                    columns={textColumns}
                    textLoading={textLoading}
                    highlightQuery={activeHighlight}
                  />
                )}
              </div>
            )}

            {/* Tools panel */}
            {showTools && layout !== "stack" && (
              <div
                style={{
                  width: "18%",
                  minWidth: 160,
                  height: paneHeight,
                  borderLeft: "1px solid #e1e1de",
                  overflow: "auto",
                  background: "#f7f7f7",
                  flexShrink: 0,
                }}
              >
                <ToolsPanel
                  selectedText={selectedText}
                  documentTitle={documentTitle}
                  collectionSlug={collectionSlug}
                  documentSlug={documentSlug}
                  page={page}
                  rawText={rawText}
                  onNavigateToPage={handleNavigateToPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
