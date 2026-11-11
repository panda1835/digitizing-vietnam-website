"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProverbCard } from "./ProverbCard";
import { ProverbEntry, Sources, findEntry } from "./data";

const focusClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-branding-brown";

/**
 * One Proverb Entry shown over the list, for a See-also or a #anchor deep
 * link. `stack` holds the anchors followed so far; the last is shown, and a
 * See-also inside the modal pushes onto it rather than touching the list.
 */
export function EntryModal({
  stack,
  sources,
  onPush,
  onBack,
  onClose,
}: {
  stack: string[];
  sources: Sources;
  onPush: (anchor: string) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.kho-tang");
  const anchor = stack[stack.length - 1];
  const [entry, setEntry] = useState<ProverbEntry | null | undefined>(
    undefined
  );

  useEffect(() => {
    if (!anchor) return;
    let cancelled = false;
    setEntry(undefined);
    findEntry(anchor)
      .then((found) => !cancelled && setEntry(found))
      .catch(() => !cancelled && setEntry(null));
    return () => {
      cancelled = true;
    };
  }, [anchor]);

  return (
    <Dialog open={stack.length > 0} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        // The default × would sit under the sticky header; the header has its own.
        className="max-w-none w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:w-[min(1100px,calc(100vw-48px))] p-0 gap-0 bg-branding-gray border-0 md:rounded-2xl overflow-y-auto flex flex-col [&>button:last-child]:hidden"
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 md:px-6 py-3 bg-branding-gray/95 backdrop-blur border-b border-branding-brown/10">
          {stack.length > 1 && (
            <button
              type="button"
              onClick={onBack}
              className={`inline-flex items-center gap-1.5 text-sm font-medium text-[#956319] hover:text-branding-black ${focusClass}`}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </button>
          )}
          <DialogTitle className="text-sm font-medium text-branding-black/70">
            {anchor?.replace("-", " ")}
          </DialogTitle>
          <DialogClose
            aria-label={t("close")}
            className={`ml-auto flex h-10 w-10 items-center justify-center rounded-md text-branding-black/60 hover:text-[#956319] hover:bg-branding-brown/5 ${focusClass}`}
          >
            <X className="h-5 w-5" />
          </DialogClose>
        </div>

        <div className="p-4 md:p-6">
          {entry === undefined && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin h-8 w-8 text-branding-brown" />
            </div>
          )}
          {entry === null && (
            <p className="text-center py-20 text-branding-black/65">
              {t("not-found", { name: anchor?.replace("-", " ") })}
            </p>
          )}
          {entry && (
            <ProverbCard
              key={entry.anchor}
              entry={entry}
              sources={sources}
              onSeeAlso={onPush}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
