"use client";

import MiradorViewer from "@/components/mirador/MiradorViewer";

interface ImagePaneProps {
  manifestUrl: string;
  canvasId?: string;
  paneHeight: string;
}

export default function ImagePane({ manifestUrl, canvasId, paneHeight }: ImagePaneProps) {
  return (
    /*
     * position: relative + explicit dimensions = a hard box Mirador can't escape.
     * The inner div is position: absolute; inset: 0 — it resolves to exactly the
     * parent's pixel size. Mirador fills that box and overflow: hidden clips the rest.
     * This works even though Mirador sets its own inline styles after JS init.
     */
    <div
      style={{
        position: "relative",
        width: "100%",
        height: paneHeight,
        overflow: "hidden",
      }}
    >
      <style>{`
        .rw-mirador-pane .mirador,
        .rw-mirador-pane #mirador {
          width: 100% !important;
          height: 100% !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
      `}</style>
      <div
        className="rw-mirador-pane"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
        }}
      >
        <MiradorViewer manifestUrl={manifestUrl} canvasId={canvasId ?? ""} />
      </div>
    </div>
  );
}
