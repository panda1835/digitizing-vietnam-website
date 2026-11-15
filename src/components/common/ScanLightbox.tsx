"use client";

import { useState, useEffect, useRef } from "react";

// Full-screen view of one scan, with wheel/pinch zoom and drag-to-pan,
// matching templates/wiki.html. Closes on Escape or the × button.
export function ScanLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Listen for Escape key to close lightbox and manage page scrolling lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // Disable background scrolling
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = previousOverflow; // Restore background scrolling
    };
  }, [onClose]);

  // Handle wheel events for scale-to-zoom (trackpad pinch/spread gesture)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent default page scroll and trackpad browser zoom
      e.preventDefault();

      const delta = e.deltaY;
      const factor = e.ctrlKey ? 0.02 : 0.01;

      setScale((prevScale) => {
        const nextScale = prevScale - delta * factor;
        const clamped = Math.min(Math.max(nextScale, 1), 6);
        if (clamped === 1) {
          setPanOffset({ x: 0, y: 0 });
        }
        return clamped;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] bg-[#2d1810]/90 backdrop-blur-md flex items-center justify-center p-[10px] select-none pointer-events-auto"
      style={{ animation: "lightboxFadeIn 0.25s ease-out forwards" }}
      role="dialog"
      aria-modal="true"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes lightboxFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `,
        }}
      />

      {/* Close Button - Clean '×' positioned in top-right */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white text-3xl font-light hover:scale-105 transition-all cursor-pointer shadow-md border border-white/10"
        aria-label="Close image"
      >
        &times;
      </button>

      {/* Zoomable Image Wrapper to crop overflow when zoomed */}
      <div
        ref={containerRef}
        className="w-[calc(100vw-20px)] h-[calc(100vh-20px)] overflow-hidden rounded-lg bg-white p-2 shadow-2xl flex items-center justify-center relative"
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain transition-transform duration-100 ease-out select-none"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
            transformOrigin: "center center",
            boxShadow: "0 1rem 3rem rgba(0, 0, 0, 0.4)",
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
          onMouseDown={(e) => {
            if (scale <= 1) return;
            e.preventDefault();
            setIsDragging(true);
            setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
          }}
          onMouseMove={(e) => {
            if (!isDragging || scale <= 1) return;
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;
            setPanOffset({ x: newX, y: newY });
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        />
      </div>
    </div>
  );
}
