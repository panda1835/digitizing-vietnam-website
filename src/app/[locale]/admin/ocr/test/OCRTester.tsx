"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import type { SpatialCharacter } from "@/lib/ocr-store";
import { detectColumns, reorderByColumns, Column } from "@/components/ocr-editor/useColumnDetection";
import { rerecognizeWithNomNaViet, type NomNaVietReplacement } from "@/lib/nomnaviet-ocr";

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
  // Screen-space rect of the focused input cell — drives the candidate-strip
  // popover (rendered with position:fixed so parent overflow can't clip it).
  const [focusedRect, setFocusedRect] = useState<{ left: number; top: number; height: number } | null>(null);
  // Screen-space rect of the displayed image — drives the input-cell panel
  // wrapper, also rendered with position:fixed so the panel can extend left
  // of the image without being clipped by parent overflow containers.
  const [imgScreenRect, setImgScreenRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [imgDims, setImgDims] = useState({ w: 1, h: 1 });
  const [zoom, setZoom] = useState(100);
  const [detMode, setDetMode] = useState<"auto" | "sp" | "hp">("auto");
  // Persist engine across reloads — every browser refresh otherwise reset
  // it to "kandianguji" and the NNV path silently skipped.
  const [engine, setEngine] = useState<"kandianguji" | "kimhannom" | "hybrid" | "kandianguji_nomnaviet">(
    () => {
      if (typeof window === "undefined") return "kandianguji";
      const saved = localStorage.getItem("ocrtest_engine");
      if (
        saved === "kandianguji" ||
        saved === "kimhannom" ||
        saved === "hybrid" ||
        saved === "kandianguji_nomnaviet"
      )
        return saved;
      return "kandianguji";
    }
  );
  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem("ocrtest_engine", engine);
  }, [engine]);
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

  // Delete character state (per-row delete confirmation in the column view)
  const [armedDeleteOffset, setArmedDeleteOffset] = useState<number | null>(null);

  // Region OCR
  const [ocrRegionLoading, setOcrRegionLoading] = useState(false);

  // Per-char re-OCR progress (Nôm Na Việt hybrid)
  const [nnvProgress, setNnvProgress] = useState<{ done: number; total: number } | null>(null);
  // In-page confirmation prompt for the NNV batch — replaces window.confirm
  // (which Chrome silently suppresses when the tab is not focused, which
  // happens whenever the slow kandi call finishes while the user is looking
  // at another window).
  const [nnvPendingConfirm, setNnvPendingConfirm] = useState<{
    eligible: number;
    estSec: number;
    slotJitterMs: number;
    resolve: (ok: boolean) => void;
  } | null>(null);
  // Only re-OCR chars whose kandi confidence is below this threshold (0–100).
  // 100 = send every char; lower = only the iffy ones.
  const [nnvConfThreshold, setNnvConfThreshold] = useState(100);
  // Log of each char sent to Nôm Na Việt and what came back.
  const [nnvReplacements, setNnvReplacements] = useState<NomNaVietReplacement[]>([]);

  const [candidateData, setCandidateData] = useState<SpatialCharacter[]>([]);
  const [candIndex, setCandIndex] = useState(0);

  // Low confidence review
  const [confThreshold, setConfThreshold] = useState(50);
  const [reviewIndex, setReviewIndex] = useState(0);

  const columns = detectColumns(spatialData);
  const charsWithBbox = spatialData.filter((c) => c.bbox && c.text.trim()).length;
  const rawText = spatialData.map((c) => c.text).join("");

  const selectedColumn = selectedCol !== null ? columns[selectedCol] ?? null : null;

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
    // eslint-disable-next-line no-console
    console.log(`[OCR] handleRun engine=${engine} threshold=${nnvConfThreshold}%`);
    setLoading(true);
    setError(null);
    setResult(null);
    setSpatialData([]);
    setSelectedCol(null);
    setFocusedOffset(null);
    setNnvReplacements([]);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("det_mode", detMode);
    // Nôm Na Việt hybrid reuses Kandianguji for detection — ask the server
    // for plain Kandianguji output, then re-OCR each bbox client-side.
    const upstreamEngine =
      engine === "kandianguji_nomnaviet" ? "kandianguji" : engine;
    formData.append("engine", upstreamEngine);
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

      let merged = data.spatialData;

      if (engine === "kandianguji_nomnaviet") {
        // Pre-count how many chars will actually be re-OCR'd so the user can
        // confirm before we kick off potentially hundreds of requests.
        // Threshold = 100% means "send everything with a bbox" — skip the
        // confidence filter entirely so chars Kandianguji marked at exactly
        // 1.0 still get sent.
        const threshold = nnvConfThreshold / 100;
        const sendAll = threshold >= 1;
        const eligible = data.spatialData.filter(
          (c) => c.bbox && (sendAll || c.confidence < threshold)
        ).length;
        // 1 in flight, ~1000 ms per request → ~1 req/sec.
        const concurrency = 1;
        const slotJitterMs = 1000;
        const estSec = Math.round((eligible * slotJitterMs * 1.0) / 1000);

        let runNnv = false;
        if (eligible === 0) {
          setError(
            `No characters fell below the re-OCR confidence threshold (${nnvConfThreshold}%) — showing Kandianguji results only. Raise the threshold to send chars to Nôm Na Việt.`
          );
        } else {
          runNnv = await new Promise<boolean>((resolve) => {
            setNnvPendingConfirm({ eligible, estSec, slotJitterMs, resolve });
          });
          setNnvPendingConfirm(null);
        }

        // eslint-disable-next-line no-console
        console.log(
          `[NNV] kandi returned ${data.spatialData.length} chars, ${data.spatialData.filter(c => c.bbox).length} with bbox, ${eligible} eligible (threshold=${threshold}, sendAll=${sendAll}). runNnv=${runNnv}`
        );

        if (runNnv) {
          // Load the same image into an HTMLImageElement so we can crop each
          // Kandianguji bbox to PNG and POST it to the Nôm Na Việt proxy.
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error("Failed to decode image for cropping"));
            el.src = URL.createObjectURL(file);
          });
          setNnvProgress({ done: 0, total: 0 });
          const rerec = await rerecognizeWithNomNaViet(img, data.spatialData, {
            concurrency,
            confidenceThreshold: threshold,
            slotJitterMs,
            onProgress: (done, total) => setNnvProgress({ done, total }),
            // Stream each char into the diff panel as it arrives so the user
            // sees the table grow live during a multi-minute run.
            onReplacement: (rep) =>
              setNnvReplacements((prev) => [...prev, rep]),
          });
          merged = rerec.spatialData;
          setNnvReplacements(rerec.replacements);
          // Print the kandi → NNV mapping table to the browser console so
          // the user can scan every char that was sent and what came back.
          // eslint-disable-next-line no-console
          console.table(
            rerec.replacements.map((r) => ({
              offset: r.offset,
              kandi: r.kandiChar,
              kandi_conf: r.kandiConf.toFixed(2),
              nnv: r.nnvChar ?? "—",
              nnv_conf: r.nnvConf?.toFixed(2) ?? "—",
              changed: r.changed ? "✓" : "",
            }))
          );
          URL.revokeObjectURL(img.src);
          setNnvProgress(null);
        }
        // If runNnv stayed false (eligible=0 or user cancelled), `merged`
        // keeps the Kandianguji-only spatialData and we fall through to
        // setResult below — so the page still shows the OCR you just paid
        // a minute for, instead of staying blank.
      }

      const rawText = merged.map((c) => c.text).join("");
      setResult({ ...data, spatialData: merged, rawText });
      setSpatialData(reorderByColumns(merged));
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
      setNnvProgress(null);
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

  // Apply a candidate AND advance focus — used by the candidate-strip
  // popover and the digit hotkey path. (The hotkey path lives in the
  // global keydown effect; it duplicates this advance logic inline because
  // it has access to the in-scope `columns` reference.)
  function applyChoiceAndAdvance(suggestion: string) {
    if (focusedOffset === null) return;
    handleCharChange(focusedOffset, suggestion);
    if (selectedCol !== null) {
      const col = columns[selectedCol];
      if (col) {
        const bboxChars = col.chars.filter((c) => c.bbox);
        const idx = bboxChars.findIndex((c) => c.offset === focusedOffset);
        const next = bboxChars[idx + 1];
        if (next) setFocusedOffset(next.offset);
        else if (selectedCol < columns.length - 1) handleSelectColumn(selectedCol + 1);
      }
    }
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
        return reorderByColumns(merged);
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
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      // The per-cell OCR inputs are <input data-char-offset="…"> — those
      // are an "OCR cell" and should still accept the digit-candidate
      // hotkey (preventDefault stops the digit from being typed). Other
      // inputs/textareas (search box, kim token, etc.) skip all hotkeys.
      const isOcrCellInput =
        tag === "INPUT" && target?.hasAttribute("data-char-offset");
      if ((tag === "INPUT" || tag === "TEXTAREA") && !isOcrCellInput) return;

      // Digit 1–9 — replace focused char with the Nth alternate candidate
      // and advance focus to the next char (mirrors ArrowDown behaviour).
      if (
        focusedOffset !== null &&
        !e.ctrlKey && !e.metaKey && !e.altKey &&
        e.key >= "1" && e.key <= "9"
      ) {
        const focusedChar = spatialData.find((c) => c.offset === focusedOffset);
        const choices = focusedChar?.choices ?? [];
        const candidate = choices[parseInt(e.key, 10) - 1];
        if (candidate) {
          e.preventDefault();
          handleSuggestApply(candidate);
          // Advance focus to the next bbox char in reading order.
          if (selectedCol !== null) {
            const col = columns[selectedCol];
            if (col) {
              const bboxChars = col.chars.filter((c) => c.bbox);
              const idx = bboxChars.findIndex((c) => c.offset === focusedOffset);
              const next = bboxChars[idx + 1];
              if (next) {
                setFocusedOffset(next.offset);
              } else if (selectedCol < columns.length - 1) {
                handleSelectColumn(selectedCol + 1);
              }
            }
          }
          return;
        }
      }

      // Inputs intercept arrow keys / Esc themselves — only the digit hotkey
      // above is allowed to bubble up from a focused OCR cell. Bail here so
      // we don't fight the input's own caret/Tab handling.
      if (isOcrCellInput) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCol, columns.length, focusedOffset, spatialData]);

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

  // Track the focused input's screen rect for the candidate-strip popover.
  useLayoutEffect(() => {
    if (focusedOffset === null) {
      setFocusedRect(null);
      return;
    }
    function update() {
      const el = document.querySelector(
        `[data-char-offset="${focusedOffset}"]`
      ) as HTMLElement | null;
      if (!el) {
        setFocusedRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setFocusedRect({ left: r.left, top: r.top, height: r.height });
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [focusedOffset, spatialData, selectedCol]);

  // Track the image's screen rect for the input-panel wrapper.
  useLayoutEffect(() => {
    function update() {
      const el = imgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setImgScreenRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [imgDims, result]);

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
              onChange={(e) => setEngine(e.target.value as "kandianguji" | "kimhannom" | "hybrid" | "kandianguji_nomnaviet")}
              disabled={loading}
              className="text-sm border border-gray-300 rounded px-2 py-2"
            >
              <option value="kandianguji">Kandianguji (看典古籍)</option>
              <option value="kimhannom">Kim Hán Nôm (金漢喃)</option>
              <option value="hybrid">Hybrid (Kandianguji boxes + Kim Hán Nôm text)</option>
              <option value="kandianguji_nomnaviet">Hybrid (Kandianguji boxes + Nôm Na Việt per-char)</option>
            </select>
            {engine === "kandianguji_nomnaviet" && (
              <label className="flex items-center gap-1 text-xs text-gray-600">
                Re-OCR if conf &lt;
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={nnvConfThreshold}
                  onChange={(e) => setNnvConfThreshold(Number(e.target.value) || 0)}
                  disabled={loading}
                  className="w-14 border border-gray-300 rounded px-1 py-1 text-xs"
                />
                %
              </label>
            )}
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
              {loading
                ? nnvProgress
                  ? `Re-OCR ${nnvProgress.done}/${nnvProgress.total || "…"}`
                  : "Running OCR…"
                : "Run Quick OCR"}
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

      {nnvPendingConfirm && (
        <div className="sticky top-2 z-30 flex items-center justify-between gap-3 bg-amber-50 border border-amber-300 rounded p-3 shadow-sm">
          <div className="text-sm text-amber-900">
            Ready to send <strong>{nnvPendingConfirm.eligible}</strong>{" "}
            characters to Nôm Na Việt (1 at a time, ~
            {nnvPendingConfirm.slotJitterMs} ms apart, est.{" "}
            <strong>{nnvPendingConfirm.estSec}s</strong>).
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => nnvPendingConfirm.resolve(false)}
              className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={() => nnvPendingConfirm.resolve(true)}
              className="px-3 py-1.5 text-sm font-medium rounded bg-amber-600 text-white hover:bg-amber-700"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {nnvReplacements.length > 0 && (
        <details className="text-sm border border-gray-200 rounded bg-gray-50">
          <summary className="cursor-pointer px-3 py-2 font-medium text-gray-700">
            Nôm Na Việt re-OCR log — {nnvReplacements.length} chars sent,{" "}
            {nnvReplacements.filter((r) => r.changed).length} changed,{" "}
            {nnvReplacements.filter((r) => r.nnvChar === null).length} failed
          </summary>
          <div className="max-h-72 overflow-auto px-3 pb-3">
            <table className="w-full text-xs font-mono">
              <thead className="text-gray-500 sticky top-0 bg-gray-50">
                <tr>
                  <th className="text-left py-1 pr-3">offset</th>
                  <th className="text-left pr-3">kandi</th>
                  <th className="text-left pr-3">conf</th>
                  <th className="text-left pr-3">nnv</th>
                  <th className="text-left pr-3">conf</th>
                  <th className="text-left">Δ</th>
                </tr>
              </thead>
              <tbody>
                {nnvReplacements.map((r) => (
                  <tr
                    key={r.offset}
                    className={`cursor-pointer hover:bg-yellow-50 ${
                      r.changed ? "bg-amber-50/60" : ""
                    }`}
                    onClick={() => setFocusedOffset(r.offset)}
                  >
                    <td className="py-0.5 pr-3 text-gray-500">{r.offset}</td>
                    <td className="pr-3 text-base">{r.kandiChar}</td>
                    <td className="pr-3 text-gray-500">
                      {r.kandiConf.toFixed(2)}
                    </td>
                    <td className="pr-3 text-base">
                      {r.nnvChar ?? <span className="text-red-500">—</span>}
                    </td>
                    <td className="pr-3 text-gray-500">
                      {r.nnvConf?.toFixed(2) ?? "—"}
                    </td>
                    <td>{r.changed ? "✓" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
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

                  const cellRenders = cellPositions.map((pos) => {
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
                            pointerEvents: "auto",
                          }}
                          className={`text-center font-serif outline-none bg-transparent ${textColor} ${
                            isFocused ? "border-2 border-indigo-500 ring-2 ring-indigo-300 bg-indigo-50 rounded" : "border-0"
                          }`}
                        />
                        {/* Candidate strip rendered at the top of OCRTester
                            via position:fixed (see end of file) so it
                            escapes the image-pane overflow clipping. */}
                      </div>
                    );
                  });

                  // Wrap the panel + cells in a position:fixed anchor over
                  // the image's screen rect so the panel can extend past
                  // the image's left edge without parent overflow clipping
                  // hiding it. Wrapper is pointer-events:none so clicks
                  // outside cells fall through to the image's own handlers.
                  if (!imgScreenRect) return null;
                  return (
                    <div
                      style={{
                        position: "fixed",
                        left: imgScreenRect.left,
                        top: imgScreenRect.top,
                        width: imgScreenRect.width,
                        height: imgScreenRect.height,
                        pointerEvents: "none",
                        zIndex: 60,
                      }}
                    >
                      {elements.concat(cellRenders)}
                    </div>
                  );
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

              {/* Stats */}
              <div className="text-xs text-gray-400 space-y-1">
                <p>Image: {result.pageWidth} × {result.pageHeight}px</p>
                <p>Spatial items: {spatialData.length}</p>
                <p>With bbox: {charsWithBbox}</p>
                <p>Columns: {columns.length}</p>
              </div>

              {/* Alternate candidate suggestions from OCR choices */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Alternate Candidates
                </p>
                {focusedOffset === null ? (
                  <p className="text-[11px] text-gray-400 italic">Focus a character to see candidates</p>
                ) : (() => {
                  const focusedChar = spatialData.find((c) => c.offset === focusedOffset);
                  const choices = focusedChar?.choices ?? [];
                  if (choices.length === 0) return (
                    <p className="text-[11px] text-gray-400 italic">No candidates available for this character</p>
                  );
                  return (
                    <div className="flex flex-wrap gap-1">
                      {choices.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestApply(s)}
                          title={i < 9 ? `Press ${i + 1} to apply` : undefined}
                          className="relative px-2 py-1 text-base rounded border border-gray-300 hover:bg-indigo-50 hover:border-indigo-400"
                        >
                          {i < 9 && (
                            <span className="absolute -top-1.5 -left-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] font-semibold rounded-full bg-indigo-500 text-white leading-none">
                              {i + 1}
                            </span>
                          )}
                          {s}
                        </button>
                      ))}
                    </div>
                  );
                })()}
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

      {/* Preview (before OCR) */}
      {preview && !result && (
        <div className="border border-gray-200 rounded overflow-hidden max-w-4xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full h-auto" />
        </div>
      )}

      {/* Candidate strip — fixed-position so it overlays document body and
          escapes the image-pane overflow clipping. */}
      {(() => {
        if (!focusedRect) return null;
        const focusedChar = focusedOffset !== null
          ? spatialData.find((c) => c.offset === focusedOffset)
          : null;
        const choices = focusedChar?.choices ?? [];
        if (choices.length === 0) return null;
        return (
          <div
            style={{
              position: "fixed",
              left: focusedRect.left - 6,
              top: focusedRect.top,
              transform: "translateX(-100%)",
              zIndex: 1000,
            }}
            className="flex flex-row-reverse bg-white border border-gray-200 rounded shadow"
          >
            {choices.slice(0, 6).map((s, i) => (
              <button
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyChoiceAndAdvance(s);
                }}
                title={`Press ${i + 1} to apply`}
                style={{ width: focusedRect.height, height: focusedRect.height }}
                className="relative flex items-center justify-center hover:bg-indigo-50 border-r border-gray-100 first:border-r-0"
              >
                <span className="absolute left-1/2 -translate-x-1/2 -top-2 inline-flex items-center justify-center w-2.5 h-2.5 text-[6px] font-semibold rounded-full bg-indigo-500 text-white leading-none ring-1 ring-white pointer-events-none">
                  {i + 1}
                </span>
                <span
                  className="font-serif"
                  style={{ fontSize: Math.round(focusedRect.height * 0.65), lineHeight: 1 }}
                >
                  {s}
                </span>
              </button>
            ))}
          </div>
        );
      })()}

    </div>
  );
}
