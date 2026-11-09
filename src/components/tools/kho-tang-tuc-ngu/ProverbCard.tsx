"use client";

import { Fragment, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Check, ImageOff, Link2, Maximize2 } from "lucide-react";
import { Merriweather } from "next/font/google";
import { Citation, LIST_PATH, ProverbEntry, Run, Sources, entryImageUrl } from "./data";
import { SourcePopover } from "./SourcePopover";

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});

function Runs({ runs, sources }: { runs: Run[]; sources: Sources }) {
  return (
    <>
      {runs.map((run, i) => {
        if (run.source) {
          return <SourcePopover key={i} abbreviation={run.text} source={sources[run.source]} />;
        }
        if (run.general) {
          return (
            <abbr key={i} title={run.general} className="no-underline">
              {run.text}
            </abbr>
          );
        }
        if (run.em) {
          // The words a Variant or Correction differs by, italic in the book.
          return (
            <mark key={i} className="bg-[#f3e2b8] text-inherit italic rounded-sm px-0.5">
              {run.text}
            </mark>
          );
        }
        if (run.strong) return <strong key={i}>{run.text}</strong>;
        return <Fragment key={i}>{run.text}</Fragment>;
      })}
    </>
  );
}

function Citations({ citations, sources }: { citations: Citation[]; sources: Sources }) {
  if (citations.length === 0) return null;
  return (
    <p className="text-sm text-branding-black/80 leading-relaxed">
      {citations.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && "; "}
          <SourcePopover abbreviation={c.abbreviation} source={sources[c.abbreviation]} />
          {c.pages && ` ${c.pages}`}
        </Fragment>
      ))}
    </p>
  );
}

/**
 * One Proverb Entry, laid out like the tu-dien cards: the text on the left in
 * the book's order, its Entry Image on the right.
 */
export function ProverbCard({
  entry,
  sources,
  onSeeAlso,
  onOpenImage,
}: {
  entry: ProverbEntry;
  sources: Sources;
  onSeeAlso: (anchor: string) => void;
  onOpenImage: (entry: ProverbEntry) => void;
}) {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.kho-tang");
  const locale = useLocale();
  const [imageFailed, setImageFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}/${locale}${LIST_PATH}#${entry.anchor}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt(t("copy-link"), url);
    }
  };

  return (
    <article className="bg-white p-6 md:p-8 rounded-3xl border border-branding-brown/10 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-stretch transition-all duration-300 hover:shadow-md">
      {/* Left Side: Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-branding-brown">
          <span className="px-3 py-1 rounded-md bg-branding-brown/10">{entry.name}</span>
          {entry.book_pages.length > 0 && (
            <span className="font-medium normal-case tracking-normal text-branding-black/60">
              {t("page", { pages: entry.book_pages.join("–") })}
            </span>
          )}
          <button
            onClick={copyLink}
            title={t("copy-link")}
            aria-label={t("copy-link")}
            className="ml-auto p-1.5 rounded-md text-branding-black/50 hover:text-branding-brown hover:bg-branding-brown/5"
          >
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <h4
            className={`${merriweather.className} text-lg md:text-xl text-branding-black font-bold whitespace-pre-line leading-relaxed`}
          >
            {entry.proverb}
          </h4>
          <Citations citations={entry.citations} sources={sources} />
        </div>

        {entry.variants.map((variant, i) => (
          <div key={i} className="flex flex-col gap-1.5 pl-4 border-l-2 border-branding-brown/20">
            <span className="self-start text-[11px] font-extrabold uppercase tracking-widest text-branding-brown/80">
              {variant.label}
            </span>
            <p className={`${merriweather.className} text-base md:text-lg text-branding-black leading-relaxed`}>
              <Runs runs={variant.text} sources={sources} />
            </p>
            <Citations citations={variant.citations} sources={sources} />
          </div>
        ))}

        {entry.notes.length > 0 && (
          <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
            {entry.notes.map((note, i) => (
              <p key={i} className="text-sm md:text-[15px] text-branding-black/85 font-light leading-relaxed">
                <Runs runs={note} sources={sources} />
              </p>
            ))}
          </div>
        )}

        {entry.corrections.map((correction, i) => (
          <div key={i} className="rounded-xl bg-[#fbf5e8] border border-[#e9d6a8] px-4 py-3 text-sm leading-relaxed text-branding-black/85">
            <span className="mr-1.5 font-bold text-[#8a5a12]">{t("correction")}:</span>
            <Runs runs={correction.sentence} sources={sources} />
          </div>
        ))}

        {entry.see_also.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-branding-black/60">{t("see-also")}:</span>
            {entry.see_also.map((see, i) =>
              see.anchor ? (
                <button
                  key={i}
                  onClick={() => onSeeAlso(see.anchor!)}
                  className="px-3 py-1 rounded-full border border-branding-brown/30 text-branding-black hover:border-branding-brown hover:text-branding-brown transition-colors text-left"
                >
                  <span className="font-semibold">{see.name}</span>
                  {see.preview && <span className="font-light"> · {see.preview}</span>}
                </button>
              ) : (
                <span
                  key={i}
                  title={t("unresolved")}
                  className="px-3 py-1 rounded-full border border-dashed border-gray-300 text-branding-black/50 cursor-help"
                >
                  {see.name}
                </span>
              ),
            )}
          </div>
        )}
      </div>

      {/* Right Side: Entry Image (Whole element clickable) */}
      {imageFailed ? (
        <div className="w-full md:w-[32%] min-h-[160px] flex-shrink-0 border border-dashed border-gray-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center gap-2 p-4 text-center text-xs text-gray-500">
          <ImageOff className="h-6 w-6 text-gray-400" />
          {t("image-error")}
        </div>
      ) : (
        <button
          onClick={() => onOpenImage(entry)}
          className="w-full md:w-[32%] min-h-[160px] flex-shrink-0 border border-gray-150 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center relative group cursor-zoom-in"
        >
          <Image
            src={entryImageUrl(entry)}
            alt={entry.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain p-2"
            onError={() => setImageFailed(true)}
            unoptimized
          />

          {/* Maximize zoom overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
            <span className="px-4 py-2 bg-white/95 text-branding-black text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5">
              <Maximize2 className="h-3.5 w-3.5" />
              {t("zoom")}
            </span>
          </div>
        </button>
      )}
    </article>
  );
}
