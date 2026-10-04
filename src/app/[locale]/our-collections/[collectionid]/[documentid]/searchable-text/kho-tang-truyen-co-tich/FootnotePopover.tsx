"use client";

// Footnote citation bubble. Uses the same shadcn Popover (and so the same
// fade/zoom open-close animation) as the Hán-Nôm dictionary lookup in
// LookupableHanNomText.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { HIGHLIGHT_CLASSES } from "./renderStoryBlocks";

export default function FootnotePopover({
  displayNumber,
  highlighted = false,
  autoOpen = false,
  children,
}: {
  displayNumber: number;
  /** The Footnote's text contains the highlighted Index Name. */
  highlighted?: boolean;
  /** Scroll to this marker and open it on mount (a Chú thích Index Name target). */
  autoOpen?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("KhoTangTruyen");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!autoOpen) return;
    triggerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setOpen(true);
  }, [autoOpen]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label={t("footnote", { n: displayNumber })}
          className={cn(
            "align-super text-xs leading-none px-0.5 text-branding-brown underline cursor-pointer hover:opacity-80",
            highlighted && HIGHLIGHT_CLASSES
          )}
        >
          {displayNumber}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-w-[90vw] max-h-80 overflow-y-auto rounded-lg space-y-2">
        {children}
      </PopoverContent>
    </Popover>
  );
}
