"use client";

import { Fragment, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Link2, Scan } from "lucide-react";
import { Merriweather } from "next/font/google";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Citation, LIST_PATH, ProverbEntry, Run, Sources } from "./data";
import { SourcePopover } from "./SourcePopover";

const focusClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-branding-brown";

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});

function Runs({ runs, sources }: { runs: Run[]; sources: Sources }) {
  const displayRuns = runs.map((run, i) => {
    if (run.general === "Nb") {
      return { ...run, text: "Nghĩa bóng:", general: undefined, strong: true };
    }
    if (runs[i - 1]?.general === "Nb") {
      return { ...run, text: run.text.replace(/^\s*:\s*/, " ") };
    }
    return run;
  });

  return (
    <>
      {displayRuns.map((run, i) => {
        if (run.source) {
          return (
            <SourcePopover
              key={i}
              abbreviation={run.text}
              source={sources[run.source]}
            />
          );
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
            <mark
              key={i}
              className="bg-[#f3e2b8] text-inherit italic rounded-sm px-0.5"
            >
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

function Citations({
  citations,
  sources,
}: {
  citations: Citation[];
  sources: Sources;
}) {
  if (citations.length === 0) return null;
  return (
    <p className="text-xs text-branding-black/65 leading-relaxed">
      {citations.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && "; "}
          <SourcePopover
            abbreviation={c.abbreviation}
            source={sources[c.abbreviation]}
            subtle
          />
          {c.pages && ` ${c.pages}`}
        </Fragment>
      ))}
    </p>
  );
}

/**
 * A reading-first entry: proverb, notes, paired variants and citations,
 * then reference metadata and access to the original scan.
 */
export function ProverbCard({
  entry,
  sources,
  onSeeAlso,
}: {
  entry: ProverbEntry;
  sources: Sources;
  onSeeAlso: (anchor: string) => void;
}) {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.kho-tang");
  const locale = useLocale();
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
    <article className="bg-white/90 px-5 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4 rounded-xl border border-branding-black/10">
      <h2
        className={`${merriweather.className} text-xl text-branding-black whitespace-pre-line break-words leading-relaxed`}
      >
        {entry.proverb}
      </h2>

      {entry.notes.length > 0 && (
        <div className="mt-3 flex flex-col gap-2 text-base text-branding-black/75 leading-relaxed break-words max-w-prose">
          {entry.notes.map((note, i) => (
            <p key={i}>
              <Runs runs={note} sources={sources} />
            </p>
          ))}
        </div>
      )}

      {entry.corrections.length > 0 && (
        <section className="mt-4 text-sm leading-relaxed text-branding-black/75">
          <h3 className="font-medium text-branding-black mb-1.5">
            {t("correction")}
          </h3>
          {entry.corrections.map((correction, i) => (
            <p key={i}>
              <Runs runs={correction.sentence} sources={sources} />
            </p>
          ))}
        </section>
      )}

      {entry.variants.length > 0 && (
        <section className="mt-5 border-t border-branding-black/10 pt-4">
          <h3 className="text-sm font-medium text-branding-black mb-2">
            {t("has-variants")}
          </h3>
          <ul className="space-y-2.5">
            {entry.variants.map((variant, i) => (
              <li
                key={i}
                className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-6"
              >
                <p className="min-w-0 text-base leading-relaxed text-branding-black/85 break-words">
                  <Runs runs={variant.text} sources={sources} />
                </p>
                <div className="sm:max-w-[45%] shrink-0 sm:text-right">
                  <Citations citations={variant.citations} sources={sources} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {entry.see_also.length > 0 && (
        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="text-branding-black/65">{t("see-also")}:</span>
          {entry.see_also.map((see, i) =>
            see.anchor ? (
              <button
                key={i}
                type="button"
                onClick={() => onSeeAlso(see.anchor!)}
                className={`text-left text-[#956319] underline underline-offset-2 hover:text-branding-black ${focusClass}`}
              >
                {see.name}
                {see.preview && (
                  <span className="text-branding-black/65">
                    {" "}
                    · {see.preview}
                  </span>
                )}
              </button>
            ) : (
              <span
                key={i}
                title={t("unresolved")}
                className="text-branding-black/65 cursor-help"
              >
                {see.name}
              </span>
            )
          )}
        </div>
      )}

      <footer className="mt-5 pt-3 border-t border-branding-black/10 flex flex-col gap-0">
        {entry.citations.length > 0 && (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xs text-branding-black/65">
              {t("source")}:
            </span>
            <Citations citations={entry.citations} sources={sources} />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-branding-black/65">
          <span>
            {entry.letter}.{entry.number}
          </span>
          {entry.book_pages.length > 0 && (
            <span>{t("page", { pages: entry.book_pages.join("–") })}</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {/* Entry Images are moving to IIIF; until then the button says so. */}
            <Popover>
              <PopoverTrigger
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-branding-black/75 hover:text-[#956319] hover:bg-branding-brown/5 ${focusClass}`}
                aria-label={`${t("original-scan")}: ${entry.name}`}
              >
                <Scan className="h-4 w-4" aria-hidden />
                {t("original-scan")}
              </PopoverTrigger>
              <PopoverContent
                side="top"
                sideOffset={8}
                collisionPadding={16}
                className="w-72 max-w-[calc(100vw-32px)] p-4 bg-white border-branding-black/10 rounded-xl shadow-lg text-sm leading-relaxed text-branding-black/75"
              >
                {t("no-image")}
              </PopoverContent>
            </Popover>
            <button
              type="button"
              onClick={copyLink}
              title={copied ? t("copied") : t("copy-link")}
              aria-label={copied ? t("copied") : t("copy-link")}
              className={`flex h-10 w-10 items-center justify-center rounded-md text-branding-black/65 hover:text-[#956319] hover:bg-branding-brown/5 ${focusClass}`}
            >
              {copied ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Link2 className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </footer>
    </article>
  );
}
