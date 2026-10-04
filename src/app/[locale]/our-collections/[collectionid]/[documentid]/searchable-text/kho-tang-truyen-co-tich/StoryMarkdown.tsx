"use client";

import { useEffect, useRef } from "react";

import type { ParsedStory } from "./parseStoryMarkdown";
import { findNameMatches } from "./findNameMatches";
import { renderStoryBlocks, type RenderFootnote } from "./renderStoryBlocks";
import FootnotePopover from "./FootnotePopover";

/** Footnote text never contains markers of its own. */
const noFootnotes: RenderFootnote = () => null;

// Footnote-count mismatches are reported once, server-side, by data.ts.
//
// With an Index Name to highlight, scrolls on mount to the target Footnote's
// marker (opening its popover) when there is one, else to the first <mark>.
// Remount it (key) to re-run that for a new Entry or name.
export default function StoryMarkdown({
  body: { bodyMarkdown, footnotes },
  bulletLists = false,
  highlight,
  targetFootnoteIndex,
}: {
  body: ParsedStory;
  /** Render "- " lines as bullet lists (Bibliography Entries only). */
  bulletLists?: boolean;
  /** Index Name to highlight, in the Story text's spelling. */
  highlight?: string;
  /** 0-based index of the Footnote to scroll to and open. */
  targetFootnoteIndex?: number;
}) {
  const articleRef = useRef<HTMLElement>(null);
  const opensFootnote =
    !!highlight &&
    targetFootnoteIndex !== undefined &&
    footnotes[targetFootnoteIndex] !== undefined;

  useEffect(() => {
    if (!highlight || opensFootnote) return;
    articleRef.current
      ?.querySelector("mark")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight, opensFootnote]);

  const renderFootnote: RenderFootnote = (displayNumber, index) => {
    const footnote = footnotes[index];
    // A marker past the last parsed definition is a source-data defect:
    // show the numeral as plain text rather than a link to nothing.
    if (footnote === undefined) {
      return (
        <sup key={`fn-${index}`} className="text-xs px-0.5">
          {displayNumber}
        </sup>
      );
    }
    return (
      <FootnotePopover
        key={`fn-${index}`}
        displayNumber={displayNumber}
        highlighted={
          !!highlight && findNameMatches(footnote, highlight).length > 0
        }
        autoOpen={opensFootnote && index === targetFootnoteIndex}
      >
        {renderStoryBlocks(footnote, noFootnotes, {
          variant: "footnote",
          highlight,
        })}
      </FootnotePopover>
    );
  };

  return (
    <article ref={articleRef} className="space-y-5">
      {renderStoryBlocks(bodyMarkdown, renderFootnote, {
        bulletLists,
        highlight,
      })}
    </article>
  );
}
