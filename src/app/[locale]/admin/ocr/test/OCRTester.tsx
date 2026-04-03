"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  const [zoom, setZoom] = useState(100); // percentage

  // Drag-to-add state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const columns = detectColumns(spatialData);
  const charsWithBbox = spatialData.filter((c) => c.bbox && c.text.trim()).length;
  const rawText = spatialData.map((c) => c.text).join("");

  // Selected column object
  const selectedColumn = selectedCol !== null ? columns[selectedCol] ?? null : null;

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
      setSpatialData(reorderByColumns(data.spatialData));
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

  // Update dims when zoom changes
  useEffect(() => {
    // Small delay for DOM to update after zoom change
    const t = setTimeout(() => {
      if (imgRef.current) {
        const w = imgRef.current.clientWidth;
        const h = imgRef.current.clientHeight;
        if (w > 1 && h > 1) setImgDims({ w, h });
      }
    }, 50);
    return () => clearTimeout(t);
  }, [zoom]);

  // Update dims when result arrives and image is already loaded
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

    // Draw selection rectangle on canvas
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
      // Drag completed — prompt for character
      const charText = prompt("Enter character for this area:");
      if (charText && charText.trim()) {
        addCharAtRect(drawRect, charText.trim());
      }
    } else {
      // Simple click — check if it's on a column, otherwise deselect
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
    }

    // Clear canvas
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setDrawRect(null);
    setDrawStart(null);
  }

  function addCharAtRect(rect: { x: number; y: number; w: number; h: number }, text: string) {
    const sw = scaleX || 1;
    const sh = scaleY || 1;

    // Convert pixel rect to normalized [0,1] bbox
    const bbox: Array<{ x: number; y: number }> = [
      { x: rect.x / sw, y: rect.y / sh },
      { x: (rect.x + rect.w) / sw, y: rect.y / sh },
      { x: (rect.x + rect.w) / sw, y: (rect.y + rect.h) / sh },
      { x: rect.x / sw, y: (rect.y + rect.h) / sh },
    ];

    const newCenter = {
      x: (bbox[0].x + bbox[2].x) / 2,
      y: (bbox[0].y + bbox[2].y) / 2,
    };

    // Find insertion point: RTL (higher X first), then TTB (lower Y first)
    // We find the last existing character that should come BEFORE the new one,
    // then insert after it.
    const validChars = spatialData.filter((c) => c.bbox && c.text.trim());
    const avgW = validChars.length > 0
      ? validChars.reduce((s, c) => {
          const xs = c.bbox!.map((v) => v.x);
          return s + (Math.max(...xs) - Math.min(...xs));
        }, 0) / validChars.length
      : 0.02;
    const threshold = avgW * 0.5;

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
      // Find the last char in this column that's above the new char (or all of them if adding at bottom)
      let lastBeforeIdx = -1;
      for (const colChar of col.chars) {
        if (!colChar.bbox) continue;
        const cy = (colChar.bbox[0].y + colChar.bbox[2].y) / 2;
        if (cy <= newCenter.y) {
          // Find this char's index in spatialData
          const sdIdx = spatialData.findIndex((c) => c.offset === colChar.offset);
          if (sdIdx >= 0) lastBeforeIdx = sdIdx;
        }
      }

      if (lastBeforeIdx >= 0) {
        // Insert right after the last character above us in this column
        insertIndex = lastBeforeIdx + 1;
      } else {
        // New char is above all chars in the column — insert before the first
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
      // Recalculate offsets
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
      // Don't capture keys when typing in an input
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

  // Mouse wheel zoom on image container
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

  // Focus management: when focusedOffset changes, focus the corresponding input
  useEffect(() => {
    if (focusedOffset === null) return;
    const el = document.querySelector(`[data-char-offset="${focusedOffset}"]`) as HTMLInputElement | null;
    if (el) el.focus();
  }, [focusedOffset, selectedCol]);

  const scaleX = imgDims.w;
  const scaleY = imgDims.h;

  return (
    <div className="flex flex-col gap-4">
      {/* Run button */}
      {file && !result && (
        <button
          onClick={handleRun}
          disabled={!file || loading}
          className="self-start px-4 py-2 text-sm font-medium rounded bg-branding-black text-white hover:bg-gray-800 disabled:opacity-40"
        >
          {loading ? "Running OCR…" : "Run Quick OCR"}
        </button>
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
                      onClick={() => {
                        const colIdx = columns.findIndex((c) =>
                          c.chars.some((ch) => ch.offset === char.offset)
                        );
                        if (colIdx >= 0) setSelectedCol(colIdx);
                        setFocusedOffset(char.offset);
                      }}
                      className={`cursor-pointer transition-colors ${confColor}`}
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
                  onMouseLeave={() => { if (isDrawing) handleCanvasMouseUp(); }}
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
                      className={`cursor-pointer border-2 transition-colors ${
                        isSelected
                          ? "border-red-500 bg-red-500/5"
                          : col.isRow
                          ? "border-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20"
                          : "border-indigo-400 bg-indigo-400/10 hover:bg-indigo-400/20"
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

                {/* Character input overlays for selected column */}
                {selectedColumn &&
                  selectedColumn.chars.map((char, charIdx) => {
                    if (!char.bbox) return null;

                    const left = char.bbox[0].x * scaleX;
                    const top = char.bbox[0].y * scaleY;
                    const boxW = Math.abs(char.bbox[1].x - char.bbox[0].x) * scaleX;
                    const boxH = Math.abs(char.bbox[3].y - char.bbox[0].y) * scaleY;
                    const isFocused = char.offset === focusedOffset;

                    const allCharsInCol = selectedColumn.chars.filter((c) => c.bbox);

                    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
                      if (e.key === "Tab" && !e.shiftKey) {
                        e.preventDefault();
                        const next = allCharsInCol[charIdx + 1];
                        if (next) {
                          setFocusedOffset(next.offset);
                        } else if (selectedCol !== null && selectedCol < columns.length - 1) {
                          handleSelectColumn(selectedCol + 1);
                        }
                      } else if (e.key === "Tab" && e.shiftKey) {
                        e.preventDefault();
                        const prev = allCharsInCol[charIdx - 1];
                        if (prev) {
                          setFocusedOffset(prev.offset);
                        } else if (selectedCol !== null && selectedCol > 0) {
                          const prevCol = columns[selectedCol - 1];
                          setSelectedCol(selectedCol - 1);
                          const lastChar = prevCol.chars.filter((c) => c.bbox).at(-1);
                          if (lastChar) setFocusedOffset(lastChar.offset);
                        }
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        const next = allCharsInCol[charIdx + 1];
                        if (next) {
                          setFocusedOffset(next.offset);
                        } else if (selectedCol !== null && selectedCol < columns.length - 1) {
                          handleSelectColumn(selectedCol + 1);
                        }
                      }
                    }

                    const conf = char.confidence;
                    const confBorder = isFocused
                      ? "border-red-500 ring-1 ring-red-400"
                      : conf < 0.3
                      ? "border-red-400 bg-red-50/90"
                      : conf < 0.5
                      ? "border-yellow-400 bg-yellow-50/90"
                      : "border-indigo-300 bg-white/90";

                    return (
                      <input
                        key={char.offset}
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
                          left: left - boxW - 4,
                          top,
                          width: boxW,
                          height: boxH,
                          fontSize: Math.max(10, boxH * 0.7),
                          lineHeight: 1,
                          padding: "1px",
                          zIndex: 10,
                        }}
                        className={`border rounded text-center font-sans shadow-sm outline-none transition-colors ${confBorder}`}
                      />
                    );
                  })}
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

              {/* Selected column text */}
              {selectedColumn && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Column {(selectedCol ?? 0) + 1} ({selectedColumn.chars.length} chars)
                  </p>
                  <p className="text-sm bg-indigo-50 border border-indigo-200 rounded p-3 break-all">
                    {selectedColumn.chars.map((c) => c.text).join("")}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="text-xs text-gray-400 space-y-1">
                <p>Image: {result.pageWidth} × {result.pageHeight}px</p>
                <p>Spatial items: {spatialData.length}</p>
                <p>With bbox: {charsWithBbox}</p>
                <p>Columns: {columns.length}</p>
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
            </div>
          </div>
        </div>
      )}

      {/* Preview (before OCR) */}
      {preview && !result && (
        <div className="border border-gray-200 rounded overflow-hidden max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full h-auto" />
        </div>
      )}
    </div>
  );
}
