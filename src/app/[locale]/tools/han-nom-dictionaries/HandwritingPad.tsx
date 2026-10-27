"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { Button } from "@/components/ui/button";
import localFont from "next/font/local";

const NomNaTong = localFont({
  src: "../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

// How long to wait after the last stroke before asking for candidates. Keeps
// us from firing a request on every intermediate stroke while the user is still
// drawing a character.
const RECOGNIZE_DEBOUNCE_MS = 400;

// The Google handwriting API (language "zh") occasionally returns Latin letters,
// digits, or punctuation among its candidates. This is a Hán-Nôm tool, so keep
// only candidates made entirely of CJK characters (incl. extension planes).
function isHanNomCandidate(candidate: string): boolean {
  const chars = Array.from(candidate);
  if (chars.length === 0) return false;
  return chars.every((ch) => {
    const cp = ch.codePointAt(0);
    if (cp === undefined) return false;
    return (
      (cp >= 0x4e00 && cp <= 0x9fff) ||
      (cp >= 0x3400 && cp <= 0x4dbf) ||
      (cp >= 0x20000 && cp <= 0x2ebef) ||
      (cp >= 0x30000 && cp <= 0x323af) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0x2e80 && cp <= 0x2fdf)
    );
  });
}

type Props = {
  onSelect: (char: string) => void;
  showNote?: boolean;
};

export default function HandwritingPad({ onSelect, showNote = true }: Props) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const candidatesRef = useRef<HTMLDivElement>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const t = useTranslations();

  // Debounce timer for scheduling recognition after a stroke ends.
  const debounceRef = useRef<number | null>(null);
  // Monotonic id so that only the most recent in-flight request may apply its
  // result — earlier (now-stale) responses are ignored, since strokes keep
  // being added while requests are in flight.
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (candidates.length === 0 || typeof window === "undefined") return;
    if (window.innerWidth >= 1024) return;

    requestAnimationFrame(() => {
      candidatesRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [candidates]);

  // Cancel any pending recognition when the component unmounts.
  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  const recognize = async (ink: number[][][]) => {
    if (ink.length === 0) {
      setCandidates([]);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);

    const body = {
      options: "enable_pre_space",
      requests: [
        {
          writing_guide: {
            writing_area_width: 280,
            writing_area_height: 280,
          },
          ink,
          language: "zh",
          max_num_results: 5,
          max_completions: 0,
        },
      ],
    };

    try {
      const res = await fetch(
        "https://inputtools.google.com/request?itc=zh-t-i0-handwrit&app=demopage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();
      // A newer stroke has already kicked off a fresh request; drop this result.
      if (requestId !== requestIdRef.current) return;
      if (data[0] === "SUCCESS") {
        const results = (data[1][0][1] as string[]) ?? [];
        setCandidates(results.filter(isHanNomCandidate));
      }
    } catch (err) {
      console.error("Recognition failed:", err);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  const handleStrokeEnd = async () => {
    const paths = await canvasRef.current?.exportPaths();
    const strokes =
      paths?.map((stroke) => [
        stroke.paths.map((p) => Math.round(p.x)),
        stroke.paths.map((p) => Math.round(p.y)),
        [],
      ]) || [];

    // Debounce: recognize shortly after the user stops drawing, so candidates
    // update in real time without a request per intermediate stroke.
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      recognize(strokes);
    }, RECOGNIZE_DEBOUNCE_MS);
  };

  const clear = () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    // Invalidate any in-flight request so its late result can't repopulate.
    requestIdRef.current++;
    canvasRef.current?.clearCanvas();
    setCandidates([]);
    setLoading(false);
  };

  return (
    <div className="flex items-center flex-col gap-4">
      {showNote && (
        <div className="text-sm text-muted-foreground mb-2">
          <span className="font-semibold text-gray-600">
            {t("Tools.han-nom-dictionaries.writing-pad.notenote")}{" "}
          </span>
          <span>{t("Tools.han-nom-dictionaries.writing-pad.note")}</span>
        </div>
      )}
      <ReactSketchCanvas
        ref={canvasRef}
        width="280px"
        height="280px"
        strokeWidth={4}
        strokeColor="black"
        onStroke={handleStrokeEnd}
        className="border"
      />

      <div className="flex items-center gap-4 min-h-[1.5rem]">
        <Button onClick={clear} variant="outline">
          {t("Tools.han-nom-dictionaries.writing-pad.clear")}
        </Button>
        {loading && (
          <span className="text-sm text-muted-foreground">
            {t("Tools.han-nom-dictionaries.writing-pad.recognizing")}
          </span>
        )}
      </div>

      {candidates.length > 0 && (
        <div ref={candidatesRef} className="grid grid-cols-5 gap-2 text-center">
          {candidates.map((char, i) => (
            <button
              key={i}
              onClick={() => onSelect(char)}
              className="text-2xl p-2 border rounded hover:bg-gray-100 transition duration-200"
            >
              <div className={NomNaTong.className}>{char}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
