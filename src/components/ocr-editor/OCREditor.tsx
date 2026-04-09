"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { SpatialCharacter, OcrPageData } from "@/lib/ocr-store";
import { getCanvasesFromManifest, CanvasInfo } from "@/lib/iiif-utils";
import { useColumnDetection, reorderByColumns, type LayoutMode } from "./useColumnDetection";
import { useOCRSave } from "./useOCRSave";
import OCRTextPane from "./OCRTextPane";
import OCRImagePane from "./OCRImagePane";
import OCRToolbox from "./OCRToolbox";
import ColumnTranscriptionView from "./ColumnTranscriptionView";
import LowConfReviewModal from "./LowConfReviewModal";

interface OCREditorProps {
  slug: string;
  initialPage: number;
  pageCount: number;
  imageUrlPattern?: string;
  manifestUrl?: string;
}

type EditorMode = "loading" | "no-data" | "editing";
type OcrMode = "quick" | "guided";

export default function OCREditor({
  slug,
  initialPage,
  pageCount,
  imageUrlPattern,
  manifestUrl,
}: OCREditorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [page, setPageState] = useState(initialPage > 0 ? initialPage : (() => {
    const rawPage = parseInt(searchParams.get("page") ?? "", 10);
    return !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
  })());

  // Sync page when initialPage changes (e.g. parent navigates to a different page)
  useEffect(() => {
    if (initialPage > 0) setPageState(initialPage);
  }, [initialPage]);

  // Core state
  const [spatialData, setSpatialData] = useState<SpatialCharacter[]>([]);
  const [candidateData, setCandidateData] = useState<SpatialCharacter[]>([]);
  const [rawText, setRawText] = useState("");
  const [editorMode, setEditorMode] = useState<EditorMode>("loading");
  const [error, setError] = useState<string | null>(null);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number | null>(null);
  const [focusedOffset, setFocusedOffset] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // IIIF manifest images
  const [canvases, setCanvases] = useState<CanvasInfo[]>([]);
  const [ocrRunning, setOcrRunning] = useState(false);

  // Override image URL when preprocessing was applied (so editor shows the same image OCR saw)
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [thoroughOcr, setThoroughOcr] = useState(false);
  const [showTranscriptionView, setShowTranscriptionView] = useState(false);
  const [detMode, setDetMode] = useState<"auto" | "sp" | "hp">("auto");
  const [viewMode, setViewMode] = useState<"charBox" | "column">("charBox");
  const [layoutMode, setLayoutMode] = useState<"simple" | "commentary">("commentary");
  const [showLowConfReview, setShowLowConfReview] = useState(false);
  const [reviewThreshold, setReviewThreshold] = useState(50);

  // Preprocessing
  const [ppInvert, setPpInvert] = useState(false);
  const [ppContrast, setPpContrast] = useState(100);
  const [ppBrightness, setPpBrightness] = useState(100);
  const [ppGrayscale, setPpGrayscale] = useState(false);
  const [ppDenoise, setPpDenoise] = useState(false);
  const [ppCleanBackground, setPpCleanBackground] = useState(0);
  const [ppAdaptiveThreshold, setPpAdaptiveThreshold] = useState(false);
  const [ppAdaptiveBlockSize, setPpAdaptiveBlockSize] = useState(15);
  const [ppAdaptiveC, setPpAdaptiveC] = useState(10);
  const [ppSharpen, setPpSharpen] = useState(false);

  // Crop — normalized [0,1] rectangle, null = full image
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropDraft, setCropDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const cropImgRef = useRef<HTMLImageElement>(null);
  const noDataContainerRef = useRef<HTMLDivElement>(null);
  const [noDataZoom, setNoDataZoom] = useState(100);

  // Page progress tracking
  const [completedPages, setCompletedPages] = useState<Set<number>>(new Set());

  // Manual bbox overrides for columns (persists across column re-detection)
  const [bboxOverrides, setBboxOverrides] = useState<Record<number, { minX: number; maxX: number; minY: number; maxY: number }>>({});

  const detectedColumns = useColumnDetection(spatialData, layoutMode);

  // Apply manual bbox overrides to detected columns
  const columns = useMemo(() => {
    return detectedColumns.map((col, i) => {
      const override = bboxOverrides[i];
      if (override) return { ...col, bbox: override };
      return col;
    });
  }, [detectedColumns, bboxOverrides]);

  // Characters not assigned to any detected column
  const orphanedChars = useMemo(() => {
    const assignedOffsets = new Set<number>();
    for (const col of columns) {
      for (const c of col.chars) assignedOffsets.add(c.offset);
    }
    return spatialData.filter((c) => c.bbox && !assignedOffsets.has(c.offset));
  }, [spatialData, columns]);

  const lowConfQueue = useMemo(() => {
    return spatialData.filter((c) => c.bbox && c.confidence < reviewThreshold / 100);
  }, [spatialData, reviewThreshold]);

  const handleSaved = useCallback((newRawText: string) => {
    setRawText(newRawText);
    setSaveStatus("saved");
    setCompletedPages((prev) => new Set([...prev, page]));
    setTimeout(() => setSaveStatus("idle"), 2000);
  }, [page]);

  const save = useOCRSave(slug, page, handleSaved);

  // Fetch IIIF manifest for page images
  useEffect(() => {
    if (!manifestUrl) return;
    fetch(manifestUrl)
      .then((r) => r.json())
      .then((manifest) => {
        setCanvases(getCanvasesFromManifest(manifest));
      })
      .catch(() => {});
  }, [manifestUrl]);

  // Load existing OCR data for current page
  useEffect(() => {
    setEditorMode("loading");
    setError(null);
    setSelectedColumnIndex(null);
    setFocusedOffset(null);
    setSaveStatus("idle");
    setProcessedImageUrl(null);
    setBboxOverrides({});

    fetch(`/api/ocr/spatial-data/${encodeURIComponent(slug)}/${page}`)
      .then((r) => {
        if (!r.ok) {
          if (r.status === 404) {
            // No OCR data for this page yet
            setSpatialData([]);
            setRawText("");
            setEditorMode("no-data");
            return null;
          }
          throw new Error(`HTTP ${r.status}`);
        }
        return r.json() as Promise<OcrPageData>;
      })
      .then((data) => {
        if (data) {
          const reordered = reorderByColumns(data.spatialData);
          setSpatialData(reordered);
          setRawText(reordered.map((c) => c.text).join(""));
          setCandidateData(data.candidateData ?? []);
          setEditorMode("editing");
          setCompletedPages((prev) => new Set([...prev, page]));
        }
      })
      .catch((e) => {
        setSpatialData([]);
        setRawText("");
        setEditorMode("no-data");
      });
  }, [slug, page]);

  // Auto-select first column when entering edit mode
  useEffect(() => {
    if (editorMode === "editing" && columns.length > 0 && selectedColumnIndex === null) {
      setSelectedColumnIndex(0);
      const firstChar = columns[0].chars.find((c) => c.bbox);
      if (firstChar) setFocusedOffset(firstChar.offset);
    }
  }, [columns, selectedColumnIndex, editorMode]);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Escape") {
        setSelectedColumnIndex(null);
        setFocusedOffset(null);
      } else if (e.key === "ArrowLeft" && selectedColumnIndex !== null && selectedColumnIndex > 0) {
        e.preventDefault();
        handleSelectColumn(selectedColumnIndex - 1);
      } else if (e.key === "ArrowRight" && selectedColumnIndex !== null && selectedColumnIndex < columns.length - 1) {
        e.preventDefault();
        handleSelectColumn(selectedColumnIndex + 1);
      } else if (e.key === "ArrowDown" && selectedColumnIndex !== null) {
        e.preventDefault();
        const col = columns[selectedColumnIndex];
        if (!col) return;
        const bboxChars = col.chars.filter((c) => c.bbox);
        const currentIdx = bboxChars.findIndex((c) => c.offset === focusedOffset);
        const next = bboxChars[currentIdx + 1];
        if (next) setFocusedOffset(next.offset);
        else if (selectedColumnIndex < columns.length - 1) handleSelectColumn(selectedColumnIndex + 1);
      } else if (e.key === "ArrowUp" && selectedColumnIndex !== null) {
        e.preventDefault();
        const col = columns[selectedColumnIndex];
        if (!col) return;
        const bboxChars = col.chars.filter((c) => c.bbox);
        const currentIdx = bboxChars.findIndex((c) => c.offset === focusedOffset);
        const prev = bboxChars[currentIdx - 1];
        if (prev) setFocusedOffset(prev.offset);
        else if (selectedColumnIndex > 0) {
          const prevCol = columns[selectedColumnIndex - 1];
          setSelectedColumnIndex(selectedColumnIndex - 1);
          const lastChar = prevCol.chars.filter((c) => c.bbox).at(-1);
          if (lastChar) setFocusedOffset(lastChar.offset);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedColumnIndex, focusedOffset, columns]);

  function setPage(p: number) {
    setPageState(p);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleSelectColumn(ci: number) {
    setSelectedColumnIndex(ci);
    const firstChar = columns[ci]?.chars.find((c) => c.bbox);
    if (firstChar) setFocusedOffset(firstChar.offset);
  }

  function handleCharChange(offset: number, newText: string) {
    setSpatialData((prev) => {
      const updated = prev.map((c) =>
        c.offset === offset ? { ...c, text: newText } : c
      );
      setSaveStatus("saving");
      save(updated);
      return updated;
    });
  }

  function handleDeleteChar(offset: number) {
    setSpatialData((prev) => {
      const next = prev.filter((c) => c.offset !== offset);
      // Recalculate offsets
      let off = 0;
      for (const c of next) {
        c.offset = off;
        off += c.text.length;
      }
      setSaveStatus("saving");
      save(next);
      return next;
    });
  }

  function handleSuggestApply(offset: number, suggestion: string) {
    handleCharChange(offset, suggestion);
  }

  function handleMoveColumn(colIndex: number, deltaX: number, deltaY: number) {
    setSpatialData((prev) => {
      const col = columns[colIndex];
      if (!col) return prev;
      const movedOffsets = new Set(col.chars.map((c) => c.offset));
      const updated = prev.map((c) => {
        if (!movedOffsets.has(c.offset) || !c.bbox) return c;
        return {
          ...c,
          bbox: c.bbox.map((v) => ({
            x: Math.max(0, Math.min(1, v.x + deltaX)),
            y: Math.max(0, Math.min(1, v.y + deltaY)),
          })),
        };
      });
      setSaveStatus("saving");
      save(updated);
      return updated;
    });
  }

  function handleResizeColumn(colIndex: number, newBbox: { minX: number; maxX: number; minY: number; maxY: number }) {
    // Store the manual bbox override so it persists across column re-detection
    setBboxOverrides((prev) => ({ ...prev, [colIndex]: newBbox }));

    // Resize = redefine the column boundary. Characters whose center falls
    // within the new bbox are claimed by this column (reordered to be adjacent).
    // Characters that fall outside are released (remain in spatialData but
    // will auto-detect into other columns or become orphaned).
    setSpatialData((prev) => {
      const col = columns[colIndex];
      if (!col) return prev;

      // Find characters whose center is inside the new bbox
      const inBbox = (c: SpatialCharacter) => {
        if (!c.bbox) return false;
        const cx = (c.bbox[0].x + c.bbox[2].x) / 2;
        const cy = (c.bbox[0].y + c.bbox[2].y) / 2;
        return cx >= newBbox.minX && cx <= newBbox.maxX && cy >= newBbox.minY && cy <= newBbox.maxY;
      };

      // Collect: chars that should be in this column (from any source)
      const claimed: SpatialCharacter[] = [];
      const rest: SpatialCharacter[] = [];
      for (const c of prev) {
        if (inBbox(c)) {
          claimed.push(c);
        } else {
          rest.push(c);
        }
      }

      // Sort claimed chars by reading order within the new bbox
      const isRow = (newBbox.maxX - newBbox.minX) > (newBbox.maxY - newBbox.minY) * 1.5;
      if (isRow) {
        claimed.sort((a, b) => {
          const ax = a.bbox ? (a.bbox[0].x + a.bbox[2].x) / 2 : 0;
          const bx = b.bbox ? (b.bbox[0].x + b.bbox[2].x) / 2 : 0;
          return ax - bx;
        });
      } else {
        claimed.sort((a, b) => {
          const ay = a.bbox ? (a.bbox[0].y + a.bbox[2].y) / 2 : 0;
          const by = b.bbox ? (b.bbox[0].y + b.bbox[2].y) / 2 : 0;
          return ay - by;
        });
      }

      // Find where this column's chars were in the original array and insert claimed there
      const colOffsets = new Set(col.chars.map((c) => c.offset));
      const firstColIdx = prev.findIndex((c) => colOffsets.has(c.offset));
      const insertIdx = firstColIdx >= 0 ? rest.findIndex((c, i) => {
        // Find the position in rest that corresponds to where the column was
        const origIdx = prev.indexOf(c);
        return origIdx >= firstColIdx;
      }) : rest.length;

      const updated = [...rest];
      updated.splice(insertIdx >= 0 ? insertIdx : rest.length, 0, ...claimed);

      // Recalculate offsets
      let offset = 0;
      for (const c of updated) {
        c.offset = offset;
        offset += c.text.length;
      }

      setSaveStatus("saving");
      save(updated);
      return updated;
    });
  }

  function handleDeleteColumn(colIndex: number) {
    setSpatialData((prev) => {
      const col = columns[colIndex];
      if (!col) return prev;
      const deleteOffsets = new Set(col.chars.map((c) => c.offset));
      const next = prev.filter((c) => !deleteOffsets.has(c.offset));
      let offset = 0;
      for (const c of next) {
        c.offset = offset;
        offset += c.text.length;
      }
      setSaveStatus("saving");
      save(next);
      return next;
    });
    setSelectedColumnIndex(null);
    setFocusedOffset(null);
  }

  function handleCreateColumn(bbox: { minX: number; maxX: number; minY: number; maxY: number }) {
    // Claim any existing characters whose center falls within the bbox
    // and group them into a new column via bbox override
    const newColIndex = columns.length;
    setBboxOverrides((prev) => ({ ...prev, [newColIndex]: bbox }));

    setSpatialData((prev) => {
      // Find characters whose center is inside the new bbox
      const inBbox = (c: SpatialCharacter) => {
        if (!c.bbox) return false;
        const cx = (c.bbox[0].x + c.bbox[2].x) / 2;
        const cy = (c.bbox[0].y + c.bbox[2].y) / 2;
        return cx >= bbox.minX && cx <= bbox.maxX && cy >= bbox.minY && cy <= bbox.maxY;
      };

      // Check if any already-assigned chars would be claimed
      const assignedOffsets = new Set<number>();
      for (const col of columns) {
        for (const c of col.chars) assignedOffsets.add(c.offset);
      }

      // Only claim orphaned characters (not already in a column)
      const claimed: SpatialCharacter[] = [];
      const rest: SpatialCharacter[] = [];
      for (const c of prev) {
        if (inBbox(c) && !assignedOffsets.has(c.offset)) {
          claimed.push(c);
        } else {
          rest.push(c);
        }
      }

      if (claimed.length === 0) {
        // No characters to claim — still create the column visually via override
        // Add a placeholder invisible character so the column detection creates a group
        return prev;
      }

      // Sort claimed by reading order (vertical by default)
      const isRow = (bbox.maxX - bbox.minX) > (bbox.maxY - bbox.minY) * 1.5;
      if (isRow) {
        claimed.sort((a, b) => {
          const ax = a.bbox ? (a.bbox[0].x + a.bbox[2].x) / 2 : 0;
          const bx = b.bbox ? (b.bbox[0].x + b.bbox[2].x) / 2 : 0;
          return ax - bx;
        });
      } else {
        claimed.sort((a, b) => {
          const ay = a.bbox ? (a.bbox[0].y + a.bbox[2].y) / 2 : 0;
          const by = b.bbox ? (b.bbox[0].y + b.bbox[2].y) / 2 : 0;
          return ay - by;
        });
      }

      // Append claimed at end so they form a new column group
      const updated = [...rest, ...claimed];
      let offset = 0;
      for (const c of updated) {
        c.offset = offset;
        offset += c.text.length;
      }

      setSaveStatus("saving");
      save(updated);
      return updated;
    });

    // Select the new column
    setSelectedColumnIndex(newColIndex);
  }

  function handleAddChar(bbox: Array<{ x: number; y: number }>, text: string) {
    const newCenter = {
      x: (bbox[0].x + bbox[2].x) / 2,
      y: (bbox[0].y + bbox[2].y) / 2,
    };

    setSpatialData((prev) => {
      let bestColIdx = -1;
      let bestDist = Infinity;
      for (let ci = 0; ci < columns.length; ci++) {
        const col = columns[ci];
        const colCx = (col.bbox.minX + col.bbox.maxX) / 2;
        const dist = Math.abs(newCenter.x - colCx);
        if (dist < bestDist) { bestDist = dist; bestColIdx = ci; }
      }

      let insertIndex = prev.length;
      if (bestColIdx >= 0) {
        const col = columns[bestColIdx];
        let lastBeforeIdx = -1;
        for (const colChar of col.chars) {
          if (!colChar.bbox) continue;
          const cy = (colChar.bbox[0].y + colChar.bbox[2].y) / 2;
          if (cy <= newCenter.y) {
            const sdIdx = prev.findIndex((c) => c.offset === colChar.offset);
            if (sdIdx >= 0) lastBeforeIdx = sdIdx;
          }
        }
        if (lastBeforeIdx >= 0) insertIndex = lastBeforeIdx + 1;
        else {
          const firstChar = col.chars.find((c) => c.bbox);
          if (firstChar) {
            const sdIdx = prev.findIndex((c) => c.offset === firstChar.offset);
            if (sdIdx >= 0) insertIndex = sdIdx;
          }
        }
      }

      const newChar: SpatialCharacter = { text, bbox, confidence: 1.0, offset: 0 };
      const next = [...prev];
      next.splice(insertIndex, 0, newChar);
      let offset = 0;
      for (const c of next) { c.offset = offset; offset += c.text.length; }

      setSaveStatus("saving");
      save(next);
      return next;
    });
  }

  // Apply preprocessing (filters + crop + pixel ops) to an image blob using Canvas API
  async function preprocessImage(sourceBlob: Blob): Promise<Blob> {
    const hasFilters = ppInvert || ppGrayscale || ppContrast !== 100 || ppBrightness !== 100;
    const hasCrop = cropRect !== null;
    const hasPixelOps = ppDenoise || ppCleanBackground > 0 || ppAdaptiveThreshold || ppSharpen;
    if (!hasFilters && !hasCrop && !hasPixelOps) return sourceBlob;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Compute crop in pixel coords
        const sx = hasCrop ? Math.round(cropRect!.x * img.naturalWidth) : 0;
        const sy = hasCrop ? Math.round(cropRect!.y * img.naturalHeight) : 0;
        const sw = hasCrop ? Math.round(cropRect!.w * img.naturalWidth) : img.naturalWidth;
        const sh = hasCrop ? Math.round(cropRect!.h * img.naturalHeight) : img.naturalHeight;

        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));

        // Apply CSS filters
        if (hasFilters) {
          const filters: string[] = [];
          if (ppContrast !== 100) filters.push(`contrast(${ppContrast}%)`);
          if (ppBrightness !== 100) filters.push(`brightness(${ppBrightness}%)`);
          if (ppGrayscale) filters.push("grayscale(100%)");
          if (ppInvert) filters.push("invert(100%)");
          ctx.filter = filters.join(" ");
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        ctx.filter = "none";

        // Pixel-level operations
        if (hasPixelOps) {
          const imageData = ctx.getImageData(0, 0, sw, sh);
          const data = imageData.data;

          // Denoise: 3x3 median filter
          if (ppDenoise) {
            const copy = new Uint8ClampedArray(data);
            for (let y = 1; y < sh - 1; y++) {
              for (let x = 1; x < sw - 1; x++) {
                for (let c = 0; c < 3; c++) {
                  const vals: number[] = [];
                  for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                      vals.push(copy[((y + dy) * sw + (x + dx)) * 4 + c]);
                    }
                  }
                  vals.sort((a, b) => a - b);
                  data[(y * sw + x) * 4 + c] = vals[4];
                }
              }
            }
          }

          // Clean background: push light pixels to white
          if (ppCleanBackground > 0) {
            const cutoff = ppCleanBackground;
            for (let i = 0; i < data.length; i += 4) {
              const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
              if (gray >= cutoff) {
                data[i] = 255;
                data[i + 1] = 255;
                data[i + 2] = 255;
              }
            }
          }

          // Sharpen: 3x3 unsharp-mask kernel
          if (ppSharpen) {
            const copy = new Uint8ClampedArray(data);
            for (let y = 1; y < sh - 1; y++) {
              for (let x = 1; x < sw - 1; x++) {
                for (let c = 0; c < 3; c++) {
                  const idx = (y * sw + x) * 4 + c;
                  const val =
                    5 * copy[idx]
                    - copy[((y - 1) * sw + x) * 4 + c]
                    - copy[((y + 1) * sw + x) * 4 + c]
                    - copy[(y * sw + x - 1) * 4 + c]
                    - copy[(y * sw + x + 1) * 4 + c];
                  data[idx] = Math.max(0, Math.min(255, val));
                }
              }
            }
          }

          // Adaptive threshold: local mean binarization
          if (ppAdaptiveThreshold) {
            const gray = new Float64Array(sw * sh);
            for (let i = 0; i < sw * sh; i++) {
              gray[i] = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
            }

            const integral = new Float64Array(sw * sh);
            for (let y = 0; y < sh; y++) {
              let rowSum = 0;
              for (let x = 0; x < sw; x++) {
                rowSum += gray[y * sw + x];
                integral[y * sw + x] = rowSum + (y > 0 ? integral[(y - 1) * sw + x] : 0);
              }
            }

            const half = Math.floor(ppAdaptiveBlockSize / 2);
            const adaptC = ppAdaptiveC;

            for (let y = 0; y < sh; y++) {
              for (let x = 0; x < sw; x++) {
                const y1 = Math.max(0, y - half - 1);
                const y2 = Math.min(sh - 1, y + half);
                const x1 = Math.max(0, x - half - 1);
                const x2 = Math.min(sw - 1, x + half);

                const area = (y2 - y1) * (x2 - x1);
                let sum = integral[y2 * sw + x2];
                if (y1 > 0) sum -= integral[(y1 - 1) * sw + x2];
                if (x1 > 0) sum -= integral[y2 * sw + (x1 - 1)];
                if (y1 > 0 && x1 > 0) sum += integral[(y1 - 1) * sw + (x1 - 1)];

                const localMean = sum / area;
                const val = gray[y * sw + x] < localMean - adaptC ? 0 : 255;
                const idx = (y * sw + x) * 4;
                data[idx] = val;
                data[idx + 1] = val;
                data[idx + 2] = val;
              }
            }
          }

          ctx.putImageData(imageData, 0, 0);
        }

        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Failed to create blob"));
          resolve(blob);
        }, "image/jpeg", 0.95);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(sourceBlob);
    });
  }

  // ── Crop a vertical strip from a blob ──
  async function cropStrip(
    sourceBlob: Blob,
    xStart: number, // normalized [0,1]
    xEnd: number,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const sx = Math.round(xStart * img.naturalWidth);
        const sw = Math.round((xEnd - xStart) * img.naturalWidth);
        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, sx, 0, sw, img.naturalHeight, 0, 0, sw, img.naturalHeight);
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Blob failed")), "image/jpeg", 0.95);
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = URL.createObjectURL(sourceBlob);
    });
  }

  // ── Run OCR on current page using overlapping strips ──
  async function handleRunQuickOCR() {
    const imageUrl = getImageUrl();
    if (!imageUrl) return;
    setOcrRunning(true);
    setError(null);

    try {
      // Fetch the image
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error("Failed to fetch page image");
      const rawBlob = await imgRes.blob();

      // Apply preprocessing
      const blob = await preprocessImage(rawBlob);

      // Save preprocessed image URL so the editor displays the same image OCR saw
      const hasPreprocess = ppInvert || ppGrayscale || ppContrast !== 100 || ppBrightness !== 100 || ppDenoise || ppCleanBackground > 0 || ppAdaptiveThreshold || ppSharpen || cropRect !== null;
      if (hasPreprocess) {
        setProcessedImageUrl(URL.createObjectURL(blob));
      } else {
        setProcessedImageUrl(null);
      }

      let deduped: SpatialCharacter[];
      let newCandidateData: SpatialCharacter[] = [];

      if (thoroughOcr) {
        // Thorough: split into 3 overlapping vertical strips to avoid Vision API skipping regions
        const strips = [
          { xStart: 0, xEnd: 0.4 },
          { xStart: 0.3, xEnd: 0.7 },
          { xStart: 0.6, xEnd: 1.0 },
        ];

        const allChars: SpatialCharacter[] = [];

        for (const strip of strips) {
          const stripBlob = await cropStrip(blob, strip.xStart, strip.xEnd);
          const formData = new FormData();
          formData.append("image", stripBlob, "strip.jpg");
          formData.append("det_mode", detMode);

          const res = await fetch("/api/ocr/process-page", {
            method: "POST",
            body: formData,
          });
          if (!res.ok) continue;
          const data = await res.json();
          const stripChars: SpatialCharacter[] = data.spatialData ?? [];

          const stripWidth = strip.xEnd - strip.xStart;
          for (const c of stripChars) {
            if (c.bbox) {
              c.bbox = c.bbox.map((v) => ({
                x: strip.xStart + v.x * stripWidth,
                y: v.y,
              }));
            }
          }
          allChars.push(...stripChars.filter((c) => c.bbox));
        }

        // Deduplicate from overlapping regions
        deduped = [];
        for (const c of allChars) {
          if (!c.bbox) continue;
          const cx = (c.bbox[0].x + c.bbox[2].x) / 2;
          const cy = (c.bbox[0].y + c.bbox[2].y) / 2;
          const isDupe = deduped.some((prev) => {
            if (!prev.bbox) return false;
            const px = (prev.bbox[0].x + prev.bbox[2].x) / 2;
            const py = (prev.bbox[0].y + prev.bbox[2].y) / 2;
            return Math.abs(cx - px) < 0.015 && Math.abs(cy - py) < 0.015;
          });
          if (!isDupe) deduped.push(c);
        }
      } else {
        // Standard: single pass on the whole image
        const formData = new FormData();
        formData.append("image", blob, "page.jpg");
        formData.append("det_mode", detMode);

        const res = await fetch("/api/ocr/process-page", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `OCR failed: ${res.status}`);
        }
        const data = await res.json();
        deduped = (data.spatialData ?? []).filter((c: SpatialCharacter) => c.bbox || c.text.trim() === "");
        newCandidateData = (data.candidateData ?? []) as SpatialCharacter[];
      }

      // Recalculate offsets
      let offset = 0;
      for (const c of deduped) {
        c.offset = offset;
        offset += c.text.length;
      }

      // Save to disk (including candidateData)
      await fetch(`/api/ocr/spatial-data/${encodeURIComponent(slug)}/${page}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spatialData: deduped,
          rawText: deduped.map((c) => c.text).join(""),
          candidateData: newCandidateData,
        }),
      });

      const reordered = reorderByColumns(deduped);
      setSpatialData(reordered);
      setRawText(reordered.map((c) => c.text).join(""));
      setCandidateData(newCandidateData);
      setEditorMode("editing");
      setCompletedPages((prev) => new Set([...prev, page]));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOcrRunning(false);
    }
  }

  // ── OCR a selected region and merge into existing spatial data ──
  async function handleOcrRegion(rect: { x: number; y: number; w: number; h: number }, regionDetMode?: string) {
    // rect is normalized [0,1] relative to the displayed image
    const imgUrl = imageUrl;
    if (!imgUrl) return;

    try {
      // Fetch the current display image and crop the region
      const imgRes = await fetch(imgUrl);
      if (!imgRes.ok) throw new Error("Failed to fetch image");
      const blob = await imgRes.blob();

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

      const res = await fetch("/api/ocr/process-page", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`OCR failed: ${res.status}`);
      const data = await res.json();
      const regionChars: SpatialCharacter[] = data.spatialData ?? [];

      if (regionChars.length === 0) return;

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
        const reordered = reorderByColumns(merged);
        setSaveStatus("saving");
        save(reordered);
        return reordered;
      });
    } catch (e: any) {
      setError(e.message);
    }
  }

  // Get base image URL for current page (original, unprocessed)
  function getImageUrl(): string {
    const iiifUrl = canvases[page - 1]?.imageUrl;
    if (iiifUrl) return iiifUrl;
    if (imageUrlPattern) return imageUrlPattern.replace("{page}", String(page).padStart(3, "0"));
    return `/api/ocr/page-image/${encodeURIComponent(slug)}/${page}`;
  }

  // Use processed image in editor (matches OCR bboxes), original for pre-OCR view
  const baseImageUrl = getImageUrl();
  const imageUrl = editorMode === "editing" && processedImageUrl ? processedImageUrl : baseImageUrl;
  const totalPages = canvases.length || pageCount;

  if (editorMode === "loading") {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading page {page}…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navigation bar */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-gray-200 bg-gray-50 text-sm flex-shrink-0">
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="px-2 py-0.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
        >
          ← Prev
        </button>
        <span className="text-gray-600 font-medium">
          Page {page} {totalPages > 0 ? `of ${totalPages}` : ""}
        </span>
        <button
          disabled={totalPages > 0 && page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="px-2 py-0.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
        >
          Next →
        </button>

        {/* Progress dots */}
        {totalPages > 0 && totalPages <= 50 && (
          <div className="flex gap-0.5 ml-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i + 1 === page
                    ? "bg-red-500"
                    : completedPages.has(i + 1)
                    ? "bg-green-400"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                title={`Page ${i + 1}${completedPages.has(i + 1) ? " ✓" : ""}`}
              />
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {editorMode === "editing" && (
            <>
              <button
                onClick={() => setShowTranscriptionView((v) => !v)}
                className={`px-2 py-0.5 text-xs rounded border ${
                  showTranscriptionView
                    ? "border-indigo-400 text-indigo-600 bg-indigo-50"
                    : "border-gray-300 text-gray-500 hover:text-indigo-600 hover:border-indigo-300"
                }`}
              >
                {showTranscriptionView ? "Editor View" : "Transcription View"}
              </button>
              {!showTranscriptionView && (
                <>
                <button
                  onClick={() => {
                    setViewMode((v) => v === "charBox" ? "column" : "charBox");
                    setSelectedColumnIndex(null);
                    setFocusedOffset(null);
                  }}
                  className={`px-2 py-0.5 text-xs rounded border ${
                    viewMode === "column"
                      ? "border-amber-400 text-amber-600 bg-amber-50"
                      : "border-gray-300 text-gray-500 hover:text-amber-600 hover:border-amber-300"
                  }`}
                >
                  {viewMode === "column" ? "Column View" : "Char View"}
                </button>
                <button
                  onClick={() => setLayoutMode((m) => m === "simple" ? "commentary" : "simple")}
                  className={`px-2 py-0.5 text-xs rounded border ${
                    layoutMode === "commentary"
                      ? "border-purple-400 text-purple-600 bg-purple-50"
                      : "border-gray-300 text-gray-500 hover:text-purple-600 hover:border-purple-300"
                  }`}
                >
                  {layoutMode === "commentary" ? "Commentary" : "Simple"}
                </button>
                </>
              )}
              <button
                onClick={() => {
                  setEditorMode("no-data");
                  setProcessedImageUrl(null);
                  setSelectedColumnIndex(null);
                  setFocusedOffset(null);
                  setShowTranscriptionView(false);
                }}
                className="px-2 py-0.5 text-xs rounded border border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-300"
              >
                Re-OCR
              </button>
            </>
          )}
          <span className="text-xs text-gray-400">
            {saveStatus === "saving" && "Saving…"}
            {saveStatus === "saved" && "Saved ✓"}
            {editorMode === "no-data" && "No OCR data"}
          </span>
        </div>
      </div>

      {/* No data state — show image + preprocessing + OCR options */}
      {editorMode === "no-data" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Image with optional crop drawing */}
          <div
            className="flex-1 overflow-auto bg-gray-100 relative"
            ref={noDataContainerRef}
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                setNoDataZoom((z) => Math.max(25, Math.min(300, z + (e.deltaY > 0 ? -10 : 10))));
              }
            }}
          >
            {/* Zoom controls */}
            <div className="sticky top-0 z-30 flex items-center gap-1 px-2 py-1 bg-gray-100/90 backdrop-blur-sm">
              <button onClick={() => setNoDataZoom((z) => Math.max(25, z - 25))} className="px-1.5 py-0.5 text-[10px] rounded border border-gray-300 bg-white hover:bg-gray-100">−</button>
              <span className="text-[10px] text-gray-500 w-8 text-center">{noDataZoom}%</span>
              <button onClick={() => setNoDataZoom((z) => Math.min(300, z + 25))} className="px-1.5 py-0.5 text-[10px] rounded border border-gray-300 bg-white hover:bg-gray-100">+</button>
              <button onClick={() => setNoDataZoom(100)} className="px-1.5 py-0.5 text-[10px] rounded border border-gray-300 bg-white hover:bg-gray-100 ml-1">Fit</button>
              <button onClick={() => setNoDataZoom(50)} className="px-1.5 py-0.5 text-[10px] rounded border border-gray-300 bg-white hover:bg-gray-100">50%</button>
            </div>
            <div className="relative inline-block m-4" style={{ width: `${noDataZoom}%` }}>
              {imageUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={cropImgRef}
                    src={baseImageUrl}
                    alt={`Page ${page}`}
                    className="block w-full h-auto cursor-crosshair"
                    style={{
                      filter: [
                        ppContrast !== 100 ? `contrast(${ppContrast}%)` : "",
                        ppBrightness !== 100 ? `brightness(${ppBrightness}%)` : "",
                        ppGrayscale ? "grayscale(100%)" : "",
                        ppInvert ? "invert(100%)" : "",
                      ].filter(Boolean).join(" ") || undefined,
                    }}
                    draggable={false}
                    onMouseDown={(e) => {
                      const rect = cropImgRef.current?.getBoundingClientRect();
                      if (!rect) return;
                      setIsCropping(true);
                      setCropStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      setCropDraft(null);
                    }}
                    onMouseMove={(e) => {
                      if (!isCropping || !cropStart || !cropImgRef.current) return;
                      const rect = cropImgRef.current.getBoundingClientRect();
                      const curX = e.clientX - rect.left;
                      const curY = e.clientY - rect.top;
                      setCropDraft({
                        x: Math.min(cropStart.x, curX),
                        y: Math.min(cropStart.y, curY),
                        w: Math.abs(curX - cropStart.x),
                        h: Math.abs(curY - cropStart.y),
                      });
                    }}
                    onMouseUp={() => {
                      setIsCropping(false);
                      if (cropDraft && cropDraft.w > 10 && cropDraft.h > 10 && cropImgRef.current) {
                        const iw = cropImgRef.current.clientWidth;
                        const ih = cropImgRef.current.clientHeight;
                        setCropRect({
                          x: cropDraft.x / iw,
                          y: cropDraft.y / ih,
                          w: cropDraft.w / iw,
                          h: cropDraft.h / ih,
                        });
                      }
                      setCropDraft(null);
                      setCropStart(null);
                    }}
                  />

                  {/* Crop overlay */}
                  {cropRect && cropImgRef.current && (
                    <div
                      style={{
                        position: "absolute",
                        left: cropRect.x * cropImgRef.current.clientWidth,
                        top: cropRect.y * cropImgRef.current.clientHeight,
                        width: cropRect.w * cropImgRef.current.clientWidth,
                        height: cropRect.h * cropImgRef.current.clientHeight,
                      }}
                      className="border-2 border-dashed border-red-500 bg-red-500/10 pointer-events-none"
                    />
                  )}

                  {/* Draft crop while drawing */}
                  {cropDraft && (
                    <div
                      style={{
                        position: "absolute",
                        left: cropDraft.x,
                        top: cropDraft.y,
                        width: cropDraft.w,
                        height: cropDraft.h,
                      }}
                      className="border-2 border-dashed border-indigo-500 bg-indigo-500/10 pointer-events-none"
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right panel: preprocessing + OCR */}
          <div className="w-80 border-l border-gray-200 bg-white p-4 flex flex-col gap-4 overflow-y-auto flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-700">OCR this page</h3>

            {error && <p className="text-xs text-red-500">{error}</p>}

            {/* Preprocessing */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preprocessing</p>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={ppInvert} onChange={(e) => setPpInvert(e.target.checked)} className="rounded" />
                Invert (for rubbings)
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={ppGrayscale} onChange={(e) => setPpGrayscale(e.target.checked)} className="rounded" />
                Grayscale
              </label>

              <label className="flex items-center gap-1 text-xs">
                Contrast:
                <input type="range" min={50} max={200} value={ppContrast} onChange={(e) => setPpContrast(parseInt(e.target.value))} className="flex-1 h-1" />
                <span className="w-8 text-right text-gray-500">{ppContrast}%</span>
              </label>

              <label className="flex items-center gap-1 text-xs">
                Brightness:
                <input type="range" min={50} max={200} value={ppBrightness} onChange={(e) => setPpBrightness(parseInt(e.target.value))} className="flex-1 h-1" />
                <span className="w-8 text-right text-gray-500">{ppBrightness}%</span>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={ppDenoise} onChange={(e) => setPpDenoise(e.target.checked)} className="rounded" />
                Denoise
              </label>

              <label className="flex items-center gap-1 text-xs">
                Clean BG:
                <input type="range" min={0} max={255} value={ppCleanBackground} onChange={(e) => setPpCleanBackground(parseInt(e.target.value))} className="flex-1 h-1" />
                <span className="w-8 text-right text-gray-500">{ppCleanBackground || "off"}</span>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={ppAdaptiveThreshold} onChange={(e) => setPpAdaptiveThreshold(e.target.checked)} className="rounded" />
                Adaptive threshold
              </label>

              {ppAdaptiveThreshold && (
                <div className="pl-4 flex flex-col gap-1.5">
                  <label className="flex items-center gap-1 text-xs">
                    Block:
                    <input type="range" min={3} max={51} step={2} value={ppAdaptiveBlockSize} onChange={(e) => setPpAdaptiveBlockSize(parseInt(e.target.value))} className="flex-1 h-1" />
                    <span className="w-6 text-right text-gray-500">{ppAdaptiveBlockSize}</span>
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    C:
                    <input type="range" min={0} max={30} value={ppAdaptiveC} onChange={(e) => setPpAdaptiveC(parseInt(e.target.value))} className="flex-1 h-1" />
                    <span className="w-6 text-right text-gray-500">{ppAdaptiveC}</span>
                  </label>
                </div>
              )}

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={ppSharpen} onChange={(e) => setPpSharpen(e.target.checked)} className="rounded" />
                Sharpen
              </label>
            </div>

            {/* Crop */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Crop</p>
              {cropRect ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-green-600">Crop area set ✓</span>
                  <button
                    onClick={() => setCropRect(null)}
                    className="text-[10px] text-gray-400 hover:text-red-500"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-gray-400">
                  Drag on the image to crop. Only the selected area will be OCR'd.
                </p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <select
                  value={detMode}
                  onChange={(e) => setDetMode(e.target.value as "auto" | "sp" | "hp")}
                  disabled={ocrRunning}
                  className="text-xs border border-gray-300 rounded px-1.5 py-1 flex-1"
                >
                  <option value="auto">Auto</option>
                  <option value="sp">Vertical (竖排)</option>
                  <option value="hp">Horizontal (横排)</option>
                </select>
                <button
                  onClick={handleRunQuickOCR}
                  disabled={ocrRunning}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded bg-branding-black text-white hover:bg-gray-800 disabled:opacity-40"
                >
                  {ocrRunning ? "Running…" : "Run OCR"}
                </button>
              </div>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={thoroughOcr}
                  onChange={(e) => setThoroughOcr(e.target.checked)}
                  className="rounded"
                  disabled={ocrRunning}
                />
                Thorough (3 overlapping passes)
              </label>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500">
                For complex layouts, use the{" "}
                <a href="/en/admin/ocr/test" target="_blank" className="text-indigo-600 hover:underline">
                  OCR Test Page
                </a>{" "}
                with Guided OCR mode.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Editing state — transcription view */}
      {editorMode === "editing" && showTranscriptionView && (
        <ColumnTranscriptionView
          columns={columns}
          imageUrl={imageUrl}
          layoutMode={layoutMode}
          onCharChange={handleCharChange}
          focusedOffset={focusedOffset}
          onFocusChar={setFocusedOffset}
        />
      )}

      {/* Editing state — three-pane layout */}
      {editorMode === "editing" && !showTranscriptionView && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: full text */}
          <div className="w-1/3 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 uppercase tracking-wide flex items-center justify-between">
              Full Text
              <button
                onClick={() => {
                  const blob = new Blob([rawText], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${slug}_page_${page}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-2 py-0.5 text-[10px] font-medium rounded border border-gray-300 text-gray-500 hover:bg-gray-100 uppercase tracking-wide"
              >
                Download .txt
              </button>
            </div>
            <OCRTextPane
              spatialData={spatialData}
              columns={columns}
              layoutMode={layoutMode}
              focusedOffset={focusedOffset}
              onFocusChar={setFocusedOffset}
              onSelectColumn={handleSelectColumn}
            />
          </div>

          {/* Center: image + overlays */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 uppercase tracking-wide">
              {viewMode === "column"
                ? (selectedColumnIndex !== null ? `Column ${selectedColumnIndex + 1} selected` : "Click a column to select, drag to move, draw to add")
                : (selectedColumnIndex !== null ? `Editing column ${selectedColumnIndex + 1}` : "Click a column or draw to add")}
            </div>
            <div className="flex-1 overflow-hidden">
              <OCRImagePane
                imageUrl={imageUrl}
                columns={columns}
                selectedColumnIndex={selectedColumnIndex}
                spatialData={spatialData}
                onSelectColumn={handleSelectColumn}
                onDeselectColumn={() => { setSelectedColumnIndex(null); setFocusedOffset(null); }}
                onCharChange={handleCharChange}
                onFocusChar={setFocusedOffset}
                onAddChar={handleAddChar}
                onOcrRegion={handleOcrRegion}
                focusedOffset={focusedOffset}
                viewMode={viewMode}
                onMoveColumn={handleMoveColumn}
                onResizeColumn={handleResizeColumn}
                onDeleteColumn={handleDeleteColumn}
                onCreateColumn={handleCreateColumn}
              />
            </div>
          </div>

          {/* Right: toolbox */}
          <div className="w-1/4 border-l border-gray-200 bg-white overflow-hidden flex flex-col">
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 uppercase tracking-wide">
              Tools
            </div>
            <OCRToolbox
              columns={columns}
              selectedColumnIndex={selectedColumnIndex}
              onSelectColumn={handleSelectColumn}
              spatialDataLength={spatialData.filter((c) => c.bbox).length}
              focusedOffset={focusedOffset}
              onDeleteChar={handleDeleteChar}
              onSuggestApply={handleSuggestApply}
              spatialData={spatialData}
              onFocusChar={setFocusedOffset}
              candidateData={candidateData}
              viewMode={viewMode}
              onDeleteColumn={handleDeleteColumn}
              orphanedChars={orphanedChars}
              onDeleteOrphans={() => {
                setSpatialData((prev) => {
                  const orphanOffsets = new Set(orphanedChars.map((c) => c.offset));
                  const next = prev.filter((c) => !orphanOffsets.has(c.offset));
                  let offset = 0;
                  for (const c of next) { c.offset = offset; offset += c.text.length; }
                  setSaveStatus("saving");
                  save(next);
                  return next;
                });
              }}
              onPromoteCandidate={(c) => {
                setCandidateData((prev) => prev.filter((x) => x.offset !== c.offset));
                handleAddChar(c.bbox!, c.text);
              }}
              onDismissCandidate={(c) => {
                setCandidateData((prev) => prev.filter((x) => x.offset !== c.offset));
              }}
              onOpenLowConfReview={(threshold) => {
                setReviewThreshold(threshold);
                setShowLowConfReview(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Low confidence review modal */}
      {showLowConfReview && (
        <LowConfReviewModal
          reviewQueue={lowConfQueue}
          columns={columns}
          spatialData={spatialData}
          imageUrl={imageUrl}
          onCharChange={handleCharChange}
          onDeleteChar={handleDeleteChar}
          onFocusChar={setFocusedOffset}
          onSelectColumn={handleSelectColumn}
          onClose={() => setShowLowConfReview(false)}
        />
      )}
    </div>
  );
}
