"use client";

import { useState, useRef, useEffect } from "react";
import type { SpatialCharacter } from "@/lib/ocr-store";

interface Zone {
  id: number;
  rect: { x: number; y: number; w: number; h: number }; // normalized [0,1]
  type: "column" | "row";
  label: string;
}

interface GuidedOCRProps {
  preview: string | null;
  file: File | null;
}

export default function GuidedOCR({ preview, file }: GuidedOCRProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [imgDims, setImgDims] = useState({ w: 1, h: 1 });
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoom, setZoom] = useState(100);
  const [nextId, setNextId] = useState(1);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // OCR state
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<SpatialCharacter[] | null>(null);
  const [groupedText, setGroupedText] = useState<Array<{ zone: Zone; chars: SpatialCharacter[]; text: string }>>([]);
  const [unassigned, setUnassigned] = useState<SpatialCharacter[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleImgLoad() {
    if (imgRef.current) {
      setImgDims({ w: imgRef.current.clientWidth, h: imgRef.current.clientHeight });
    }
  }

  // Update dims when zoom changes
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

  useEffect(() => {
    if (canvasRef.current && imgDims.w > 1) {
      canvasRef.current.width = imgDims.w;
      canvasRef.current.height = imgDims.h;
    }
  }, [imgDims]);

  // ── Zone drawing ──

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (ocrResult) return; // Don't draw after OCR
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsDrawing(true);
    setDrawStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDrawRect(null);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
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
    redrawCanvas(newRect);
  }

  function handleMouseUp() {
    setIsDrawing(false);
    if (drawRect && drawRect.w > 10 && drawRect.h > 10) {
      const sw = imgDims.w || 1;
      const sh = imgDims.h || 1;
      const normalized = {
        x: drawRect.x / sw,
        y: drawRect.y / sh,
        w: drawRect.w / sw,
        h: drawRect.h / sh,
      };
      // Auto-detect type: wider than tall = row, otherwise column
      const type = normalized.w > normalized.h * 1.5 ? "row" : "column";
      const newZone: Zone = {
        id: nextId,
        rect: normalized,
        type,
        label: `${type === "row" ? "R" : "C"}${nextId}`,
      };
      setZones((prev) => [...prev, newZone]);
      setNextId((n) => n + 1);
    }
    setDrawRect(null);
    setDrawStart(null);
    clearCanvas();
  }

  function redrawCanvas(activeRect?: { x: number; y: number; w: number; h: number }) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (activeRect) {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 2;
      ctx.strokeRect(activeRect.x, activeRect.y, activeRect.w, activeRect.h);
    }
  }

  function clearCanvas() {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }

  function removeZone(id: number) {
    setZones((prev) => prev.filter((z) => z.id !== id));
  }

  function toggleZoneType(id: number) {
    setZones((prev) =>
      prev.map((z) =>
        z.id === id
          ? { ...z, type: z.type === "column" ? "row" : "column", label: `${z.type === "column" ? "R" : "C"}${z.id}` }
          : z
      )
    );
  }

  function moveZone(id: number, direction: -1 | 1) {
    setZones((prev) => {
      const idx = prev.findIndex((z) => z.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }

  // ── Run OCR ──

  async function handleRunOCR() {
    if (!file || zones.length === 0) return;
    setLoading(true);
    setError(null);
    setOcrResult(null);
    setGroupedText([]);
    setUnassigned([]);

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
      const data = await res.json();
      const spatial: SpatialCharacter[] = data.spatialData;
      setOcrResult(spatial);

      // Assign characters to zones
      const assigned = new Set<number>();
      const groups: Array<{ zone: Zone; chars: SpatialCharacter[]; text: string }> = [];

      for (const zone of zones) {
        const zoneChars: SpatialCharacter[] = [];
        for (let i = 0; i < spatial.length; i++) {
          const c = spatial[i];
          if (!c.bbox || !c.text.trim() || assigned.has(i)) continue;
          const cx = (c.bbox[0].x + c.bbox[2].x) / 2;
          const cy = (c.bbox[0].y + c.bbox[2].y) / 2;
          if (
            cx >= zone.rect.x && cx <= zone.rect.x + zone.rect.w &&
            cy >= zone.rect.y && cy <= zone.rect.y + zone.rect.h
          ) {
            zoneChars.push(c);
            assigned.add(i);
          }
        }

        // Sort within zone based on type
        if (zone.type === "column") {
          // Top to bottom, RTL for sub-columns
          zoneChars.sort((a, b) => {
            const ax = (a.bbox![0].x + a.bbox![2].x) / 2;
            const bx = (b.bbox![0].x + b.bbox![2].x) / 2;
            const ay = (a.bbox![0].y + a.bbox![2].y) / 2;
            const by = (b.bbox![0].y + b.bbox![2].y) / 2;
            const avgW = zoneChars.reduce((s, c) => {
              const xs = c.bbox!.map(v => v.x);
              return s + (Math.max(...xs) - Math.min(...xs));
            }, 0) / zoneChars.length;
            // If horizontally close, sort by Y
            if (Math.abs(ax - bx) < avgW * 0.6) return ay - by;
            // Otherwise RTL
            return bx - ax;
          });
        } else {
          // Left to right
          zoneChars.sort((a, b) => {
            const ax = (a.bbox![0].x + a.bbox![2].x) / 2;
            const bx = (b.bbox![0].x + b.bbox![2].x) / 2;
            return ax - bx;
          });
        }

        const text = zoneChars.map((c) => c.text).join("");
        groups.push({ zone, chars: zoneChars, text });
      }

      // Collect unassigned
      const unassignedChars = spatial.filter((c, i) => c.bbox && c.text.trim() && !assigned.has(i));
      setGroupedText(groups);
      setUnassigned(unassignedChars);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setOcrResult(null);
    setGroupedText([]);
    setUnassigned([]);
    setSelectedZoneId(null);
  }

  const sw = imgDims.w;
  const sh = imgDims.h;

  return (
    <div className="flex flex-col gap-4">
      {!preview && (
        <p className="text-sm text-gray-500">Upload an image first to define zones.</p>
      )}

      {preview && (
        <div className="flex gap-0 border border-gray-200 rounded overflow-hidden" style={{ height: "calc(100vh - 260px)" }}>

          {/* Image pane with zone overlays */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 uppercase tracking-wide flex items-center gap-3">
              <span>{ocrResult ? "Results" : "Draw zones in reading order"}</span>
              <div className="ml-auto flex items-center gap-1 normal-case">
                <button onClick={() => setZoom((z) => Math.max(25, z - 25))} className="px-1.5 py-0.5 text-[10px] rounded border border-gray-300 hover:bg-gray-100">−</button>
                <span className="text-[10px] text-gray-500 w-8 text-center">{zoom}%</span>
                <button onClick={() => setZoom((z) => Math.min(300, z + 25))} className="px-1.5 py-0.5 text-[10px] rounded border border-gray-300 hover:bg-gray-100">+</button>
                <button onClick={() => setZoom(100)} className="px-1.5 py-0.5 text-[10px] rounded border border-gray-300 hover:bg-gray-100 ml-1">Fit</button>
              </div>
              {!ocrResult && zones.length > 0 && (
                <button
                  onClick={handleRunOCR}
                  disabled={loading}
                  className="px-3 py-1 text-xs font-medium rounded bg-branding-black text-white hover:bg-gray-800 disabled:opacity-40 normal-case"
                >
                  {loading ? "Running OCR…" : `Run OCR (${zones.length} zones)`}
                </button>
              )}
              {ocrResult && (
                <button
                  onClick={handleReset}
                  className="px-3 py-1 text-xs font-medium rounded border border-gray-300 text-gray-600 hover:bg-gray-100 normal-case"
                >
                  Reset OCR
                </button>
              )}
            </div>
            <div className="flex-1 overflow-auto relative" ref={containerRef}>
              <div className="relative inline-block" style={{ width: `${zoom}%` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={preview}
                  alt="Source"
                  className="block max-w-none"
                  style={{ width: "100%", height: "auto" }}
                  onLoad={handleImgLoad}
                  draggable={false}
                />

                {/* Drawing canvas */}
                {!ocrResult && (
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => { if (isDrawing) { setIsDrawing(false); setDrawRect(null); clearCanvas(); } }}
                    className="absolute inset-0 z-20 cursor-crosshair"
                  />
                )}

                {/* Zone overlays */}
                {zones.map((zone, i) => {
                  const left = zone.rect.x * sw;
                  const top = zone.rect.y * sh;
                  const width = zone.rect.w * sw;
                  const height = zone.rect.h * sh;
                  const isSelected = selectedZoneId === zone.id;

                  return (
                    <div
                      key={zone.id}
                      onClick={() => setSelectedZoneId(isSelected ? null : zone.id)}
                      style={{ left, top, width, height, position: "absolute", zIndex: 5 }}
                      className={`border-2 transition-colors ${
                        isSelected
                          ? "border-red-500 bg-red-500/10"
                          : zone.type === "row"
                          ? "border-emerald-400 bg-emerald-400/10"
                          : "border-indigo-400 bg-indigo-400/10"
                      } ${ocrResult ? "pointer-events-none" : "cursor-pointer"}`}
                    >
                      <span
                        className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected
                            ? "bg-red-500 text-white"
                            : zone.type === "row"
                            ? "bg-emerald-500 text-white"
                            : "bg-indigo-500 text-white"
                        }`}
                      >
                        {i + 1}. {zone.type === "row" ? "Row" : "Col"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right pane: zone list + results */}
          <div className="w-1/3 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 uppercase tracking-wide">
              {ocrResult ? "OCR Results by Zone" : `Zones (${zones.length})`}
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">

              {/* Zone list (before OCR) */}
              {!ocrResult && zones.length === 0 && (
                <p className="text-xs text-gray-400 italic">
                  Draw rectangles on the image to define text zones. They will be processed in the order shown here.
                </p>
              )}

              {!ocrResult && zones.map((zone, i) => (
                <div
                  key={zone.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border text-xs ${
                    selectedZoneId === zone.id ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                  onClick={() => setSelectedZoneId(zone.id)}
                >
                  <span className="font-bold text-gray-500 w-5">{i + 1}.</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleZoneType(zone.id); }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      zone.type === "row"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {zone.type === "row" ? "Row" : "Col"}
                  </button>
                  <span className="flex-1 text-gray-500 truncate">
                    {Math.round(zone.rect.w * 100)}% × {Math.round(zone.rect.h * 100)}%
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveZone(zone.id, -1); }}
                    disabled={i === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >↑</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveZone(zone.id, 1); }}
                    disabled={i === zones.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >↓</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeZone(zone.id); }}
                    className="text-gray-400 hover:text-red-500"
                  >×</button>
                </div>
              ))}

              {!ocrResult && zones.length > 0 && (
                <button
                  onClick={() => { setZones([]); setNextId(1); }}
                  className="text-[10px] text-gray-400 hover:text-red-500 self-start"
                >
                  Clear all zones
                </button>
              )}

              {/* Results (after OCR) */}
              {groupedText.map((group, i) => (
                <div key={group.zone.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      group.zone.type === "row"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}>
                      {i + 1}. {group.zone.type === "row" ? "Row" : "Col"}
                    </span>
                    <span className="text-[10px] text-gray-400">{group.chars.length} chars</span>
                  </div>
                  <pre className="text-xs font-sans whitespace-pre-wrap break-all bg-gray-50 border border-gray-200 rounded p-2 max-h-32 overflow-y-auto">
                    {group.text || "(empty)"}
                  </pre>
                </div>
              ))}

              {unassigned.length > 0 && (
                <div className="flex flex-col gap-1 border-t border-gray-200 pt-2">
                  <span className="text-[10px] font-bold text-gray-400">
                    Unassigned ({unassigned.length} chars)
                  </span>
                  <pre className="text-xs font-sans whitespace-pre-wrap break-all bg-yellow-50 border border-yellow-200 rounded p-2 max-h-24 overflow-y-auto">
                    {unassigned.map((c) => c.text).join("")}
                  </pre>
                </div>
              )}

              {/* Keyboard help */}
              {!ocrResult && (
                <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-2 mt-auto">
                  <p>Draw rectangles in reading order.</p>
                  <p>Click a zone's type badge to toggle Col/Row.</p>
                  <p>Use ↑↓ arrows to reorder zones.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
