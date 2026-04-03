"use client";

import { useEffect, useRef } from "react";
import type { SpatialCharacter } from "@/lib/ocr-store";
import type { Column } from "./useColumnDetection";

interface OCRTextPaneProps {
  spatialData: SpatialCharacter[];
  columns: Column[];
  focusedOffset: number | null;
  onFocusChar: (offset: number) => void;
  onSelectColumn: (index: number) => void;
}

export default function OCRTextPane({
  spatialData,
  columns,
  focusedOffset,
  onFocusChar,
  onSelectColumn,
}: OCRTextPaneProps) {
  const spanRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  // Scroll to focused character
  useEffect(() => {
    if (focusedOffset === null) return;
    const el = spanRefs.current.get(focusedOffset);
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focusedOffset]);

  return (
    <div className="h-full overflow-y-auto p-3 text-sm leading-relaxed font-sans text-gray-800 select-text break-all">
      {spatialData.map((char, i) => {
        if (!char.bbox) {
          return <span key={i}>{char.text === "\n" ? <br /> : char.text}</span>;
        }

        const isFocused = focusedOffset !== null && char.offset === focusedOffset;
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
              if (colIdx >= 0) onSelectColumn(colIdx);
              onFocusChar(char.offset);
            }}
            className={`cursor-pointer transition-colors rounded ${confColor}`}
            title={`${char.text} — confidence: ${Math.round(conf * 100)}%`}
          >
            {char.text}
          </span>
        );
      })}
    </div>
  );
}
