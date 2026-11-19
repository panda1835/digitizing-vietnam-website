"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ExternalLink, Loader2, X } from "lucide-react";
import { Link } from "@/i18n/routing";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { TuDienEntryCard } from "@/components/tools/ca-dao-tuc-ngu/TuDienEntryCard";
import { ProverbCard } from "./ProverbCard";
import {
  ProverbEntry,
  Sources,
  TU_DIEN_PATH,
  TuDienEntry,
  TuDienMatch,
  fetchTuDienEntry,
  findEntry,
} from "./data";

const focusClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-branding-brown";

/** A Proverb Entry's anchor, or a Từ điển Match followed from one. */
export type ModalItem = string | TuDienMatch;

/** The anchor of the last Proverb Entry in the stack, if any. */
export function topAnchor(stack: ModalItem[]): string | undefined {
  return stack.filter((item): item is string => typeof item === "string").pop();
}

/**
 * One entry shown over the list, for a See-also, a Từ điển Match or a
 * #anchor deep link. `stack` holds the items followed so far; the last is
 * shown, and a link inside the modal pushes onto it rather than touching
 * the list.
 */
export function EntryModal({
  stack,
  sources,
  onPush,
  onBack,
  onClose,
  onOpenImage,
  onOpenTuDienScan,
  lightboxOpen,
}: {
  stack: ModalItem[];
  sources: Sources;
  onPush: (item: ModalItem) => void;
  onBack: () => void;
  onClose: () => void;
  onOpenImage: (entry: ProverbEntry) => void;
  onOpenTuDienScan: (id: string) => void;
  lightboxOpen: boolean;
}) {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.kho-tang");
  const locale = useLocale();
  const item = stack[stack.length - 1];
  const anchor = typeof item === "string" ? item : undefined;
  const match = typeof item === "string" ? undefined : item;
  // Each loaded entry keeps the key it was loaded for, so a different item
  // never shows the previous one, and Back to it needs no reload.
  const [loadedEntry, setLoadedEntry] = useState<{
    anchor: string;
    value: ProverbEntry | null;
  } | null>(null);
  const [loadedTuDien, setLoadedTuDien] = useState<{
    id: string;
    value: TuDienEntry | null;
  } | null>(null);
  const entry =
    anchor && loadedEntry?.anchor === anchor ? loadedEntry.value : undefined;
  const tuDienEntry =
    match && loadedTuDien?.id === match.id ? loadedTuDien.value : undefined;

  useEffect(() => {
    if (!anchor) return;
    let cancelled = false;
    findEntry(anchor)
      .then((found) => !cancelled && setLoadedEntry({ anchor, value: found }))
      .catch(() => !cancelled && setLoadedEntry({ anchor, value: null }));
    return () => {
      cancelled = true;
    };
  }, [anchor]);

  useEffect(() => {
    if (!match) return;
    let cancelled = false;
    fetchTuDienEntry(match)
      .then(
        (found) => !cancelled && setLoadedTuDien({ id: match.id, value: found })
      )
      .catch(() => !cancelled && setLoadedTuDien({ id: match.id, value: null }));
    return () => {
      cancelled = true;
    };
  }, [match]);

  const loading = anchor ? entry === undefined : tuDienEntry === undefined;

  return (
    <Dialog open={stack.length > 0} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        // The lightbox sits outside the dialog; using it must not close the dialog.
        onInteractOutside={(e) => lightboxOpen && e.preventDefault()}
        onEscapeKeyDown={(e) => lightboxOpen && e.preventDefault()}
        // The default × would sit under the sticky header; the header has its own.
        className="max-w-none w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:w-[min(1100px,calc(100vw-48px))] p-0 gap-0 bg-branding-gray border-0 md:rounded-2xl overflow-y-auto flex flex-col [&>button:last-child]:hidden"
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 md:px-6 py-3 bg-branding-gray/95 backdrop-blur border-b border-branding-brown/10">
          {stack.length > 1 && (
            <button
              type="button"
              onClick={onBack}
              className={`inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#805516] hover:text-branding-black ${focusClass}`}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t("back")}
            </button>
          )}
          <DialogTitle className="text-sm font-medium text-branding-black/70">
            {match ? t("tu-dien-title") : anchor?.replace("-", " ")}
          </DialogTitle>
          <DialogClose
            aria-label={t("close")}
            className={`ml-auto flex h-10 w-10 items-center justify-center rounded-md text-branding-black/60 hover:text-[#956319] hover:bg-branding-brown/5 ${focusClass}`}
          >
            <X className="h-5 w-5" aria-hidden />
          </DialogClose>
        </div>

        <div className="p-4 md:p-6">
          {item && loading && (
            <div role="status" className="flex items-center justify-center py-20">
              <Loader2
                className="animate-spin h-8 w-8 text-branding-brown"
                aria-hidden
              />
              <span className="sr-only">{t("loading")}</span>
            </div>
          )}
          {anchor && entry === null && (
            <p className="text-center py-20 text-branding-black/65">
              {t("not-found", { name: anchor.replace("-", " ") })}
            </p>
          )}
          {anchor && entry && (
            <ProverbCard
              key={entry.anchor}
              entry={entry}
              sources={sources}
              onSeeAlso={onPush}
              onTuDien={onPush}
              onOpenImage={onOpenImage}
            />
          )}
          {match && tuDienEntry === null && (
            <p className="text-center py-20 text-branding-black/65">
              {t("tu-dien-not-found")}
            </p>
          )}
          {match && tuDienEntry && (
            <TuDienEntryCard
              key={tuDienEntry.id}
              id={tuDienEntry.id}
              poem={tuDienEntry.poem}
              category={tuDienEntry.category}
              explanation={tuDienEntry.explanation ?? ""}
              locale={locale}
              onOpenScan={onOpenTuDienScan}
            >
              <div className="mt-auto flex flex-col gap-2 text-sm">
                {match.kind === "approximate" && (
                  <p className="text-branding-black/65">
                    {t("tu-dien-approximate")}
                  </p>
                )}
                <Link
                  href={`${TU_DIEN_PATH}#${match.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`self-start inline-flex items-center gap-1.5 text-[#956319] underline underline-offset-2 hover:text-branding-black ${focusClass}`}
                >
                  {t("tu-dien-open-page")}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  <span className="sr-only">{t("new-tab")}</span>
                </Link>
              </div>
            </TuDienEntryCard>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
