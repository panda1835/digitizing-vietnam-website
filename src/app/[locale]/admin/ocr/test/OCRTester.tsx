"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { SpatialCharacter } from "@/lib/ocr-store";
import { detectColumns, reorderByColumns, Column } from "@/components/ocr-editor/useColumnDetection";

interface OcrResult {
  spatialData: SpatialCharacter[];
  rawText: string;
  pageWidth: number;
  pageHeight: number;
}

interface OCRTesterProps {
  externalFile?: File | null;
  externalPreview?: string | null;
}

export default function OCRTester({ externalFile, externalPreview }: OCRTesterProps = {}) {
  const file = externalFile ?? null;
  const preview = externalPreview ?? null;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [spatialData, setSpatialData] = useState<SpatialCharacter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [focusedOffset, setFocusedOffset] = useState<number | null>(null);
  const [imgDims, setImgDims] = useState({ w: 1, h: 1 });
  const [zoom, setZoom] = useState(100);
  const [detMode, setDetMode] = useState<"auto" | "sp" | "hp">("auto");
  const [engine, setEngine] = useState<"kandianguji" | "kimhannom" | "hybrid">("kandianguji");
  const [kimToken, setKimToken] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("kimhannom_token") ?? "";
    return "";
  });
  const [kimOcrId, setKimOcrId] = useState(1);
  const [kimLangType, setKimLangType] = useState(2);
  const [kimEpitaph, setKimEpitaph] = useState(0);

  // Drag-to-add state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Selection action popup state (replaces prompt())
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [selectionPixels, setSelectionPixels] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [manualInput, setManualInput] = useState("");

  // Delete character state
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [armedDeleteOffset, setArmedDeleteOffset] = useState<number | null>(null);

  // Region OCR
  const [ocrRegionLoading, setOcrRegionLoading] = useState(false);

  const [candidateData, setCandidateData] = useState<SpatialCharacter[]>([]);
  const [candIndex, setCandIndex] = useState(0);

  // Low confidence review
  const [confThreshold, setConfThreshold] = useState(50);
  const [reviewIndex, setReviewIndex] = useState(0);

  // Draggable character detail card
  const CARD_W = 224;
  const CARD_H = 210;
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (cardPos === null) {
      setCardPos({
        x: Math.round(window.innerWidth / 2 - CARD_W / 2),
        y: Math.round(window.innerHeight / 2 - CARD_H / 2),
      });
    }
  }, [cardPos]);

  const handleCardMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragOffsetRef.current = {
      x: e.clientX - (cardPos?.x ?? 0),
      y: e.clientY - (cardPos?.y ?? 0),
    };
    function onMove(me: MouseEvent) {
      if (!dragOffsetRef.current) return;
      setCardPos({
        x: me.clientX - dragOffsetRef.current.x,
        y: me.clientY - dragOffsetRef.current.y,
      });
    }
    function onUp() {
      dragOffsetRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [cardPos]);

  // Disarm delete when focused char changes
  useEffect(() => { setDeleteArmed(false); }, [focusedOffset]);

  const columns = detectColumns(spatialData, "commentary");
  const charsWithBbox = spatialData.filter((c) => c.bbox && c.text.trim()).length;
  const rawText = spatialData.map((c) => c.text).join("");

  const selectedColumn = selectedCol !== null ? columns[selectedCol] ?? null : null;

  // Focused character metadata
  const focusedChar =
    focusedOffset !== null
      ? spatialData.find((c) => c.offset === focusedOffset) ?? null
      : null;

  const focusedColIdx =
    focusedChar !== null
      ? columns.findIndex((col) => col.chars.some((c) => c.offset === focusedOffset))
      : -1;

  const focusedPosInCol =
    focusedChar !== null && focusedColIdx >= 0
      ? (columns[focusedColIdx]?.chars.findIndex((c) => c.offset === focusedOffset) ?? -1) + 1
      : null;

  // Low-confidence review queue
  const reviewQueue = useMemo(() => {
    return spatialData.filter((c) => c.bbox && c.confidence < confThreshold / 100);
  }, [spatialData, confThreshold]);

  // Text pane refs for scroll-to-focus
  const spanRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  useEffect(() => {
    if (focusedOffset === null) return;
    const el = spanRefs.current.get(focusedOffset);
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedOffset]);

  // Reset when file changes
  const prevFile = useRef(file);
  if (file !== prevFile.current) {
    prevFile.current = file;
    if (result) {
      setResult(null);
      setSpatialData([]);
      setSelectedCol(null);
      setFocusedOffset(null);
    }
  }

  async function handleRun() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSpatialData([]);
    setSelectedCol(null);
    setFocusedOffset(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("det_mode", detMode);
    formData.append("engine", engine);
    if (engine === "kimhannom" || engine === "hybrid") {
      formData.append("kim_token", kimToken);
      formData.append("kim_ocr_id", String(kimOcrId));
      formData.append("kim_lang_type", String(kimLangType));
      formData.append("kim_epitaph", String(kimEpitaph));
    }

    try {
      const res = await fetch("/api/ocr/process-page", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data: OcrResult = await res.json();
      setResult(data);
      setSpatialData(reorderByColumns(data.spatialData, "commentary"));
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // Auto-select first column after OCR completes
  useEffect(() => {
    if (columns.length > 0 && selectedCol === null) {
      setSelectedCol(0);
      const firstChar = columns[0].chars.find((c) => c.bbox);
      if (firstChar) setFocusedOffset(firstChar.offset);
    }
  }, [columns.length, selectedCol]);

  function handleImgLoad() {
    if (imgRef.current) {
      setImgDims({ w: imgRef.current.clientWidth, h: imgRef.current.clientHeight });
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (imgRef.current) {
        const w = imgRef.current.clientWidth;
        const h = imgRef.current.clientHeight;
        if (w > 1 && h > 1) setImgDims({ w, h });
      }
    }, 50);
    return () => clearTimeout(t);
  }, [zoom]);

  const prevResult = useRef(result);
  if (result && result !== prevResult.current && imgRef.current) {
    const w = imgRef.current.clientWidth;
    const h = imgRef.current.clientHeight;
    if (w > 1 && h > 1 && (w !== imgDims.w || h !== imgDims.h)) {
      setTimeout(() => setImgDims({ w, h }), 0);
    }
    prevResult.current = result;
  }

  function handleCharChange(offset: number, newText: string) {
    setSpatialData((prev) =>
      prev.map((c) => (c.offset === offset ? { ...c, text: newText } : c))
    );
  }

  function handleSelectColumn(ci: number) {
    setSelectedCol(ci);
    const firstChar = columns[ci]?.chars.find((c) => c.bbox);
    if (firstChar) setFocusedOffset(firstChar.offset);
  }

  function handleDeleteChar(offset: number) {
    setSpatialData((prev) => {
      const next = prev.filter((c) => c.offset !== offset);
      let o = 0;
      for (const c of next) {
        c.offset = o;
        o += c.text.length;
      }
      return next;
    });
    setFocusedOffset(null);
  }

  function handleDownload() {
    const blob = new Blob([rawText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ocr_test_result.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function navigateReview(idx: number) {
    const clamped = Math.max(0, Math.min(reviewQueue.length - 1, idx));
    setReviewIndex(clamped);
    const char = reviewQueue[clamped];
    if (!char) return;
    const colIdx = columns.findIndex((col) =>
      col.chars.some((c) => c.offset === char.offset)
    );
    if (colIdx >= 0) handleSelectColumn(colIdx);
    setFocusedOffset(char.offset);
  }

  function handleSuggestApply(suggestion: string) {
    if (focusedOffset === null) return;
    handleCharChange(focusedOffset, suggestion);
  }

  async function handleOcrRegion(regionDetMode?: string) {
    if (!selectionRect || !preview) return;
    setOcrRegionLoading(true);
    try {
      // Fetch the preview image and crop the selected region
      const imgRes = await fetch(preview);
      if (!imgRes.ok) throw new Error("Failed to fetch image");
      const blob = await imgRes.blob();

      const rect = selectionRect;
      const croppedBlob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const sx = Math.round(rect.x * img.naturalWidth);
          const sy = Math.round(rect.y * img.naturalHeight);
          const sw = Math.round(rect.w * img.naturalWidth);
          const sh = Math.round(rect.h * img.naturalHeight);
          const canvas = document.createElement("canvas");
          canvas.width = sw;
          canvas.height = sh;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas not supported"));
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
          canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Blob failed")), "image/jpeg", 0.95);
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = URL.createObjectURL(blob);
      });

      // Run OCR on the cropped region
      const formData = new FormData();
      formData.append("image", croppedBlob, "region.jpg");
      formData.append("det_mode", regionDetMode ?? detMode);

      const res = await fetch("/api/ocr/process-page", { method: "POST", body: formData });
      if (!res.ok) throw new Error(`OCR failed: ${res.status}`);
      const data = await res.json();
      const regionChars: SpatialCharacter[] = data.spatialData ?? [];

      if (regionChars.length === 0) {
        clearSelection();
        return;
      }

      // Remap bboxes from region-local coords to full-image coords
      const remapped: SpatialCharacter[] = regionChars
        .filter((c: SpatialCharacter) => c.bbox)
        .map((c: SpatialCharacter) => ({
          ...c,
          bbox: c.bbox!.map((v) => ({
            x: rect.x + v.x * rect.w,
            y: rect.y + v.y * rect.h,
          })),
        }));

      // Merge into existing spatial data
      setSpatialData((prev) => {
        const merged = [...prev, ...remapped];
        return reorderByColumns(merged, "commentary");
      });

      clearSelection();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOcrRegionLoading(false);
    }
  }

  function handlePromoteCandidate(char: SpatialCharacter) {
    setCandidateData((prev) => prev.filter((c) => c.offset !== char.offset));
    setCandIndex((prev) => Math.min(prev, candidateData.length - 2));
    if (char.bbox) {
      addCharAtBbox(char.bbox, char.text);
    }
  }

  function handleDismissCandidate(char: SpatialCharacter) {
    setCandidateData((prev) => prev.filter((c) => c.offset !== char.offset));
    setCandIndex((prev) => Math.min(prev, candidateData.length - 2));
  }

  // ── Drag-to-add handlers ──

  function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsDrawing(true);
    setDrawStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDrawRect(null);
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !drawStart || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    const newRect = {
      x: Math.min(drawStart.x, curX),
      y: Math.min(drawStart.y, curY),
      w: Math.abs(curX - drawStart.x),
      h: Math.abs(curY - drawStart.y),
    };
    setDrawRect(newRect);

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 2;
      ctx.strokeRect(newRect.x, newRect.y, newRect.w, newRect.h);
    }
  }

  function handleCanvasMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsDrawing(false);

    if (drawRect && drawRect.w > 5 && drawRect.h > 5) {
      // Show selection action popup instead of prompt()
      const sw = scaleX || 1;
      const sh = scaleY || 1;
      setSelectionRect({
        x: drawRect.x / sw,
        y: drawRect.y / sh,
        w: drawRect.w / sw,
        h: drawRect.h / sh,
      });
      setSelectionPixels({ ...drawRect });
      setManualInput("");
    } else {
      // Simple click — check if on a column, otherwise deselect
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const clickX = (e.clientX - rect.left) / scaleX;
        const clickY = (e.clientY - rect.top) / scaleY;
        const clickedCol = columns.findIndex(
          (col) =>
            clickX >= col.bbox.minX && clickX <= col.bbox.maxX &&
            clickY >= col.bbox.minY && clickY <= col.bbox.maxY
        );
        if (clickedCol >= 0) {
          handleSelectColumn(clickedCol);
        } else {
          setSelectedCol(null);
          setFocusedOffset(null);
        }
      }
      clearSelection();
    }

    // Don't clear canvas if we have a selection popup to show
    if (!(drawRect && drawRect.w > 5 && drawRect.h > 5)) {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setDrawRect(null);
    setDrawStart(null);
  }

  function clearSelection() {
    setSelectionRect(null);
    setSelectionPixels(null);
    setManualInput("");
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }

  function handleManualAdd() {
    if (!selectionRect || !manualInput.trim()) return;
    const r = selectionRect;
    const bbox: Array<{ x: number; y: number }> = [
      { x: r.x, y: r.y },
      { x: r.x + r.w, y: r.y },
      { x: r.x + r.w, y: r.y + r.h },
      { x: r.x, y: r.y + r.h },
    ];
    addCharAtBbox(bbox, manualInput.trim());
    clearSelection();
  }

  function addCharAtBbox(bbox: Array<{ x: number; y: number }>, text: string) {
    const newCenter = {
      x: (bbox[0].x + bbox[2].x) / 2,
      y: (bbox[0].y + bbox[2].y) / 2,
    };

    // Find the closest column the new char belongs to
    let bestColIdx = -1;
    let bestDist = Infinity;
    for (let ci = 0; ci < columns.length; ci++) {
      const col = columns[ci];
      const colCx = (col.bbox.minX + col.bbox.maxX) / 2;
      const dist = Math.abs(newCenter.x - colCx);
      if (dist < bestDist) {
        bestDist = dist;
        bestColIdx = ci;
      }
    }

    let insertIndex = spatialData.length;
    if (bestColIdx >= 0) {
      const col = columns[bestColIdx];
      let lastBeforeIdx = -1;
      for (const colChar of col.chars) {
        if (!colChar.bbox) continue;
        const cy = (colChar.bbox[0].y + colChar.bbox[2].y) / 2;
        if (cy <= newCenter.y) {
          const sdIdx = spatialData.findIndex((c) => c.offset === colChar.offset);
          if (sdIdx >= 0) lastBeforeIdx = sdIdx;
        }
      }

      if (lastBeforeIdx >= 0) {
        insertIndex = lastBeforeIdx + 1;
      } else {
        const firstChar = col.chars.find((c) => c.bbox);
        if (firstChar) {
          const sdIdx = spatialData.findIndex((c) => c.offset === firstChar.offset);
          if (sdIdx >= 0) insertIndex = sdIdx;
        }
      }
    }

    const newChar: SpatialCharacter = {
      text,
      bbox,
      confidence: 1.0,
      offset: 0,
    };

    setSpatialData((prev) => {
      const next = [...prev];
      next.splice(insertIndex, 0, newChar);
      let offset = 0;
      for (const c of next) {
        c.offset = offset;
        offset += c.text.length;
      }
      return next;
    });
  }

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Escape") {
        setSelectedCol(null);
        setFocusedOffset(null);
      } else if (e.key === "ArrowLeft" && selectedCol !== null && selectedCol > 0) {
        e.preventDefault();
        handleSelectColumn(selectedCol - 1);
      } else if (e.key === "ArrowRight" && selectedCol !== null && selectedCol < columns.length - 1) {
        e.preventDefault();
        handleSelectColumn(selectedCol + 1);
      } else if (e.key === "ArrowDown" && selectedCol !== null) {
        e.preventDefault();
        const col = columns[selectedCol];
        if (!col) return;
        const bboxChars = col.chars.filter((c) => c.bbox);
        const currentIdx = bboxChars.findIndex((c) => c.offset === focusedOffset);
        const next = bboxChars[currentIdx + 1];
        if (next) {
          setFocusedOffset(next.offset);
        } else if (selectedCol < columns.length - 1) {
          handleSelectColumn(selectedCol + 1);
        }
      } else if (e.key === "ArrowUp" && selectedCol !== null) {
        e.preventDefault();
        const col = columns[selectedCol];
        if (!col) return;
        const bboxChars = col.chars.filter((c) => c.bbox);
        const currentIdx = bboxChars.findIndex((c) => c.offset === focusedOffset);
        const prev = bboxChars[currentIdx - 1];
        if (prev) {
          setFocusedOffset(prev.offset);
        } else if (selectedCol > 0) {
          const prevCol = columns[selectedCol - 1];
          setSelectedCol(selectedCol - 1);
          const lastChar = prevCol.chars.filter((c) => c.bbox).at(-1);
          if (lastChar) setFocusedOffset(lastChar.offset);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCol, columns.length]);

  // Mouse wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function handleWheel(e: WheelEvent) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((z) => Math.max(25, Math.min(300, z + (e.deltaY > 0 ? -10 : 10))));
      }
    }
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // Sync canvas size with image
  useEffect(() => {
    if (canvasRef.current && imgDims.w > 1) {
      canvasRef.current.width = imgDims.w;
      canvasRef.current.height = imgDims.h;
    }
  }, [imgDims]);

  // Focus management
  useEffect(() => {
    if (focusedOffset === null) return;
    const el = document.querySelector(`[data-char-offset="${focusedOffset}"]`) as HTMLInputElement | null;
    if (el) el.focus();
  }, [focusedOffset, selectedCol]);

  const scaleX = imgDims.w;
  const scaleY = imgDims.h;

  return (
    <div className="flex flex-col gap-4">
      {/* Run button + detection mode */}
      {file && !result && (
        <div className="flex flex-col gap-2 self-start">
          <div className="flex items-center gap-2">
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as "kandianguji" | "kimhannom" | "hybrid")}
              disabled={loading}
              className="text-sm border border-gray-300 rounded px-2 py-2"
            >
              <option value="kandianguji">Kandianguji (看典古籍)</option>
              <option value="kimhannom">Kim Hán Nôm (金漢喃)</option>
              <option value="hybrid">Hybrid (Kandianguji boxes + Kim Hán Nôm text)</option>
            </select>
            {(engine === "kandianguji" || engine === "hybrid") && (
              <select
                value={detMode}
                onChange={(e) => setDetMode(e.target.value as "auto" | "sp" | "hp")}
                disabled={loading}
                className="text-sm border border-gray-300 rounded px-2 py-2"
              >
                <option value="auto">Auto</option>
                <option value="sp">Vertical (竖排)</option>
                <option value="hp">Horizontal (横排)</option>
              </select>
            )}
            {(engine === "kimhannom" || engine === "hybrid") && (
              <>
                <select
                  value={kimOcrId}
                  onChange={(e) => setKimOcrId(Number(e.target.value))}
                  disabled={loading}
                  className="text-sm border border-gray-300 rounded px-2 py-2"
                >
                  <option value={1}>Vertical standard</option>
                  <option value={2}>Administrative</option>
                  <option value={3}>Outdoor</option>
                  <option value={4}>Horizontal standard</option>
                </select>
                <select
                  value={kimLangType}
                  onChange={(e) => setKimLangType(Number(e.target.value))}
                  disabled={loading}
                  className="text-sm border border-gray-300 rounded px-2 py-2"
                >
                  <option value={0}>Unknown lang</option>
                  <option value={1}>Hán</option>
                  <option value={2}>Nôm</option>
                </select>
                <label className="flex items-center gap-1 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={kimEpitaph === 1}
                    onChange={(e) => setKimEpitaph(e.target.checked ? 1 : 0)}
                    disabled={loading}
                  />
                  Epitaph
                </label>
              </>
            )}
            <button
              onClick={handleRun}
              disabled={!file || loading || ((engine === "kimhannom" || engine === "hybrid") && !kimToken)}
              className="px-4 py-2 text-sm font-medium rounded bg-branding-black text-white hover:bg-gray-800 disabled:opacity-40"
            >
              {loading ? "Running OCR…" : "Run Quick OCR"}
            </button>
          </div>
          {(engine === "kimhannom" || engine === "hybrid") && (
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="Kim Hán Nôm token (from browser cookies)"
                value={kimToken}
                onChange={(e) => {
                  setKimToken(e.target.value);
                  localStorage.setItem("kimhannom_token", e.target.value);
                }}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 max-w-md"
              />
              {!kimToken && (
                <span className="text-xs text-amber-600">
                  Log in at kimhannom.fit.hcmus.edu.vn → DevTools → Cookies → copy &quot;token&quot;
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          Error: {error}
        </div>
      )}

      {/* Three-pane editor */}
      {result && (
        <div className="flex gap-0 border border-gray-200 rounded overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>

          {/* Left pane: full text */}
          <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 uppercase tracking-wide">
              Full Text
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="text-sm font-sans leading-relaxed break-all">
                {spatialData.map((char, i) => {
                  if (!char.bbox) {
                    return <span key={i}>{char.text === "\n" ? <br /> : char.text}</span>;
                  }
                  const isFocused = char.offset === focusedOffset;
                  const conf = char.confidence;
                  const confColor = isFocused
                    ? "bg-red-200 text-red-800"
                    : conf < 0.3
                    ? "bg-red-100 text-red-700"
                    : conf < 0.5
                    ? "bg-yellow-100 text-yellow-800"
                    : "hover:bg-indigo-100";
                  return (
                    <span
                      key={i}
                      ref={(el) => {
                        if (el) spanRefs.current.set(char.offset, el);
                        else spanRefs.current.delete(char.offset);
                      }}
                      onClick={() => {
                        const colIdx = columns.findIndex((c) =>
                          c.chars.some((ch) => ch.offset === char.offset)
                        );
                        if (colIdx >= 0) setSelectedCol(colIdx);
                        setFocusedOffset(char.offset);
                      }}
                      className={`cursor-pointer transition-colors rounded ${confColor}`}
                      title={`${char.text} — confidence: ${Math.round(conf * 100)}%`}
                    >
                      {char.text}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center pane: image with overlays */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 uppercase tracking-wide flex items-center gap-3">
              <span>Page Image</span>
              <button
                onClick={() => { setSelectedCol(null); setFocusedOffset(null); }}
                className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                  selectedCol === null
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                }`}
              >
                Draw to add
              </button>
              <span className="text-[10px] font-normal text-gray-400">
                {selectedCol === null ? "Drag on image to add a character" : "Click a column to edit, or deselect to draw"}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => setZoom((z) => Math.max(25, z - 25))} className="px-1.5 py-0.5 text-[10px] rounded border border-gray-300 hover:bg-gray-100">−</button>
                <span className="text-[10px] text-gray-500 w-8 text-center">{zoom}%</span>
                <button onClick={() => setZoom((z) => Math.min(200, z + 25))} className="px-1.5 py-0.5 text-[10px] rounded border border-gray-300 hover:bg-gray-100">+</button>
                <button onClick={() => setZoom(100)} className="px-1.5 py-0.5 text-[10px] rounded border border-gray-300 hover:bg-gray-100 ml-1">Fit</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto relative" ref={containerRef}>
              <div className="relative inline-block" style={{ width: `${zoom}%` }}>
                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    ref={imgRef}
                    src={preview}
                    alt="OCR source"
                    className="block"
                    style={{ width: "100%", height: "auto" }}
                    onLoad={handleImgLoad}
                    draggable={false}
                  />
                )}

                {/* Drag-to-add canvas overlay */}
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={() => { if (isDrawing) handleCanvasMouseUp({} as any); }}
                  className="absolute inset-0 z-20 cursor-crosshair"
                  style={{ pointerEvents: "auto" }}
                />

                {/* Column highlight overlays */}
                {columns.map((col) => {
                  const left = col.bbox.minX * scaleX;
                  const top = col.bbox.minY * scaleY;
                  const width = (col.bbox.maxX - col.bbox.minX) * scaleX;
                  const height = (col.bbox.maxY - col.bbox.minY) * scaleY;
                  const isSelected = col.index === selectedCol;

                  return (
                    <div
                      key={col.index}
                      onClick={() => handleSelectColumn(col.index)}
                      style={{ left, top, width, height, position: "absolute", zIndex: 5 }}
                      className={`pointer-events-none border-2 transition-colors ${
                        isSelected
                          ? "border-red-500 bg-red-500/5"
                          : col.isRow
                          ? "border-emerald-400 bg-emerald-400/10"
                          : "border-indigo-400 bg-indigo-400/10"
                      }`}
                      title={`${col.isRow ? "Row" : "Col"} ${col.index + 1}: ${col.chars.length} characters`}
                    >
                      <span
                        className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-1 rounded ${
                          isSelected
                            ? "bg-red-500 text-white"
                            : col.isRow
                            ? "bg-emerald-500 text-white"
                            : "bg-indigo-500 text-white"
                        }`}
                      >
                        {col.isRow ? "R" : ""}{col.index + 1}
                      </span>
                    </div>
                  );
                })}

                {/* Candidate highlight overlay */}
                {candidateData.length > 0 && candidateData[candIndex]?.bbox && (() => {
                  const c = candidateData[candIndex];
                  const left = c.bbox![0].x * scaleX;
                  const top = c.bbox![0].y * scaleY;
                  const width = Math.abs(c.bbox![1].x - c.bbox![0].x) * scaleX;
                  const height = Math.abs(c.bbox![2].y - c.bbox![0].y) * scaleY;
                  return (
                    <div
                      style={{ position: "absolute", left, top, width, height, zIndex: 15 }}
                      className="border-2 border-orange-500 bg-orange-400/20 rounded-sm pointer-events-none shadow-[0_0_8px_2px_rgba(251,146,60,0.5)]"
                    />
                  );
                })()}

                {/* Selection action popup */}
                {selectionPixels && selectionRect && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        left: selectionPixels.x,
                        top: selectionPixels.y,
                        width: selectionPixels.w,
                        height: selectionPixels.h,
                        zIndex: 25,
                      }}
                      className="border-2 border-dashed border-red-500 bg-red-500/10 pointer-events-none"
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: selectionPixels.x,
                        top: selectionPixels.y + selectionPixels.h + 4,
                        zIndex: 30,
                      }}
                      className="flex items-center gap-1 bg-white border border-gray-300 rounded shadow-lg p-1.5"
                    >
                      <button
                        onClick={() => handleOcrRegion("auto")}
                        disabled={ocrRegionLoading}
                        className="px-2 py-1 text-[10px] font-medium rounded bg-branding-black text-white hover:bg-gray-800 disabled:opacity-40"
                      >
                        {ocrRegionLoading ? "OCR…" : "Auto"}
                      </button>
                      <button
                        onClick={() => handleOcrRegion("sp")}
                        disabled={ocrRegionLoading}
                        className="px-2 py-1 text-[10px] font-medium rounded bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-40"
                      >
                        竖排
                      </button>
                      <button
                        onClick={() => handleOcrRegion("hp")}
                        disabled={ocrRegionLoading}
                        className="px-2 py-1 text-[10px] font-medium rounded bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-40"
                      >
                        横排
                      </button>
                      <input
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleManualAdd(); if (e.key === "Escape") clearSelection(); }}
                        placeholder="Type text…"
                        className="w-24 px-1.5 py-1 text-[10px] border border-gray-300 rounded focus:outline-none focus:border-indigo-400"
                      />
                      <button
                        onClick={handleManualAdd}
                        disabled={!manualInput.trim()}
                        className="px-2 py-1 text-[10px] font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                      >
                        Add
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-1.5 py-1 text-[10px] text-gray-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                )}

                {/* Character input overlays for selected column */}
                {selectedColumn && (() => {
                  const allCharsInCol = selectedColumn.chars.filter((c) => c.bbox);
                  if (allCharsInCol.length === 0) return null;

                  // Section type map for main vs commentary
                  const sectionTypeMap = new Map<number, "main" | "commentary">();
                  for (const sec of selectedColumn.sections) {
                    for (const c of sec.chars) sectionTypeMap.set(c.offset, sec.type);
                  }

                  // Uniform sizing based on median main-text char height
                  const mainChars = allCharsInCol.filter((c) => sectionTypeMap.get(c.offset) !== "commentary");
                  const sizeSource = mainChars.length > 0 ? mainChars : allCharsInCol;
                  const heights = sizeSource.map((c) =>
                    Math.abs(c.bbox![3].y - c.bbox![0].y) * scaleY
                  ).sort((a: number, b: number) => a - b);
                  const medianH = heights[Math.floor(heights.length / 2)];
                  const SCALE = 1.4;
                  const MAIN_SIZE = Math.max(22, Math.round(medianH * SCALE));
                  const COMMENT_SIZE = Math.max(16, Math.round(MAIN_SIZE * 0.65));
                  const COL_GAP = 1;
                  const PAD = 6;
                  const PANEL_W = MAIN_SIZE + COL_GAP * 2 + PAD * 2;
                  const colLeftPx = selectedColumn.bbox.minX * scaleX;
                  const panelLeft = colLeftPx - PANEL_W - 6;
                  const centerX = panelLeft + PANEL_W / 2;

                  // Commentary side detection
                  const commentarySide = new Map<number, "right" | "left">();
                  const pairedY = new Map<number, number>();
                  for (const sec of selectedColumn.sections) {
                    if (sec.type !== "commentary") continue;
                    const withBbox = sec.chars.filter((c) => c.bbox);
                    if (withBbox.length < 2) continue;
                    const xs = withBbox.map((c) => (c.bbox![0].x + c.bbox![2].x) / 2);
                    const xRange = Math.max(...xs) - Math.min(...xs);
                    const sectionAvgW = withBbox.reduce((s, c) => s + Math.abs(c.bbox![2].x - c.bbox![0].x), 0) / withBbox.length;
                    if (xRange < sectionAvgW * 0.6) continue;
                    const xMid = (Math.min(...xs) + Math.max(...xs)) / 2;
                    const rightChars: typeof withBbox = [];
                    const leftChars: typeof withBbox = [];
                    for (const c of withBbox) {
                      const cx = (c.bbox![0].x + c.bbox![2].x) / 2;
                      if (cx >= xMid) { commentarySide.set(c.offset, "right"); rightChars.push(c); }
                      else { commentarySide.set(c.offset, "left"); leftChars.push(c); }
                    }
                    const avgH = withBbox.reduce((s, c) => s + Math.abs(c.bbox![3].y - c.bbox![0].y), 0) / withBbox.length;
                    for (const rc of rightChars) {
                      const rcy = (rc.bbox![0].y + rc.bbox![2].y) / 2;
                      for (const lc of leftChars) {
                        const lcy = (lc.bbox![0].y + lc.bbox![2].y) / 2;
                        if (Math.abs(rcy - lcy) < avgH * 0.5) {
                          const sharedY = ((rcy + lcy) / 2) * scaleY;
                          pairedY.set(rc.offset, sharedY);
                          pairedY.set(lc.offset, sharedY);
                        }
                      }
                    }
                  }

                  // Background panel
                  const firstChar = allCharsInCol[0];
                  const lastChar = allCharsInCol[allCharsInCol.length - 1];
                  const panelTop = firstChar.bbox![0].y * scaleY - 4;
                  const panelBottom = lastChar.bbox![2].y * scaleY + 4;

                  const elements = [
                    <div
                      key="__bg"
                      style={{
                        position: "absolute",
                        left: panelLeft - 2,
                        top: panelTop,
                        width: PANEL_W + 4,
                        height: panelBottom - panelTop,
                        zIndex: 8,
                      }}
                      className="bg-white border border-gray-200 rounded-lg pointer-events-none shadow-sm"
                    />,
                  ];

                  // Pre-compute cell positions and fix overlaps
                  const cellPositions: Array<{
                    char: typeof allCharsInCol[0]; charIdx: number;
                    cellSize: number; cellLeft: number; cellTop: number;
                    imgLeft: number; imgTop: number; boxW: number; boxH: number;
                    lane: string;
                  }> = [];

                  for (let charIdx = 0; charIdx < allCharsInCol.length; charIdx++) {
                    const char = allCharsInCol[charIdx];
                    const imgTop = char.bbox![0].y * scaleY;
                    const imgLeft = char.bbox![0].x * scaleX;
                    const boxW = Math.abs(char.bbox![1].x - char.bbox![0].x) * scaleX;
                    const boxH = Math.abs(char.bbox![3].y - char.bbox![0].y) * scaleY;
                    const isCommentary = sectionTypeMap.get(char.offset) === "commentary";
                    const side = commentarySide.get(char.offset);

                    let cellSize: number;
                    let cellLeft: number;
                    let lane: string;
                    if (isCommentary && side === "right") {
                      cellSize = COMMENT_SIZE; cellLeft = centerX + COL_GAP / 2; lane = "right";
                    } else if (isCommentary && side === "left") {
                      cellSize = COMMENT_SIZE; cellLeft = centerX - COL_GAP / 2 - COMMENT_SIZE; lane = "left";
                    } else {
                      cellSize = isCommentary ? COMMENT_SIZE : MAIN_SIZE;
                      cellLeft = centerX - cellSize / 2; lane = "center";
                    }

                    const sharedCenterY = pairedY.get(char.offset);
                    const charCenterY = sharedCenterY ?? (imgTop + boxH / 2);
                    const cellTop = charCenterY - cellSize / 2;

                    cellPositions.push({ char, charIdx, cellSize, cellLeft, cellTop, imgLeft, imgTop, boxW, boxH, lane });
                  }

                  // Fix overlaps for commentary lanes only — main text stays image-aligned
                  const laneBottoms = new Map<string, number>();
                  for (const pos of cellPositions) {
                    if (pos.lane !== "center") {
                      const prevBottom = laneBottoms.get(pos.lane) ?? -Infinity;
                      if (pos.cellTop < prevBottom + 1) {
                        pos.cellTop = prevBottom + 1;
                      }
                    }
                    laneBottoms.set(pos.lane, pos.cellTop + pos.cellSize);
                  }

                  return elements.concat(cellPositions.map((pos) => {
                    const { char, charIdx, cellSize, cellLeft, cellTop, imgLeft, imgTop, boxW, boxH } = pos;
                    const isFocused = char.offset === focusedOffset;
                    const conf = char.confidence;

                    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
                      if (e.key === "Tab" && !e.shiftKey) {
                        e.preventDefault();
                        const next = allCharsInCol[charIdx + 1];
                        if (next) setFocusedOffset(next.offset);
                        else if (selectedCol !== null && selectedCol < columns.length - 1) handleSelectColumn(selectedCol + 1);
                      } else if (e.key === "Tab" && e.shiftKey) {
                        e.preventDefault();
                        const prev = allCharsInCol[charIdx - 1];
                        if (prev) setFocusedOffset(prev.offset);
                        else if (selectedCol !== null && selectedCol > 0) {
                          const prevCol = columns[selectedCol - 1];
                          setSelectedCol(selectedCol - 1);
                          const lastChar = prevCol.chars.filter((c) => c.bbox).at(-1);
                          if (lastChar) setFocusedOffset(lastChar.offset);
                        }
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        const next = allCharsInCol[charIdx + 1];
                        if (next) setFocusedOffset(next.offset);
                        else if (selectedCol !== null && selectedCol < columns.length - 1) handleSelectColumn(selectedCol + 1);
                      }
                    }

                    const textColor = conf < 0.3 ? "text-red-600" : conf < 0.5 ? "text-amber-600" : "text-gray-800";

                    return (
                      <div key={char.offset} style={{ position: "absolute", left: 0, top: 0, zIndex: isFocused ? 50 : 10 }}>
                        {isFocused && (
                          <div
                            style={{ position: "absolute", left: imgLeft, top: imgTop, width: boxW, height: boxH, zIndex: 45 }}
                            className="pointer-events-none rounded ring-2 ring-offset-1 ring-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.4)]"
                          />
                        )}
                        <input
                          data-char-offset={char.offset}
                          type="text"
                          value={char.text}
                          maxLength={4}
                          onChange={(e) => handleCharChange(char.offset, e.target.value)}
                          onFocus={() => setFocusedOffset(char.offset)}
                          onKeyDown={handleKeyDown}
                          title={`confidence: ${Math.round(conf * 100)}%`}
                          style={{
                            position: "absolute",
                            left: cellLeft,
                            top: cellTop,
                            width: cellSize,
                            height: cellSize,
                            fontSize: Math.round(cellSize * 0.65),
                            lineHeight: 1,
                            padding: "1px",
                            zIndex: isFocused ? 50 : 10,
                          }}
                          className={`text-center font-serif outline-none bg-transparent ${textColor} ${
                            isFocused ? "border-2 border-indigo-500 ring-2 ring-indigo-300 bg-indigo-50 rounded" : "border-0"
                          }`}
                        />
                      </div>
                    );
                  }));
                })()}
              </div>
            </div>
          </div>

          {/* Right pane: tools & info */}
          <div className="w-1/4 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 uppercase tracking-wide">
              Tools
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">

              {/* Column navigator */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Columns ({columns.length})</p>
                <div className="flex flex-wrap gap-1">
                  {columns.map((col) => (
                    <button
                      key={col.index}
                      onClick={() => handleSelectColumn(col.index)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        selectedCol === col.index
                          ? "bg-red-500 text-white border-red-500"
                          : col.isRow
                          ? "bg-white text-emerald-700 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50"
                          : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
                      }`}
                      title={col.isRow ? `Row ${col.index + 1}` : `Column ${col.index + 1}`}
                    >
                      {col.isRow ? "R" : ""}{col.index + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected column text with click-to-delete */}
              {selectedColumn && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Column {(selectedCol ?? 0) + 1} ({selectedColumn.chars.length} chars)
                  </p>
                  <div className="text-sm bg-indigo-50 border border-indigo-200 rounded p-2 break-all flex flex-wrap gap-0.5">
                    {selectedColumn.chars.map((c) => (
                      armedDeleteOffset === c.offset ? (
                        <span key={c.offset} className="flex items-center gap-0.5 bg-red-50 border border-red-200 rounded px-1 py-0.5">
                          <span className="font-serif">{c.text}</span>
                          <button
                            onClick={() => { handleDeleteChar(c.offset); setArmedDeleteOffset(null); }}
                            className="text-[9px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded px-1 leading-tight"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setArmedDeleteOffset(null)}
                            className="text-[9px] text-gray-400 hover:text-gray-600 leading-tight"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <span
                          key={c.offset}
                          className="group relative cursor-pointer hover:bg-red-100 rounded px-0.5 transition-colors"
                          title={`Click to delete "${c.text}"`}
                          onClick={() => setArmedDeleteOffset(c.offset)}
                        >
                          {c.text}
                          <span className="absolute -top-1 -right-1 hidden group-hover:block text-[8px] bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center leading-none">×</span>
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="text-xs text-gray-400 space-y-1">
                <p>Image: {result.pageWidth} × {result.pageHeight}px</p>
                <p>Spatial items: {spatialData.length}</p>
                <p>With bbox: {charsWithBbox}</p>
                <p>Columns: {columns.length}</p>
              </div>

              {/* Low confidence review queue */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Low Confidence Review
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-gray-400 w-16 shrink-0">
                    &lt;{confThreshold}% conf
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    step={5}
                    value={confThreshold}
                    onChange={(e) => { setConfThreshold(Number(e.target.value)); setReviewIndex(0); }}
                    className="flex-1 accent-amber-500"
                  />
                </div>
                {reviewQueue.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">
                    No characters below this threshold.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-1 mb-2">
                      <button
                        onClick={() => navigateReview(reviewIndex - 1)}
                        disabled={reviewIndex === 0}
                        className="px-2 py-1 text-[11px] rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-30"
                      >
                        ← Prev
                      </button>
                      <span className="flex-1 text-center text-[11px] text-gray-500">
                        {reviewIndex + 1} / {reviewQueue.length}
                      </span>
                      <button
                        onClick={() => navigateReview(reviewIndex + 1)}
                        disabled={reviewIndex >= reviewQueue.length - 1}
                        className="px-2 py-1 text-[11px] rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-30"
                      >
                        Next →
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-0.5">
                      {reviewQueue.map((char, i) => {
                        const conf = Math.round(char.confidence * 100);
                        const isCurrent = i === reviewIndex;
                        const confColor = char.confidence < 0.3 ? "text-red-600" : "text-yellow-600";
                        return (
                          <button
                            key={char.offset}
                            onClick={() => navigateReview(i)}
                            className={`w-full flex items-center justify-between px-2 py-1 rounded text-left text-[11px] transition-colors ${
                              isCurrent
                                ? "bg-amber-100 border border-amber-300"
                                : "hover:bg-gray-100 border border-transparent"
                            }`}
                          >
                            <span className="font-serif text-base leading-none">{char.text}</span>
                            <span className={`font-medium ${confColor}`}>{conf}%</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Alternative characters from OCR choices */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Alternative Characters
                </p>
                {focusedOffset === null ? (
                  <p className="text-[11px] text-gray-400 italic">Focus a character to see alternatives</p>
                ) : (() => {
                  const focusedChar = spatialData.find((c) => c.offset === focusedOffset);
                  const choices = focusedChar?.choices ?? [];
                  if (choices.length === 0) return (
                    <p className="text-[11px] text-gray-400 italic">No alternatives available for this character</p>
                  );
                  return (
                    <div className="flex flex-wrap gap-1">
                      {choices.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestApply(s)}
                          className="px-2 py-1 text-base rounded border border-gray-300 hover:bg-indigo-50 hover:border-indigo-400"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Keyboard shortcuts */}
              <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                <p className="font-medium text-gray-500 mb-1">Keyboard</p>
                <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">Tab</kbd> Next char / column</p>
                <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">Shift+Tab</kbd> Previous char / column</p>
                <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">Enter</kbd> Next char / column</p>
                <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">← →</kbd> Prev / next column</p>
                <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">↑ ↓</kbd> Prev / next character</p>
                <p><kbd className="px-1 bg-gray-100 border rounded text-[10px]">Esc</kbd> Deselect column (draw mode)</p>
              </div>

              {/* Download */}
              <div className="mt-auto pt-2 border-t border-gray-100">
                <button
                  onClick={handleDownload}
                  className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  Download page text (.txt)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Character detail card — fixed overlay when a character is focused */}
      {result && focusedChar && focusedChar.bbox && (() => {
        const PAD = 0.06;
        const CARD_IMG_W = 100;
        const CARD_IMG_H = 80;

        const bx0 = focusedChar.bbox[0].x;
        const by0 = focusedChar.bbox[0].y;
        const bx1 = focusedChar.bbox[1].x;
        const by2 = focusedChar.bbox[2].y;

        const rL = Math.max(0, bx0 - PAD);
        const rT = Math.max(0, by0 - PAD);
        const rR = Math.min(1, bx1 + PAD);
        const rB = Math.min(1, by2 + PAD);
        const rW = rR - rL || 0.1;
        const rH = rB - rT || 0.1;

        const iW = imgDims.w || 1;
        const iH = imgDims.h || 1;
        const scale = Math.min(CARD_IMG_W / (rW * iW), CARD_IMG_H / (rH * iH));
        const bgW = iW * scale;
        const bgH = iH * scale;
        const centerOffX = (CARD_IMG_W - rW * iW * scale) / 2;
        const centerOffY = (CARD_IMG_H - rH * iH * scale) / 2;
        const bgX = -rL * iW * scale + centerOffX;
        const bgY = -rT * iH * scale + centerOffY;

        const hlL = (bx0 - rL) * iW * scale + centerOffX;
        const hlT = (by0 - rT) * iH * scale + centerOffY;
        const hlW = (bx1 - bx0) * iW * scale;
        const hlH = (by2 - by0) * iH * scale;

        const conf = focusedChar.confidence;
        const confPct = Math.round(conf * 100);
        const confColor =
          conf < 0.3 ? "text-red-600 bg-red-50"
          : conf < 0.5 ? "text-yellow-700 bg-yellow-50"
          : "text-emerald-700 bg-emerald-50";
        const barColor =
          conf < 0.3 ? "bg-red-400" : conf < 0.5 ? "bg-yellow-400" : "bg-emerald-400";

        const totalInCol = focusedColIdx >= 0 ? columns[focusedColIdx]?.chars.length : null;

        return (
          <div
            className="fixed z-[200] w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden select-none"
            style={{ left: cardPos?.x ?? 0, top: cardPos?.y ?? 0 }}
          >
            {/* Drag handle strip */}
            <div
              className="flex items-center justify-end px-2 py-1 bg-gray-50 border-b border-gray-100 cursor-grab active:cursor-grabbing"
              onMouseDown={handleCardMouseDown}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="5 9 2 12 5 15"/>
                <polyline points="9 5 12 2 15 5"/>
                <polyline points="15 19 12 22 9 19"/>
                <polyline points="19 9 22 12 19 15"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <line x1="12" y1="2" x2="12" y2="22"/>
              </svg>
            </div>

            {/* Image preview */}
            <div
              className="relative bg-gray-100 overflow-hidden"
              style={{ width: CARD_IMG_W, height: CARD_IMG_H, margin: "0 auto" }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${preview})`,
                  backgroundSize: `${bgW}px ${bgH}px`,
                  backgroundPosition: `${bgX}px ${bgY}px`,
                  backgroundRepeat: "no-repeat",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: hlL,
                  top: hlT,
                  width: hlW,
                  height: hlH,
                }}
                className="border-2 border-amber-400 bg-amber-300/30 rounded-sm shadow-[0_0_6px_2px_rgba(251,191,36,0.6)]"
              />
            </div>

            <div className="px-3 py-2.5 space-y-1.5">
              {/* Character display + confidence + delete */}
              <div className="flex items-center justify-between">
                <span className="text-3xl font-serif leading-none tracking-wide">
                  {focusedChar.text}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${confColor}`}>
                    {confPct}% conf
                  </span>
                  {deleteArmed ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { handleDeleteChar(focusedChar.offset); setDeleteArmed(false); }}
                        className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteArmed(false)}
                        className="px-1.5 py-0.5 text-[10px] rounded text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteArmed(true)}
                      title="Delete character"
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Confidence bar */}
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${confPct}%` }}
                />
              </div>

              {/* Position info */}
              <div className="text-[10px] text-gray-500 space-y-0.5">
                {focusedColIdx >= 0 && (
                  <div>
                    <span className="font-medium text-gray-700">
                      {columns[focusedColIdx]?.isRow ? "Row" : "Column"}{" "}
                      {focusedColIdx + 1}
                    </span>
                    {focusedPosInCol !== null && totalInCol !== null && (
                      <span className="ml-1">
                        · position {focusedPosInCol} / {totalInCol}
                      </span>
                    )}
                  </div>
                )}
                <div className="font-mono">
                  bbox ({Math.round(bx0 * 1000) / 10}%,{" "}
                  {Math.round(by0 * 1000) / 10}%) →{" "}
                  ({Math.round(bx1 * 1000) / 10}%,{" "}
                  {Math.round(by2 * 1000) / 10}%)
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Preview (before OCR) */}
      {preview && !result && (
        <div className="border border-gray-200 rounded overflow-hidden max-w-4xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full h-auto" />
        </div>
      )}

    </div>
  );
}
