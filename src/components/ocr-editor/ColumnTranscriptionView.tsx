"use client";

import { useState, useEffect, useRef } from "react";
import type { SpatialCharacter } from "@/lib/ocr-store";
import type { Column, LayoutMode } from "./useColumnDetection";

interface ColumnTranscriptionViewProps {
  columns: Column[];
  imageUrl: string;
  layoutMode?: LayoutMode;
  onCharChange: (offset: number, newText: string) => void;
  focusedOffset: number | null;
  onFocusChar: (offset: number) => void;
}

/** Padding (normalized) added around each column crop */
const PAD = 0.01;

/** Info stored per column crop */
interface ColCrop {
  dataUrl: string;
  originX: number;
  originY: number;
  cropW: number;
  cropH: number;
  natW: number;
  natH: number;
}

function TranscriptionChar({
  char,
  isFocused,
  onCharChange,
  onFocusChar,
  style,
  isCommentary,
}: {
  char: SpatialCharacter;
  isFocused: boolean;
  onCharChange: (offset: number, newText: string) => void;
  onFocusChar: (offset: number) => void;
  style: React.CSSProperties;
  isCommentary?: boolean;
}) {
  const [showChoices, setShowChoices] = useState(false);
  const hasChoices = char.choices && char.choices.length > 0;

  return (
    <div className="absolute flex items-center justify-center" style={style}>
      <span
        onClick={() => {
          onFocusChar(char.offset);
          if (hasChoices) setShowChoices((v) => !v);
        }}
        className={[
          "cursor-pointer transition-colors rounded-sm font-serif leading-none select-none relative",
          isCommentary ? "text-amber-800" : "text-gray-900",
          isFocused ? "bg-indigo-200 ring-2 ring-indigo-400" : "",
          hasChoices
            ? "hover:bg-indigo-50 underline decoration-dotted decoration-gray-400"
            : "hover:bg-gray-100",
        ].join(" ")}
      >
        {char.text}

        {showChoices && char.choices && (
          <div
            className="absolute z-50 bg-white shadow-lg rounded-lg border border-gray-200 p-1.5 flex gap-1"
            style={{ top: "100%", left: "50%", transform: "translateX(-50%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {char.choices.slice(0, 6).map((alt, i) => (
              <button
                key={i}
                onClick={() => {
                  onCharChange(char.offset, alt);
                  setShowChoices(false);
                }}
                className="w-8 h-8 text-lg font-serif rounded border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
              >
                {alt}
              </button>
            ))}
          </div>
        )}
      </span>
    </div>
  );
}

export default function ColumnTranscriptionView({
  columns,
  imageUrl,
  layoutMode = "simple",
  onCharChange,
  focusedOffset,
  onFocusChar,
}: ColumnTranscriptionViewProps) {
  const [columnCrops, setColumnCrops] = useState<Map<number, ColCrop>>(new Map());
  const [displayHeight, setDisplayHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute display height from viewport
  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight;
      setDisplayHeight(Math.max(400, vh - 120));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Crop each column as a full-height vertical strip
  useEffect(() => {
    if (!imageUrl || columns.length === 0) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      const newMap = new Map<number, ColCrop>();

      for (const col of columns) {
        const originX = Math.max(0, col.bbox.minX - PAD);
        const originY = 0;
        const cropR = Math.min(1, col.bbox.maxX + PAD);
        const cropW = cropR - originX;
        const cropH = 1;

        const sx = originX * natW;
        const sw = cropW * natW;

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(sw);
        canvas.height = natH;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, sx, 0, sw, natH, 0, 0, canvas.width, natH);

        newMap.set(col.index, {
          dataUrl: canvas.toDataURL("image/jpeg", 0.9),
          originX,
          originY,
          cropW,
          cropH,
          natW: canvas.width,
          natH: natH,
        });
      }
      setColumnCrops(newMap);
    };
    img.src = imageUrl;
  }, [imageUrl, columns]);

  function getSectionType(col: Column, offset: number): "main" | "commentary" {
    if (layoutMode !== "commentary") return "main";
    for (const sec of col.sections) {
      if (sec.chars.some((c) => c.offset === offset)) return sec.type;
    }
    return "main";
  }

  if (columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        No columns detected
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto bg-stone-50" ref={containerRef}>
      <div className="flex flex-row-reverse items-start gap-8 p-6 min-w-max">
        {columns.map((col) => {
          const crop = columnCrops.get(col.index);
          if (!crop) {
            return (
              <div key={col.index} className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="text-xs text-gray-400 font-medium">{col.isRow ? "Row" : "Col"} {col.index + 1}</div>
                <div className="flex flex-row gap-1">
                  <div className="w-10 bg-gray-100 animate-pulse rounded" style={{ height: displayHeight }} />
                  <div className="w-10 bg-gray-50 animate-pulse rounded" style={{ height: displayHeight }} />
                </div>
              </div>
            );
          }

          const scale = displayHeight / crop.natH;
          const imgDisplayW = crop.natW * scale;
          const imgDisplayH = displayHeight;
          const chars = col.chars.filter((c) => c.bbox);

          return (
            <div key={col.index} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="text-xs text-gray-400 font-medium tracking-wide">
                {col.isRow ? "Row" : "Col"} {col.index + 1}
              </div>

              <div className="flex flex-row gap-1">
                {/* Cropped image */}
                <div
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-shrink-0"
                  style={{ width: imgDisplayW, height: imgDisplayH }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={crop.dataUrl}
                    alt={`Column ${col.index + 1}`}
                    className="block"
                    style={{ width: imgDisplayW, height: imgDisplayH }}
                  />
                </div>

                {/* Text overlay — characters positioned to match image */}
                <div
                  className="relative bg-white rounded-lg shadow-sm border border-gray-200 flex-shrink-0 overflow-visible"
                  style={{ width: imgDisplayW, height: imgDisplayH }}
                >
                  {chars.map((char) => {
                    if (!char.bbox) return null;

                    const bx0 = char.bbox[0].x;
                    const by0 = char.bbox[0].y;
                    const bx1 = char.bbox[2].x;
                    const by1 = char.bbox[2].y;

                    const relX = (bx0 - crop.originX) / crop.cropW;
                    const relY = (by0 - crop.originY) / crop.cropH;
                    const relW = (bx1 - bx0) / crop.cropW;
                    const relH = (by1 - by0) / crop.cropH;

                    const left = relX * imgDisplayW;
                    const top = relY * imgDisplayH;
                    const width = relW * imgDisplayW;
                    const height = relH * imgDisplayH;

                    const isCommentary = getSectionType(col, char.offset) === "commentary";
                    const fontSize = Math.max(8, Math.min(width, height) * 0.85);

                    return (
                      <TranscriptionChar
                        key={char.offset}
                        char={char}
                        isFocused={focusedOffset === char.offset}
                        onCharChange={onCharChange}
                        onFocusChar={onFocusChar}
                        isCommentary={isCommentary}
                        style={{ left, top, width, height, fontSize }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
