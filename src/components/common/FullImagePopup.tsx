"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface TaberdImagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  children?: React.ReactNode;
}

export default function TaberdImagePopup({
  isOpen,
  onClose,
  imageUrl,
}: TaberdImagePopupProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      if (scale === 1) {
        const img = imageRef.current;
        const container = containerRef.current;
        if (img && container) {
          const rect = img.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const CW = containerRect.width;
          const CH = containerRect.height;
          const W = rect.width;
          const H = rect.height;
          const ix = e.clientX - rect.left;
          const iy = e.clientY - rect.top;
          const S = 2.5;
          const px = W * (S / 2 - 0.5) + ix * (1 - S);
          const py = H * (S / 2 - 0.5) + iy * (1 - S);
          setPosition({ x: px, y: py });
          setScale(S);
        }
      } else {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    },
    [scale]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (scale > 1) {
        e.preventDefault();
        const factor = 0.5;
        const img = imageRef.current;
        const container = containerRef.current;
        if (img && container) {
          const containerRect = container.getBoundingClientRect();
          const CW = containerRect.width;
          const CH = containerRect.height;
          const scaledWidth = img.naturalWidth * scale;
          const scaledHeight = img.naturalHeight * scale;

          const maxX = Math.max(0, (scaledWidth - CW) / 2);
          const maxY = Math.max(0, (scaledHeight - CH) / 2);

          setPosition((prev) => ({
            x: Math.max(-maxX, Math.min(maxX, prev.x - e.deltaX * factor)),
            y: Math.max(-maxY, Math.min(maxY, prev.y - e.deltaY * factor)),
          }));
        }
      }
    },
    [scale]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (scale > 1) {
        const step = 50;
        const img = imageRef.current;
        const container = containerRef.current;
        if (img && container) {
          const containerRect = container.getBoundingClientRect();
          const CW = containerRect.width;
          const CH = containerRect.height;
          const scaledWidth = img.naturalWidth * scale;
          const scaledHeight = img.naturalHeight * scale;

          const maxX = Math.max(0, (scaledWidth - CW) / 2);
          const maxY = Math.max(0, (scaledHeight - CH) / 2);

          if (e.key === "ArrowLeft") {
            setPosition((prev) => ({
              ...prev,
              x: Math.max(-maxX, Math.min(maxX, prev.x + step)),
            }));
          } else if (e.key === "ArrowRight") {
            setPosition((prev) => ({
              ...prev,
              x: Math.max(-maxX, Math.min(maxX, prev.x - step)),
            }));
          } else if (e.key === "ArrowUp") {
            setPosition((prev) => ({
              ...prev,
              y: Math.max(-maxY, Math.min(maxY, prev.y + step)),
            }));
          } else if (e.key === "ArrowDown") {
            setPosition((prev) => ({
              ...prev,
              y: Math.max(-maxY, Math.min(maxY, prev.y - step)),
            }));
          }
        }
      }
    },
    [scale]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const getCursorStyle = useCallback(() => {
    if (scale > 1) return "zoom-out";
    return "zoom-in";
  }, [scale]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full h-full overflow-hidden">
        {/* Only keep the close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-20 bg-gray-200 rounded-lg p-2 hover:bg-gray-300"
        >
          <X className="h-6 w-6 text-black" />
        </button>

        <div
          ref={containerRef}
          className="overflow-hidden rounded-lg w-full h-full flex items-center justify-center"
          style={{ cursor: getCursorStyle() }}
          onWheel={handleWheel}
        >
          <Image
            ref={imageRef}
            src={imageUrl}
            alt="Dictionary page"
            width={800}
            height={1000}
            className="select-none"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${
                position.y / scale
              }px)`,
              maxHeight: scale === 1 ? "95vh" : "none",
              width: "auto",
              height: "auto",
            }}
            unoptimized
            onClick={handleImageClick}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
