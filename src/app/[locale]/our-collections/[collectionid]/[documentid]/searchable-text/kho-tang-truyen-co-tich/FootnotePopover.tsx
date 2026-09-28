"use client";

// Footnote citation bubble. Uses the same shadcn Popover (and so the same
// fade/zoom open-close animation) as the Hán-Nôm dictionary lookup in
// LookupableHanNomText.

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function FootnotePopover({
  displayNumber,
  children,
}: {
  displayNumber: number;
  children: ReactNode;
}) {
  const t = useTranslations("KhoTangTruyen");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("footnote", { n: displayNumber })}
          className="align-super text-xs leading-none px-0.5 text-branding-brown underline cursor-pointer hover:opacity-80"
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
