"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Merriweather } from "next/font/google";
import { Link } from "@/i18n/routing";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const ImageSlideshow = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasSlides = Boolean(slides?.length);

  useEffect(() => {
    if (!hasSlides) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [hasSlides, slides?.length]);

  if (!hasSlides) {
    return (
      <div className="relative h-[320px] md:h-[460px] rounded bg-gray-200/60" />
    );
  }

  const slide = slides[currentIndex];

  return (
    <div className="relative">
      <div className="relative h-[420px] md:h-[460px]">
        {slide.href ? (
          <Link href={slide.href} className="block h-full">
            <Image
              unoptimized
              src={slide.img || "/placeholder.svg"}
              alt={slide.title || slide.caption || "Slide image"}
              className="object-cover h-[420px] md:h-[460px] w-full rounded-md"
              width={1920}
              height={1080}
              style={{ maxHeight: "100%", maxWidth: "100%" }}
            />
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/85 to-black/25 px-6 py-4">
              <div className="text-white text-xl tracking-wide uppercase font-semibold">
                {slide.caption}
              </div>
              <div
                className={`text-white text-xl leading-tight mt-2 ${merriweather.className}`}
              >
                {slide.title}
              </div>
              <div className="text-white/90 mt-2 text-md italic">
                {slide.date}
              </div>
            </div>
          </Link>
        ) : (
          <>
            <Image
              unoptimized
              src={slide.img || "/placeholder.svg"}
              alt={slide.caption || "Slide image"}
              className="object-cover h-[420px] md:h-[460px] w-full rounded-md"
              width={1920}
              height={1080}
              style={{ maxHeight: "100%", maxWidth: "100%" }}
            />
            <div className="absolute bottom-0 w-full bg-black/50 flex items-center transition-opacity duration-500">
              <p
                className={`text-white text-lg p-8 text-left ${merriweather.className}`}
              >
                {slide.caption}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              index === currentIndex ? "bg-branding-brown" : "bg-[#CCCCCC]"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlideshow;
