"use client";

import { useId, useRef, useState } from "react";
import { Merriweather } from "next/font/google";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Source } from "./data";

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});
const CLOSE_DELAY_MS = 150;

/**
 * A Source Abbreviation that shows its Source on hover (mouse), and on tap
 * or Enter (touch, keyboard). Esc and a click outside close it.
 * The full source note is readable here, without a second dialog.
 */
export function SourcePopover({
  abbreviation,
  source,
  subtle = false,
}: {
  abbreviation: string;
  source: Source | undefined;
  subtle?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  if (!source) return <span>{abbreviation}</span>;

  // Hover opens and closes for a mouse only; a touch tap would otherwise
  // fire pointerenter and then the click toggle, closing it again.
  const hoverOpen = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hoverClose = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          onPointerEnter={hoverOpen}
          onPointerLeave={hoverClose}
          className={`${
            subtle
              ? "font-normal text-branding-black/65 decoration-branding-black/30"
              : "font-medium text-[#956319] decoration-branding-brown/50"
          } underline decoration-dotted underline-offset-[3px] hover:decoration-solid hover:text-[#956319] focus:outline-none focus-visible:ring-2 focus-visible:ring-branding-brown/40 rounded-sm`}
        >
          {abbreviation}
        </PopoverTrigger>
        <PopoverContent
          onPointerEnter={hoverOpen}
          onPointerLeave={hoverClose}
          onOpenAutoFocus={(e) => e.preventDefault()}
          aria-labelledby={titleId}
          sideOffset={8}
          collisionPadding={16}
          className="w-96 max-w-[calc(100vw-32px)] max-h-[min(80dvh,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain p-5 bg-white border-branding-black/10 rounded-xl shadow-lg text-branding-black"
        >
          <h3
            id={titleId}
            className={`${merriweather.className} text-base leading-relaxed break-words`}
          >
            {source.title}
          </h3>
          {(source.author || source.year) && (
            <p className="mt-2 text-sm leading-relaxed text-branding-black/65">
              {[source.author, source.year].filter(Boolean).join(", ")}
            </p>
          )}
          <div className="mt-4 border-t border-branding-black/10 pt-3">
            <p className="text-sm leading-relaxed text-branding-black/75 whitespace-pre-line break-words">
              {source.note}
            </p>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-branding-black/65">
            {source.abbreviation} · {source.kind}
          </p>
        </PopoverContent>
      </Popover>
    </>
  );
}
