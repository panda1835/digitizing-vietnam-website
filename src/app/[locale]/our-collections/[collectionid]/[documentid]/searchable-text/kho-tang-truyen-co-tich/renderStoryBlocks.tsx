// Renders the narrow markdown subset the extraction pipeline emits for this
// book (extractor/formatters.py in vsc-tri-thuc-ban-dia): #/##/### headings,
// plain-text paragraphs, "> " verse lines, the Bibliography's "- " bullet
// lists (one nested level, "  - "), "-> " right-aligned lines (the hand-written
// Preface's place/date and signature), and the `[k](#fn-i)` footnote links
// parseStoryMarkdown generates. Nothing else occurs in this corpus, so nothing
// else is handled — and no markdown dependency is needed.
//
// An optional Index Name is wrapped in yellow <mark>s wherever findNameMatches
// finds it in a text run, footnote markers included (see renderInline).
//
// Bullet lists are opt-in: Stories and Essays open dialogue lines with "- ",
// which must stay prose.

import type { ReactNode } from "react";
import { Merriweather } from "next/font/google";

import { cn } from "@/lib/utils";
import { findNameMatches } from "./findNameMatches";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const FOOTNOTE_LINK = /\[(\d+)\]\(#fn-(\d+)\)/g;
const HEADING = /^(#{1,3})\s+(.*)$/;
const VERSE_LINE = /^>\s?/;
const LIST_ITEM = /^( *)- (.*)$/;
const RIGHT_ALIGNED_LINE = /^->\s?/;

export type RenderFootnote = (displayNumber: number, index: number) => ReactNode;

type Variant = "body" | "footnote";

export interface RenderOptions {
  variant?: Variant;
  /** Render "- " lines as bullet lists (Bibliography Entries only). */
  bulletLists?: boolean;
  /** Index Name to highlight, in the Story text's spelling. */
  highlight?: string;
}

type RunKind = "verse" | "list" | "right" | "text";

export const HIGHLIGHT_CLASSES = "bg-yellow-200 text-inherit rounded-sm";

/**
 * A text run's footnote links become footnote nodes; the rest is plain text.
 * The highlight is matched on the whole run with each footnote link read as
 * one space (as the Story Name Index builder does), so a name with a marker
 * inside ("hoa lài[^1] cắm") still matches; its <mark> is split around the
 * footnote node, and that stand-in space is never rendered.
 */
const renderInline = (
  text: string,
  renderFootnote: RenderFootnote,
  highlight?: string
): ReactNode[] => {
  let plain = "";
  const footnotes: { at: number; node: ReactNode }[] = [];
  let last = 0;
  for (const match of Array.from(text.matchAll(FOOTNOTE_LINK))) {
    plain += text.slice(last, match.index);
    footnotes.push({
      at: plain.length,
      node: renderFootnote(Number(match[1]), Number(match[2])),
    });
    plain += " ";
    last = match.index! + match[0].length;
  }
  plain += text.slice(last);

  const marks = highlight ? findNameMatches(plain, highlight) : [];
  const nodes: ReactNode[] = [];
  let pos = 0;
  let markIndex = 0;
  /** Pushes plain[pos, end), wrapping the parts inside a match in <mark>. */
  const pushPlain = (end: number) => {
    while (pos < end) {
      while (markIndex < marks.length && marks[markIndex][1] <= pos) markIndex++;
      const mark = marks[markIndex];
      if (mark && mark[0] <= pos) {
        const stop = Math.min(end, mark[1]);
        nodes.push(
          <mark key={`mark-${pos}`} className={HIGHLIGHT_CLASSES}>
            {plain.slice(pos, stop)}
          </mark>
        );
        pos = stop;
      } else {
        const stop = Math.min(end, mark ? mark[0] : end);
        nodes.push(plain.slice(pos, stop));
        pos = stop;
      }
    }
  };
  for (const { at, node } of footnotes) {
    pushPlain(at);
    nodes.push(node);
    pos = at + 1;
  }
  pushPlain(plain.length);
  return nodes;
};

/** Splits a block into consecutive runs of verse, list and prose lines. */
const splitRuns = (lines: string[], bulletLists: boolean) => {
  const runs: { kind: RunKind; lines: string[] }[] = [];
  for (const line of lines) {
    const kind: RunKind = VERSE_LINE.test(line)
      ? "verse"
      : RIGHT_ALIGNED_LINE.test(line)
        ? "right"
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
  1: "text-base tracking-wide text-branding-brown",
  2: `${merriweather.className} text-[32px] text-branding-black mt-2`,
  3: `${merriweather.className} text-2xl text-branding-brown mt-10`,
};

export const renderStoryBlocks = (
  markdown: string,
  renderFootnote: RenderFootnote,
  { variant = "body", bulletLists = false, highlight }: RenderOptions = {}
): ReactNode[] => {
  const inline = (text: string) => renderInline(text, renderFootnote, highlight);
  const textSize = "text-base";
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
            {inline(heading[2])}
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
                  {inline(item.text)}
                  {item.children.length > 0 && (
                    <ul className="list-[circle] pl-6 mt-1 space-y-1">
                      {item.children.map((child, childIndex) => (
                        <li key={childIndex}>
                          {inline(child)}
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
                  {inline(line.replace(VERSE_LINE, ""))}
                </div>
              ))}
            </div>
          );
        } else if (run.kind === "right") {
          run.lines.forEach((line, lineIndex) => {
            nodes.push(
              <p
                key={`${key}-${lineIndex}`}
                className={cn(
                  "font-['Helvetica Neue'] font-light leading-relaxed text-right",
                  textSize
                )}
              >
                {inline(line.replace(RIGHT_ALIGNED_LINE, ""))}
              </p>
            );
          });
        } else {
          nodes.push(
            <p
              key={key}
              className={cn(
                "font-['Helvetica Neue'] font-light leading-relaxed",
                textSize
              )}
            >
              {inline(run.lines.join(" "))}
            </p>
          );
        }
      });
    });

  return nodes;
};
