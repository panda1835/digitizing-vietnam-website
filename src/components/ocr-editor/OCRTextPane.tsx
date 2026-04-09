"use client";

import { useEffect, useRef, useMemo } from "react";
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

  // Build section type map for commentary detection
  const sectionTypeMap = useMemo(() => {
    const map = new Map<number, "main" | "commentary">();
    for (const col of columns) {
      for (const sec of col.sections) {
        for (const c of sec.chars) map.set(c.offset, sec.type);
      }
    }
    return map;
  }, [columns]);

  function renderChar(char: SpatialCharacter, i: number, keyPrefix = "") {
    if (!char.bbox) {
      return <span key={`${keyPrefix}${i}`}>{char.text === "\n" ? <br /> : char.text}</span>;
    }

    const isFocused = focusedOffset !== null && char.offset === focusedOffset;
    const conf = char.confidence;
    const isCommentary = sectionTypeMap.get(char.offset) === "commentary";

    const focusStyle = isFocused
      ? "bg-indigo-100 rounded-sm"
      : "";

    const confColor = conf < 0.3
      ? "text-red-600"
      : conf < 0.5
      ? "text-amber-700"
      : "";

    return (
      <span
        key={`${keyPrefix}${i}`}
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
        className={`cursor-pointer ${focusStyle} ${confColor} ${
          isCommentary ? "text-amber-800/80" : ""
        }`}
        title={`${char.text} — confidence: ${Math.round(conf * 100)}%`}
      >
        {char.text}
      </span>
    );
  }

  // Structured column view matching reading mode styles
  if (columns.length > 0) {
    return (
      <div className="h-full overflow-y-auto p-5 select-text">
        <div className="space-y-0" style={{ fontSize: "20px", lineHeight: 1.2 }}>
          {columns.map((col) => (
            <div key={col.index} className="font-sans text-branding-black font-light leading-relaxed">
              {col.sections.map((sec, si) => {
                const chars = sec.chars.filter((c) => c.text.trim() || c.bbox);
                if (chars.length === 0) return null;

                if (sec.type === "commentary") {
                  return (
                    <span
                      key={si}
                      className="text-amber-800/80"
                      style={{ fontSize: "15px" }}
                    >
                      {chars.map((c, ci) => renderChar(c, ci, `${col.index}-${si}-`))}
                    </span>
                  );
                }
                return (
                  <span key={si}>
                    {chars.map((c, ci) => renderChar(c, ci, `${col.index}-${si}-`))}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback: flat rendering
  return (
    <div
      className="h-full overflow-y-auto p-5 font-sans text-branding-black font-light leading-relaxed select-text break-all"
      style={{ fontSize: "20px", lineHeight: 1.2 }}
    >
      {spatialData.map((char, i) => renderChar(char, i))}
    </div>
  );
}
