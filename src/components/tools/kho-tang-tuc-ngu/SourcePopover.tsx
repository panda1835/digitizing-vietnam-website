"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Source } from "./data";

const CLOSE_DELAY_MS = 150;

/**
 * A Source Abbreviation that shows its Source on hover (mouse), and on tap
 * or Enter (touch, keyboard). Esc and a click outside close it. Its "read
 * more" opens the Source's full note in a modal, over the page.
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
  const [noteOpen, setNoteOpen] = useState(false);
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

  const openNote = () => {
    clearTimeout(closeTimer.current);
    setOpen(false);
    setNoteOpen(true);
  };

  return (
    <>
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
          <p className="mt-2 text-sm font-light leading-relaxed line-clamp-4">
            {source.note}
          </p>
          <button
            type="button"
            onClick={openNote}
            className="mt-2 inline-block text-sm font-semibold text-branding-brown underline underline-offset-2 hover:text-branding-brown/80"
          >
            {t("read-more")}
          </button>
        </PopoverContent>
      </Popover>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent
          // The default × would sit under the sticky header; the header has its own.
          className="max-w-none w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:w-[min(720px,calc(100vw-48px))] p-0 gap-0 bg-branding-gray border-0 md:rounded-3xl overflow-y-auto flex flex-col [&>button:last-child]:hidden"
        >
          <div className="sticky top-0 z-10 flex items-center gap-3 px-4 md:px-6 py-3 bg-branding-gray/95 backdrop-blur border-b border-branding-brown/10">
            <DialogTitle className="text-sm font-bold uppercase tracking-widest text-branding-black/70">
              {source.abbreviation} · {source.kind}
            </DialogTitle>
            <DialogClose
              aria-label={t("close")}
              className="ml-auto p-2 rounded-full text-branding-black/60 hover:text-branding-black hover:bg-branding-black/5"
            >
              <X className="h-5 w-5" />
            </DialogClose>
          </div>

          <div className="p-4 md:p-6">
            <article className="bg-white p-6 md:p-8 rounded-3xl border border-branding-brown/10 shadow-sm text-branding-black">
              <p className="text-xl font-bold italic leading-snug">
                {source.title}
              </p>
              {(source.author || source.year) && (
                <p className="mt-1 text-branding-black/75">
                  {[source.author, source.year].filter(Boolean).join(", ")}
                </p>
              )}
              <p className="mt-4 font-light leading-relaxed whitespace-pre-line">
                {source.note}
              </p>
            </article>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
