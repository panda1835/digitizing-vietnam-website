"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { INTRO_PATH, Source, sourceNoteId } from "./data";

const CLOSE_DELAY_MS = 150;

/**
 * A Source Abbreviation that shows its Source on hover (mouse), and on tap
 * or Enter (touch, keyboard). Esc and a click outside close it.
 */
export function SourcePopover({
  abbreviation,
  source,
}: {
  abbreviation: string;
  source: Source | undefined;
}) {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.kho-tang");
  const [open, setOpen] = useState(false);
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        onPointerEnter={hoverOpen}
        onPointerLeave={hoverClose}
        className="font-semibold text-branding-brown underline decoration-dotted decoration-branding-brown/50 underline-offset-[3px] hover:decoration-solid focus:outline-none focus-visible:ring-2 focus-visible:ring-branding-brown/40 rounded-sm"
      >
        {abbreviation}
      </PopoverTrigger>
      <PopoverContent
        onPointerEnter={hoverOpen}
        onPointerLeave={hoverClose}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-80 max-w-[calc(100vw-32px)] bg-white border-branding-brown/15 rounded-xl text-branding-black"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-branding-brown/80">
          {source.abbreviation} · {source.kind}
        </p>
        <p className="mt-1 font-bold italic leading-snug">{source.title}</p>
        {(source.author || source.year) && (
          <p className="text-sm text-branding-black/75">
            {[source.author, source.year].filter(Boolean).join(", ")}
          </p>
        )}
        <p className="mt-2 text-sm font-light leading-relaxed line-clamp-4">{source.note}</p>
        <Link
          href={`${INTRO_PATH}#${sourceNoteId(source.note_id)}`}
          className="mt-2 inline-block text-sm font-semibold text-branding-brown underline underline-offset-2 hover:text-branding-brown/80"
        >
          {t("read-more")}
        </Link>
      </PopoverContent>
    </Popover>
  );
}
