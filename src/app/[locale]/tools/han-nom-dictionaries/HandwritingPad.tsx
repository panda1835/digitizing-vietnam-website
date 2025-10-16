"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { Button } from "@/components/ui/button";
import localFont from "next/font/local";

const NomNaTong = localFont({
  src: "../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

type Props = {
  onSelect: (char: string) => void;
};

export default function HandwritingPad({ onSelect }: Props) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [ink, setInk] = useState<number[][][]>([]);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const t = useTranslations();
  const recognize = async () => {
    if (ink.length === 0) return;

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
      if (data[0] === "SUCCESS") {
        setCandidates(data[1][0][1]);
      }
    } catch (err) {
      console.error("Recognition failed:", err);
    } finally {
      setLoading(false);
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
    setInk(strokes);
  };

  const clear = () => {
    canvasRef.current?.clearCanvas();
    setInk([]);
    setCandidates([]);
  };

  return (
    <div className="flex items-center flex-col gap-4">
      <div className="text-sm text-muted-foreground mb-2">
        <span className="font-semibold text-gray-600">Lưu ý: </span>
        <span>{t("Tools.han-nom-dictionaries.writing-pad.note")}</span>
      </div>
      <ReactSketchCanvas
        ref={canvasRef}
        width="280px"
        height="280px"
        strokeWidth={4}
        strokeColor="black"
        onStroke={handleStrokeEnd}
        className="border"
      />

      <div className="flex gap-4">
        <Button onClick={clear} variant="outline">
          {t("Tools.han-nom-dictionaries.writing-pad.clear")}
        </Button>
        <Button onClick={recognize} disabled={loading}>
          {loading
            ? t("Tools.han-nom-dictionaries.writing-pad.recognizing")
            : t("Tools.han-nom-dictionaries.writing-pad.recognize")}
        </Button>
      </div>

      {candidates.length > 0 && (
        <div className="grid grid-cols-5 gap-2 text-center">
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
