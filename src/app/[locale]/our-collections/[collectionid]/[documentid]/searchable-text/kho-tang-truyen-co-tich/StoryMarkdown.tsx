"use client";

import type { ParsedStory } from "./parseStoryMarkdown";
import { renderStoryBlocks, type RenderFootnote } from "./renderStoryBlocks";
import FootnotePopover from "./FootnotePopover";

/** Footnote text never contains markers of its own. */
const noFootnotes: RenderFootnote = () => null;

// Footnote-count mismatches are reported once, server-side, by data.ts.
export default function StoryMarkdown({
  body: { bodyMarkdown, footnotes },
  bulletLists = false,
}: {
  body: ParsedStory;
  /** Render "- " lines as bullet lists (Bibliography Entries only). */
  bulletLists?: boolean;
}) {
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
      <FootnotePopover key={`fn-${index}`} displayNumber={displayNumber}>
        {renderStoryBlocks(footnote, noFootnotes, { variant: "footnote" })}
      </FootnotePopover>
    );
  };

  return (
    <article className="space-y-5">
      {renderStoryBlocks(bodyMarkdown, renderFootnote, { bulletLists })}
    </article>
  );
}
