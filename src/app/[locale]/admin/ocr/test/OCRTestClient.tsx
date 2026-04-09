"use client";

import { useState, useRef, useCallback } from "react";
import OCRTester from "./OCRTester";
import GuidedOCR from "./GuidedOCR";

type Mode = "quick" | "guided";

interface PreprocessOptions {
  invert: boolean;
  contrast: number;
  brightness: number;
  grayscale: boolean;
  rotation: number;
  threshold: number;  // 0 = off, 1-255 = binarize at this level
  denoise: boolean;   // median filter to remove speckle noise
  adaptiveThreshold: boolean; // local adaptive binarization
  adaptiveBlockSize: number;  // neighbourhood size for adaptive threshold (odd number)
  adaptiveC: number;          // constant subtracted from local mean
  cleanBackground: number;    // 0 = off, 1-255 = push pixels above this lightness to white
  sharpen: boolean;           // unsharp-mask style sharpening
}

const DEFAULT_PREPROCESS: PreprocessOptions = {
  invert: false,
  contrast: 100,
  brightness: 100,
  grayscale: false,
  rotation: 0,
  threshold: 0,
  denoise: false,
  adaptiveThreshold: false,
  adaptiveBlockSize: 15,
  adaptiveC: 10,
  cleanBackground: 0,
  sharpen: false,
};

function applyPreprocessing(
  sourceUrl: string,
  options: PreprocessOptions
): Promise<{ url: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const rad = (options.rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      // Canvas size needs to fit the rotated image
      const cw = Math.ceil(img.naturalWidth * cos + img.naturalHeight * sin);
      const ch = Math.ceil(img.naturalWidth * sin + img.naturalHeight * cos);

      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));

      // Apply CSS filters (contrast, brightness, grayscale, invert)
      const filters: string[] = [];
      if (options.contrast !== 100) filters.push(`contrast(${options.contrast}%)`);
      if (options.brightness !== 100) filters.push(`brightness(${options.brightness}%)`);
      if (options.grayscale) filters.push("grayscale(100%)");
      if (options.invert) filters.push("invert(100%)");
      ctx.filter = filters.length > 0 ? filters.join(" ") : "none";

      // Rotate around canvas center
      ctx.translate(cw / 2, ch / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      // Reset filter for pixel operations
      ctx.filter = "none";

      // Pixel-level operations
      const needsPixelOps = options.threshold > 0 || options.denoise ||
        options.adaptiveThreshold || options.cleanBackground > 0 || options.sharpen;

      if (needsPixelOps) {
        const imageData = ctx.getImageData(0, 0, cw, ch);
        const data = imageData.data;

        // Denoise: simple 3x3 median filter
        if (options.denoise) {
          const copy = new Uint8ClampedArray(data);
          for (let y = 1; y < ch - 1; y++) {
            for (let x = 1; x < cw - 1; x++) {
              for (let c = 0; c < 3; c++) {
                const vals: number[] = [];
                for (let dy = -1; dy <= 1; dy++) {
                  for (let dx = -1; dx <= 1; dx++) {
                    vals.push(copy[((y + dy) * cw + (x + dx)) * 4 + c]);
                  }
                }
                vals.sort((a, b) => a - b);
                data[(y * cw + x) * 4 + c] = vals[4]; // median
              }
            }
          }
        }

        // Clean background: push light pixels to pure white
        if (options.cleanBackground > 0) {
          const cutoff = options.cleanBackground;
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
        if (options.sharpen) {
          const copy = new Uint8ClampedArray(data);
          // Kernel: center=5, edges=-1 (approximation of unsharp mask)
          for (let y = 1; y < ch - 1; y++) {
            for (let x = 1; x < cw - 1; x++) {
              for (let c = 0; c < 3; c++) {
                const idx = (y * cw + x) * 4 + c;
                const val =
                  5 * copy[idx]
                  - copy[((y - 1) * cw + x) * 4 + c]
                  - copy[((y + 1) * cw + x) * 4 + c]
                  - copy[(y * cw + x - 1) * 4 + c]
                  - copy[(y * cw + x + 1) * 4 + c];
                data[idx] = Math.max(0, Math.min(255, val));
              }
            }
          }
        }

        // Adaptive threshold: local mean binarization
        if (options.adaptiveThreshold) {
          // Convert to grayscale first
          const gray = new Float64Array(cw * ch);
          for (let i = 0; i < cw * ch; i++) {
            gray[i] = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
          }

          // Build integral image for fast local mean computation
          const integral = new Float64Array(cw * ch);
          for (let y = 0; y < ch; y++) {
            let rowSum = 0;
            for (let x = 0; x < cw; x++) {
              rowSum += gray[y * cw + x];
              integral[y * cw + x] = rowSum + (y > 0 ? integral[(y - 1) * cw + x] : 0);
            }
          }

          const half = Math.floor(options.adaptiveBlockSize / 2);
          const c = options.adaptiveC;

          for (let y = 0; y < ch; y++) {
            for (let x = 0; x < cw; x++) {
              const y1 = Math.max(0, y - half - 1);
              const y2 = Math.min(ch - 1, y + half);
              const x1 = Math.max(0, x - half - 1);
              const x2 = Math.min(cw - 1, x + half);

              const area = (y2 - y1) * (x2 - x1);
              let sum = integral[y2 * cw + x2];
              if (y1 > 0) sum -= integral[(y1 - 1) * cw + x2];
              if (x1 > 0) sum -= integral[y2 * cw + (x1 - 1)];
              if (y1 > 0 && x1 > 0) sum += integral[(y1 - 1) * cw + (x1 - 1)];

              const localMean = sum / area;
              const val = gray[y * cw + x] < localMean - c ? 0 : 255;
              const idx = (y * cw + x) * 4;
              data[idx] = val;
              data[idx + 1] = val;
              data[idx + 2] = val;
            }
          }
        }

        // Global threshold: binarize to black/white
        if (options.threshold > 0 && !options.adaptiveThreshold) {
          const t = options.threshold;
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            const val = gray >= t ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          }
        }

        ctx.putImageData(imageData, 0, 0);
      }

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Failed to create blob"));
        const url = URL.createObjectURL(blob);
        resolve({ url, blob });
      }, "image/jpeg", 0.95);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = sourceUrl;
  });
}

export default function OCRTestClient() {
  const [mode, setMode] = useState<Mode>("quick");
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [preprocess, setPreprocess] = useState<PreprocessOptions>(DEFAULT_PREPROCESS);
  const [processing, setProcessing] = useState(false);

  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropDraft, setCropDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const cropImgRef = useRef<HTMLImageElement>(null);

  // The file/preview passed to OCR components — processed if available, otherwise original
  const file = processedFile ?? originalFile;
  const preview = processedPreview ?? originalPreview;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setOriginalFile(f);
    setProcessedFile(null);
    setProcessedPreview(null);
    setPreprocess(DEFAULT_PREPROCESS);
    if (f) {
      setOriginalPreview(URL.createObjectURL(f));
    } else {
      setOriginalPreview(null);
    }
  }

  const hasChanges =
    preprocess.invert !== DEFAULT_PREPROCESS.invert ||
    preprocess.contrast !== DEFAULT_PREPROCESS.contrast ||
    preprocess.brightness !== DEFAULT_PREPROCESS.brightness ||
    preprocess.grayscale !== DEFAULT_PREPROCESS.grayscale ||
    preprocess.rotation !== DEFAULT_PREPROCESS.rotation ||
    preprocess.threshold !== DEFAULT_PREPROCESS.threshold ||
    preprocess.denoise !== DEFAULT_PREPROCESS.denoise ||
    preprocess.adaptiveThreshold !== DEFAULT_PREPROCESS.adaptiveThreshold ||
    preprocess.adaptiveBlockSize !== DEFAULT_PREPROCESS.adaptiveBlockSize ||
    preprocess.adaptiveC !== DEFAULT_PREPROCESS.adaptiveC ||
    preprocess.cleanBackground !== DEFAULT_PREPROCESS.cleanBackground ||
    preprocess.sharpen !== DEFAULT_PREPROCESS.sharpen;

  async function handleApplyPreprocess() {
    if (!originalPreview) return;
    setProcessing(true);
    try {
      const { url, blob } = await applyPreprocessing(originalPreview, preprocess);
      const newFile = new File([blob], originalFile?.name ?? "processed.jpg", { type: "image/jpeg" });
      setProcessedFile(newFile);
      setProcessedPreview(url);
    } catch (e) {
      console.error("Preprocessing failed:", e);
    } finally {
      setProcessing(false);
    }
  }

  function handleResetPreprocess() {
    setPreprocess(DEFAULT_PREPROCESS);
    setProcessedFile(null);
    setProcessedPreview(null);
  }

  // Auto-apply preprocessing whenever options change
  const applyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPreprocessRef = useRef(preprocess);

  if (originalPreview && preprocess !== prevPreprocessRef.current) {
    prevPreprocessRef.current = preprocess;

    if (applyTimerRef.current) clearTimeout(applyTimerRef.current);

    const hasAny =
      preprocess.invert || preprocess.grayscale ||
      preprocess.contrast !== 100 || preprocess.brightness !== 100 ||
      preprocess.rotation !== 0 || preprocess.threshold > 0 || preprocess.denoise ||
      preprocess.adaptiveThreshold || preprocess.cleanBackground > 0 || preprocess.sharpen;

    if (hasAny) {
      // Debounce slightly for slider dragging
      applyTimerRef.current = setTimeout(async () => {
        try {
          const { url, blob } = await applyPreprocessing(originalPreview, preprocess);
          const newFile = new File([blob], originalFile?.name ?? "processed.jpg", { type: "image/jpeg" });
          setProcessedFile(newFile);
          setProcessedPreview(url);
        } catch (e) {
          console.error("Auto-preprocess failed:", e);
        }
      }, 150);
    } else {
      setProcessedFile(null);
      setProcessedPreview(null);
    }
  }

  async function handleCropApply(rect: { x: number; y: number; w: number; h: number }) {
    const sourceUrl = originalPreview;
    if (!sourceUrl) return;
    setProcessing(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
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
        img.src = sourceUrl;
      });
      const newFile = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      setOriginalFile(newFile);
      setOriginalPreview(URL.createObjectURL(blob));
      setProcessedFile(null);
      setProcessedPreview(null);
      setCropMode(false);
    } catch (e) {
      console.error("Crop failed:", e);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Upload + mode toggle + preprocessing */}
      <div className="flex items-start gap-6 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload image (JPG, PNG)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/tiff"
            onChange={handleFileChange}
            className="text-sm"
          />
        </div>

        <div className="flex rounded-md overflow-hidden border border-gray-300">
          <button
            onClick={() => setMode("quick")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === "quick"
                ? "bg-branding-black text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Quick OCR
          </button>
          <button
            onClick={() => setMode("guided")}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
              mode === "guided"
                ? "bg-branding-black text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Guided OCR
          </button>
        </div>
      </div>

      {/* Preprocessing options */}
      {originalFile && (
        <div className="flex items-center gap-4 flex-wrap px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs">
          <span className="font-medium text-gray-600">Preprocessing:</span>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={preprocess.invert}
              onChange={(e) => setPreprocess((p) => ({ ...p, invert: e.target.checked }))}
              className="rounded"
            />
            <span className="text-gray-700">Invert</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={preprocess.grayscale}
              onChange={(e) => setPreprocess((p) => ({ ...p, grayscale: e.target.checked }))}
              className="rounded"
            />
            <span className="text-gray-700">Grayscale</span>
          </label>

          <label className="flex items-center gap-1.5">
            <span className="text-gray-600">Contrast:</span>
            <input
              type="range"
              min={50}
              max={200}
              value={preprocess.contrast}
              onChange={(e) => setPreprocess((p) => ({ ...p, contrast: parseInt(e.target.value) }))}
              className="w-20 h-1"
            />
            <span className="text-gray-500 w-8 text-right">{preprocess.contrast}%</span>
          </label>

          <label className="flex items-center gap-1.5">
            <span className="text-gray-600">Brightness:</span>
            <input
              type="range"
              min={50}
              max={200}
              value={preprocess.brightness}
              onChange={(e) => setPreprocess((p) => ({ ...p, brightness: parseInt(e.target.value) }))}
              className="w-20 h-1"
            />
            <span className="text-gray-500 w-8 text-right">{preprocess.brightness}%</span>
          </label>

          {hasChanges && (
            <button
              onClick={handleResetPreprocess}
              className="px-2 py-1 text-gray-400 hover:text-gray-600 text-xs"
            >
              Reset
            </button>
          )}

          <label className="flex items-center gap-1.5">
            <span className="text-gray-600">Rotate:</span>
            <input
              type="range"
              min={-10}
              max={10}
              step={0.5}
              value={preprocess.rotation}
              onChange={(e) => setPreprocess((p) => ({ ...p, rotation: parseFloat(e.target.value) }))}
              className="w-20 h-1"
            />
            <span className="text-gray-500 w-10 text-right">{preprocess.rotation}°</span>
          </label>

          <div className="flex gap-1">
            <button
              onClick={() => setPreprocess((p) => ({ ...p, rotation: p.rotation - 90 }))}
              className="px-1.5 py-0.5 text-[10px] rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
              title="Rotate 90° left"
            >↶ 90°</button>
            <button
              onClick={() => setPreprocess((p) => ({ ...p, rotation: p.rotation + 90 }))}
              className="px-1.5 py-0.5 text-[10px] rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
              title="Rotate 90° right"
            >↷ 90°</button>
          </div>

          <span className="text-gray-300">|</span>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={preprocess.denoise}
              onChange={(e) => setPreprocess((p) => ({ ...p, denoise: e.target.checked }))}
              className="rounded"
            />
            <span className="text-gray-700">Denoise</span>
          </label>

          <label className="flex items-center gap-1.5">
            <span className="text-gray-600">Threshold:</span>
            <input
              type="range"
              min={0}
              max={255}
              value={preprocess.threshold}
              onChange={(e) => setPreprocess((p) => ({ ...p, threshold: parseInt(e.target.value) }))}
              className="w-20 h-1"
            />
            <span className="text-gray-500 w-8 text-right">{preprocess.threshold || "off"}</span>
          </label>

          <label className="flex items-center gap-1.5">
            <span className="text-gray-600">Clean BG:</span>
            <input
              type="range"
              min={0}
              max={255}
              value={preprocess.cleanBackground}
              onChange={(e) => setPreprocess((p) => ({ ...p, cleanBackground: parseInt(e.target.value) }))}
              className="w-20 h-1"
            />
            <span className="text-gray-500 w-8 text-right">{preprocess.cleanBackground || "off"}</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={preprocess.adaptiveThreshold}
              onChange={(e) => setPreprocess((p) => ({ ...p, adaptiveThreshold: e.target.checked }))}
              className="rounded"
            />
            <span className="text-gray-700">Adaptive</span>
          </label>

          {preprocess.adaptiveThreshold && (
            <>
              <label className="flex items-center gap-1.5">
                <span className="text-gray-600">Block:</span>
                <input
                  type="range"
                  min={3}
                  max={51}
                  step={2}
                  value={preprocess.adaptiveBlockSize}
                  onChange={(e) => setPreprocess((p) => ({ ...p, adaptiveBlockSize: parseInt(e.target.value) }))}
                  className="w-16 h-1"
                />
                <span className="text-gray-500 w-6 text-right">{preprocess.adaptiveBlockSize}</span>
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-gray-600">C:</span>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={preprocess.adaptiveC}
                  onChange={(e) => setPreprocess((p) => ({ ...p, adaptiveC: parseInt(e.target.value) }))}
                  className="w-16 h-1"
                />
                <span className="text-gray-500 w-6 text-right">{preprocess.adaptiveC}</span>
              </label>
            </>
          )}

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={preprocess.sharpen}
              onChange={(e) => setPreprocess((p) => ({ ...p, sharpen: e.target.checked }))}
              className="rounded"
            />
            <span className="text-gray-700">Sharpen</span>
          </label>

          <span className="text-gray-300">|</span>

          <button
            onClick={() => setCropMode(!cropMode)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              cropMode
                ? "bg-red-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            {cropMode ? "Cancel Crop" : "Crop"}
          </button>

        </div>
      )}

      {/* Crop mode overlay */}
      {cropMode && originalPreview && (
        <div className="border border-gray-200 rounded overflow-hidden bg-gray-100 p-2">
          <p className="text-xs text-gray-500 mb-2">Drag on the image to select the area to keep.</p>
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={cropImgRef}
              src={originalPreview}
              alt="Crop source"
              className="block max-h-[60vh] w-auto"
              draggable={false}
              onMouseDown={(e) => {
                const rect = cropImgRef.current?.getBoundingClientRect();
                if (!rect) return;
                setCropStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                setCropDraft(null);
              }}
              onMouseMove={(e) => {
                if (!cropStart || !cropImgRef.current) return;
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
                if (cropDraft && cropDraft.w > 10 && cropDraft.h > 10 && cropImgRef.current) {
                  const iw = cropImgRef.current.clientWidth;
                  const ih = cropImgRef.current.clientHeight;
                  const normalized = {
                    x: cropDraft.x / iw,
                    y: cropDraft.y / ih,
                    w: cropDraft.w / iw,
                    h: cropDraft.h / ih,
                  };
                  handleCropApply(normalized);
                }
                setCropStart(null);
                setCropDraft(null);
              }}
            />
            {cropDraft && (
              <div
                style={{
                  position: "absolute",
                  left: cropDraft.x,
                  top: cropDraft.y,
                  width: cropDraft.w,
                  height: cropDraft.h,
                }}
                className="border-2 border-dashed border-red-500 bg-red-500/10 pointer-events-none"
              />
            )}
          </div>
        </div>
      )}

      {/* Mode content */}
      {mode === "quick" && (
        <OCRTester externalFile={file} externalPreview={preview} />
      )}
      {mode === "guided" && (
        <GuidedOCR preview={preview} file={file} />
      )}
    </div>
  );
}
