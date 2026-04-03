"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { getMiradorStore } from "@/components/mirador/Mirador";
import LayoutToggle, { LayoutMode } from "@/components/reading-workshop/LayoutToggle";
import ImagePane from "@/components/reading-workshop/ImagePane";
import TextPane from "@/components/reading-workshop/TextPane";
import ToolsPanel from "@/components/reading-workshop/ToolsPanel";
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

  const [layout, setLayout] = useState<LayoutMode>("side");
  // Auto-enter OCR editor for queued/pending documents that need OCR work
  const [mode, setMode] = useState<WorkshopMode>(
    ocrStatus === "queued" || ocrStatus === "pending" ? "ocr-edit" : "read"
  );
  const [showTools, setShowTools] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [rawText, setRawText] = useState<string | null>(null);

  // Sorted canvas info: id, label, and derived text page number
  interface CanvasInfo { id: string; label: string; textPage: number }
  const [canvases, setCanvases] = useState<CanvasInfo[]>([]);
  // Reverse lookup: canvasId → sorted position (1-based)
  const [canvasIdToPos, setCanvasIdToPos] = useState<Record<string, number>>({});
  // Current position in the sorted canvas list (1-based), seeded from URL
  const [currentPos, setCurrentPos] = useState(startPage);

  // Fetch the IIIF manifest, sort canvases numerically, derive text page mapping
  useEffect(() => {
    let cancelled = false;
    fetch(manifestUrl)
      .then((r) => r.json())
      .then((manifest) => {
        if (cancelled) return;
        // IIIF Presentation API 3 uses "items", API 2 uses "sequences[0].canvases"
        const rawCanvases: any[] =
          manifest.items ?? manifest.sequences?.[0]?.canvases ?? [];

        // Parse label to extract folio number + side for sorting
        function parseLabel(label: string): { num: number; side: string } {
          // Labels like "page000", "page01a", "page011b"
          const m = label.match(/^page0*(\d+)([ab]?)$/i);
          if (m) return { num: parseInt(m[1], 10), side: m[2].toLowerCase() };
          // Labels like "Image 001", "Image 002"
          const m2 = label.match(/^image\s*0*(\d+)$/i);
          if (m2) return { num: parseInt(m2[1], 10), side: "" };
          // Fallback: try to extract any number from the label
          const m3 = label.match(/(\d+)/);
          if (m3) return { num: parseInt(m3[1], 10), side: "" };
          return { num: -1, side: "" };
        }

        // Build canvas info list
        const infos: (CanvasInfo & { _num: number; _side: string })[] = rawCanvases.map((c: any) => {
          const id = c.id ?? c["@id"] ?? "";
          const label: string = typeof c.label === "string"
            ? c.label
            : c.label?.["@value"] ?? c.label?.en?.[0] ?? "";
          const { num, side } = parseLabel(label);
          // Derive text page from label:
          // - Folio labels with a/b suffix (e.g. page01a): (N-1)*2 + (a=1, b=2)
          // - Sequential labels without suffix (e.g. page001): N directly
          // - Cover (num=0): no text page
          let textPage = 0;
          if (num > 0) {
            textPage = side ? (num - 1) * 2 + (side === "a" ? 1 : 2) : num;
          }
          return { id, label, textPage, _num: num, _side: side };
        });

        // Sort by folio number, then side (a before b)
        infos.sort((a, b) => {
          if (a._num !== b._num) return a._num - b._num;
          return a._side < b._side ? -1 : a._side > b._side ? 1 : 0;
        });

        const sorted: CanvasInfo[] = infos.map(({ id, label, textPage }) => ({ id, label, textPage }));
        const lookup: Record<string, number> = {};
        sorted.forEach((c, i) => { lookup[c.id] = i + 1; });

        setCanvases(sorted);
        setCanvasIdToPos(lookup);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [manifestUrl]);

  // Subscribe to the Mirador Redux store to detect canvas navigation
  useEffect(() => {
    if (canvases.length === 0 || Object.keys(canvasIdToPos).length === 0) return;

    let unsubscribe: (() => void) | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    function attach(store: any) {
      let prevCanvasId: string | null = null;
      unsubscribe = store.subscribe(() => {
        const state = store.getState();
        const windowIds = Object.keys(state.windows || {});
        if (windowIds.length === 0) return;
        const canvasId = state.windows[windowIds[0]]?.canvasId;
        if (!canvasId || canvasId === prevCanvasId) return;
        prevCanvasId = canvasId;

        const pos = canvasIdToPos[canvasId];
        if (!pos) return;

        setCurrentPos(pos);
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(pos));
        router.replace(`${pathname}?${params.toString()}`);
      });
    }

    const store = getMiradorStore();
    if (store) {
      attach(store);
    } else {
      pollTimer = setInterval(() => {
        const s = getMiradorStore();
        if (s) {
          clearInterval(pollTimer!);
          pollTimer = null;
          attach(s);
        }
      }, 200);
    }

    return () => {
      unsubscribe?.();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [canvases, canvasIdToPos]);

  // Current page position and derived text page
  const page = currentPos;
  const canvasCount = canvases.length || pageCount;
  const currentCanvas = canvases[page - 1];
  const textPage = currentCanvas?.textPage ?? page;

  // Fetch text for the current page (shared with ToolsPanel)
  useEffect(() => {
    if (!textPage) { setRawText(null); return; }
    let cancelled = false;
    fetch(`/api/page-text/${encodeURIComponent(documentSlug)}/${textPage}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (!cancelled) setRawText(data?.text ?? null); })
      .catch(() => { if (!cancelled) setRawText(null); });
    return () => { cancelled = true; };
  }, [documentSlug, textPage]);

  // Navigate Mirador to a specific position (when page buttons are used).
  // setCanvas is a thunk that computes visibleCanvases before dispatching.
  function setPage(p: number) {
    setCurrentPos(p);

    // Keep URL in sync so refresh restores this page
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.replace(`${pathname}?${params.toString()}`);

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

  const adminPath = `/en/admin/ocr/${documentSlug}`;
  const hasOcr = (ocrStatus === "complete" || ocrStatus === "corrected" || ocrStatus === "pending") && pageCount > 0;
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
          {hasOcr && (
            <button
              onClick={() => setMode(mode === "read" ? "ocr-edit" : "read")}
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
                  paneHeight={layout === "stack" ? `calc(${paneHeight} * 0.55)` : paneHeight}
                />
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
                    />
                  </div>
                ) : (
                  <TextPane
                    slug={documentSlug}
                    page={textPage}
                    adminPath={adminPath}
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
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
