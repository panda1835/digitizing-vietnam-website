"use client";

import React, { useState } from "react";
import Image from "next/image";
import FullImagePopup from "@/components/common/FullImagePopup";

interface ClickableImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  unoptimized?: boolean;
}

export default function ClickableImage({
  src,
  alt,
  width,
  height,
  className,
  unoptimized = true,
}: ClickableImageProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleImageClick = () => {
    setIsPopupOpen(true);
  };

  return (
    <>
      <Image
        unoptimized={unoptimized}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`cursor-zoom-in hover:opacity-90 transition-opacity ${
          className || ""
        }`}
        onClick={handleImageClick}
      />
      <FullImagePopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        imageUrl={src}
      />
    </>
  );
}
