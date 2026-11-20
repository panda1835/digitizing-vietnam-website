"use client";

import type { ReactNode } from "react";
import { Loader2, Maximize2 } from "lucide-react";
import { Merriweather } from "next/font/google";
import Image from "next/image";

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});

const focusClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-branding-brown";

/** The cropped scan of a Từ điển Entry on its book page. */
export const tuDienScanUrl = (id: string) =>
  `https://iiif.digitizingvietnam.com/iiif/2/tu-dien-thanh-ngu-tuc-ngu-ca-dao-viet-nam/output-folder/${id}.png/full/full/0/default.jpg`;

// Helper to clean category text
export const cleanCategory = (cat?: string) => {
  if (!cat) return "";
  return cat.replace(/[()]/g, "").trim().toUpperCase();
};

/**
 * One Từ điển Entry: category, poem and explanation beside its scan. Shown on
 * the Từ điển page and in Kho tàng tục ngữ's entry modal. Without an
 * explanation yet, a spinner stands in for it; `children` go below it.
 */
export function TuDienEntryCard({
  id,
  poem,
  category,
  explanation,
  locale,
  highlighted = false,
  onOpenScan,
  children,
}: {
  id: string;
  poem: string;
  category?: string;
  explanation?: string;
  locale: string;
  highlighted?: boolean;
  onOpenScan: (id: string) => void;
  children?: ReactNode;
}) {
  return (
    <article
      id={id}
      className={`bg-white/90 p-5 sm:p-6 rounded-xl border border-branding-black/10 flex flex-col md:flex-row gap-6 lg:gap-8 items-stretch ${
        highlighted ? "ring-2 ring-[#956319]" : ""
      }`}
    >
      {/* Left Side: Content */}
      <div className="min-w-0 flex-1 flex flex-col gap-4">
        <div>
          <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-md bg-branding-brown/10 text-[#805516]">
            {cleanCategory(category)}
          </span>
        </div>

        {/* Poem text */}
        <h3
          className={`${merriweather.className} text-lg md:text-xl text-branding-black whitespace-pre-line break-words leading-[1.7] md:leading-[1.7]`}
        >
          {poem}
        </h3>

        {/* Meaning & Explanation text */}
        <div className="border-t border-branding-black/10 pt-4 flex flex-col gap-2">
          {explanation !== undefined ? (
            <p className="text-base text-branding-black/75 leading-relaxed whitespace-pre-line break-words max-w-prose">
              {explanation}
            </p>
          ) : (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="animate-spin h-4 w-4 text-branding-brown" />
              <span className="text-xs text-branding-black/65">
                {locale === "vi"
                  ? "Đang tải nghĩa giải thích..."
                  : "Loading the explanation..."}
              </span>
            </div>
          )}
        </div>

        {children}
      </div>

      {/* Right Side: Cropped Page Scan (Whole element clickable) */}
      <button
        type="button"
        aria-label={`${
          locale === "vi" ? "Xem bản quét" : "View scan"
        }: ${poem}`}
        onClick={() => onOpenScan(id)}
        className={`w-full md:w-[32%] min-h-[240px] flex-shrink-0 border border-branding-black/10 rounded-lg overflow-hidden bg-branding-gray/50 flex items-center justify-center relative group cursor-zoom-in ${focusClass}`}
      >
        <Image
          src={tuDienScanUrl(id)}
          alt={
            locale === "vi"
              ? "Bản quét trang sách gốc"
              : "Scan of the original book page"
          }
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain"
          loading="lazy"
        />

        {/* Maximize zoom overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-4 py-2 bg-white/95 text-branding-black text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5">
            <Maximize2 className="h-3.5 w-3.5" />
            {locale === "vi" ? "Xem phóng to" : "View larger"}
          </span>
        </div>
      </button>
    </article>
  );
}
