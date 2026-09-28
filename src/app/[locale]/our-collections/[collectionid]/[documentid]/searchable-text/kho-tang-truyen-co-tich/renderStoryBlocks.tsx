// Renders the narrow markdown subset the extraction pipeline emits for this
// book (extractor/formatters.py in vsc-tri-thuc-ban-dia): #/##/### headings,
// plain-text paragraphs, "> " verse lines, the Bibliography's "- " bullet
// lists (one nested level, "  - "), and the `[k](#fn-i)` footnote links
// parseStoryMarkdown generates. Nothing else occurs in this corpus, so nothing
// else is handled — and no markdown dependency is needed.
//
// Bullet lists are opt-in: Stories and Essays open dialogue lines with "- ",
// which must stay prose.

import type { ReactNode } from "react";
import { Merriweather } from "next/font/google";

import { cn } from "@/lib/utils";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const FOOTNOTE_LINK = /\[(\d+)\]\(#fn-(\d+)\)/g;
const HEADING = /^(#{1,3})\s+(.*)$/;
const VERSE_LINE = /^>\s?/;
const LIST_ITEM = /^( *)- (.*)$/;

export type RenderFootnote = (displayNumber: number, index: number) => ReactNode;

type Variant = "body" | "footnote";

export interface RenderOptions {
  variant?: Variant;
  /** Render "- " lines as bullet lists (Bibliography Entries only). */
  bulletLists?: boolean;
}

type RunKind = "verse" | "list" | "text";

const renderInline = (text: string, renderFootnote: RenderFootnote): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of Array.from(text.matchAll(FOOTNOTE_LINK))) {
    if (match.index! > last) nodes.push(text.slice(last, match.index));
    nodes.push(renderFootnote(Number(match[1]), Number(match[2])));
    last = match.index! + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};

/** Splits a block into consecutive runs of verse, list and prose lines. */
const splitRuns = (lines: string[], bulletLists: boolean) => {
  const runs: { kind: RunKind; lines: string[] }[] = [];
  for (const line of lines) {
    const kind: RunKind = VERSE_LINE.test(line)
      ? "verse"
      : bulletLists && LIST_ITEM.test(line)
        ? "list"
        : "text";
    const current = runs[runs.length - 1];
    if (current?.kind === kind) current.lines.push(line);
    else runs.push({ kind, lines: [line] });
  }
  return runs;
};

/** Groups list lines into top-level items, each with its indented sub-items. */
const toListItems = (lines: string[]) => {
  const items: { text: string; children: string[] }[] = [];
  for (const line of lines) {
    const [, indent, text] = line.match(LIST_ITEM)!;
    const parent = items[items.length - 1];
    if (indent.length > 0 && parent) parent.children.push(text);
    else items.push({ text, children: [] });
  }
  return items;
};

const HEADING_CLASSES: Record<number, string> = {
  1: "text-base uppercase tracking-wide text-branding-brown",
  2: `${merriweather.className} text-[32px] text-branding-black mt-2`,
  3: `${merriweather.className} text-2xl text-branding-brown mt-10`,
};

export const renderStoryBlocks = (
  markdown: string,
  renderFootnote: RenderFootnote,
  { variant = "body", bulletLists = false }: RenderOptions = {}
): ReactNode[] => {
  const textSize = variant === "body" ? "text-xl" : "text-sm";
  const nodes: ReactNode[] = [];

  markdown
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").filter((line) => line.trim() !== ""))
    .filter((lines) => lines.length > 0)
    .forEach((lines, blockIndex) => {
      const heading = lines.length === 1 && lines[0].match(HEADING);
      if (heading) {
        const level = heading[1].length;
        const Tag = `h${level}` as "h1" | "h2" | "h3";
        nodes.push(
          <Tag key={blockIndex} className={HEADING_CLASSES[level]}>
            {renderInline(heading[2], renderFootnote)}
          </Tag>
        );
        return;
      }

      splitRuns(lines, bulletLists).forEach((run, runIndex) => {
        const key = `${blockIndex}-${runIndex}`;
        if (run.kind === "list") {
          nodes.push(
            <ul
              key={key}
              className={cn(
                "list-disc pl-6 space-y-2 font-['Helvetica Neue'] font-light leading-relaxed",
                textSize
              )}
            >
              {toListItems(run.lines).map((item, itemIndex) => (
                <li key={itemIndex}>
                  {renderInline(item.text, renderFootnote)}
                  {item.children.length > 0 && (
                    <ul className="list-[circle] pl-6 mt-1 space-y-1">
                      {item.children.map((child, childIndex) => (
                        <li key={childIndex}>
                          {renderInline(child, renderFootnote)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          );
        } else if (run.kind === "verse") {
          nodes.push(
            <div
              key={key}
              className={cn(
                "bg-branding-gray rounded-lg font-['Helvetica Neue'] font-light",
                variant === "body" ? "p-4" : "p-2",
                textSize
              )}
            >
              {run.lines.map((line, lineIndex) => (
                <div key={lineIndex}>
                  {renderInline(line.replace(VERSE_LINE, ""), renderFootnote)}
                </div>
              ))}
            </div>
          );
        } else {
          nodes.push(
            <p
              key={key}
              className={cn(
                "font-['Helvetica Neue'] font-light leading-relaxed",
                textSize
              )}
            >
              {renderInline(run.lines.join(" "), renderFootnote)}
            </p>
          );
        }
      });
    });

  return nodes;
};
