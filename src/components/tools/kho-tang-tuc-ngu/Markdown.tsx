import { ComponentType, createElement, Fragment, ReactNode } from "react";

// A small Markdown renderer covering what intro.md uses: ATX headings,
// paragraphs, block quotes, bullet and ordered lists, GFM tables, and
// bold/italic emphasis. It follows CommonMark for those constructs so the
// output matches what a full Markdown library would produce for this file.

type Tag =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "ul"
  | "ol"
  | "li"
  | "blockquote"
  | "table"
  | "thead"
  | "tbody"
  | "tr"
  | "th"
  | "td"
  | "strong"
  | "em";

export interface MarkdownProps {
  children?: ReactNode;
  /** 1-based line in the source where the element starts. */
  line: number;
  /** An ordered list's first number. */
  start?: number;
}

export type Components = Partial<Record<Tag, ComponentType<MarkdownProps>>>;

interface Line {
  text: string;
  line: number;
}

type Block =
  | { kind: "heading"; depth: number; text: string; line: number }
  | { kind: "paragraph"; text: string; line: number }
  | { kind: "blockquote"; children: Block[]; line: number }
  | {
      kind: "list";
      ordered: boolean;
      start: number;
      loose: boolean;
      items: Block[][];
      line: number;
    }
  | {
      kind: "table";
      head: string[];
      rows: { cells: string[]; line: number }[];
      line: number;
    };

const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
const QUOTE = /^ {0,3}> ?/;
const LIST_ITEM = /^( {0,3})([-+*]|\d{1,9}[.)])( {1,4}(?=\S)|[ \t]*$)/;
const TABLE_DELIMITER = /^ {0,3}\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

const isBlank = (text: string) => text.trim() === "";

function splitRow(text: string): string[] {
  return text
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableStart(lines: Line[], i: number): boolean {
  const next = lines[i + 1];
  return (
    lines[i].text.includes("|") &&
    next !== undefined &&
    TABLE_DELIMITER.test(next.text) &&
    splitRow(lines[i].text).length === splitRow(next.text).length
  );
}

/** Whether a line can end a paragraph by starting a block of its own. */
function interruptsParagraph(text: string): boolean {
  if (HEADING.test(text) || QUOTE.test(text)) return true;
  const item = text.match(LIST_ITEM);
  if (!item || isBlank(text.slice(item[0].length))) return false;
  return /^[-+*]$/.test(item[2]) || /^1[.)]$/.test(item[2]);
}

function parseBlocks(lines: Line[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const { text, line } = lines[i];
    if (isBlank(text)) {
      i++;
      continue;
    }

    const heading = text.match(HEADING);
    if (heading) {
      blocks.push({
        kind: "heading",
        depth: heading[1].length,
        text: heading[2] ?? "",
        line,
      });
      i++;
      continue;
    }

    if (QUOTE.test(text)) {
      const inner: Line[] = [];
      while (i < lines.length) {
        const current = lines[i];
        if (QUOTE.test(current.text)) {
          inner.push({
            text: current.text.replace(QUOTE, ""),
            line: current.line,
          });
        } else if (
          // A lazy continuation line carries on the quote's last paragraph.
          !isBlank(current.text) &&
          inner.length > 0 &&
          !isBlank(inner[inner.length - 1].text) &&
          !interruptsParagraph(current.text)
        ) {
          inner.push(current);
        } else {
          break;
        }
        i++;
      }
      blocks.push({ kind: "blockquote", children: parseBlocks(inner), line });
      continue;
    }

    const firstItem = text.match(LIST_ITEM);
    if (firstItem) {
      const marker = firstItem[2];
      const ordered = /\d/.test(marker);
      const sameList = (m: string) =>
        ordered
          ? /\d/.test(m) && m.slice(-1) === marker.slice(-1)
          : m === marker;
      const items: Line[][] = [];
      let loose = false;
      while (i < lines.length) {
        const item = lines[i].text.match(LIST_ITEM);
        if (!item || !sameList(item[2])) break;
        const spaces = item[3].length;
        const indent =
          item[1].length +
          item[2].length +
          (spaces === 0 || spaces > 4 ? 1 : spaces);
        const content: Line[] = [
          { text: lines[i].text.slice(item[0].length), line: lines[i].line },
        ];
        i++;
        while (i < lines.length) {
          const current = lines[i];
          const previous = content[content.length - 1];
          const next = current.text.match(LIST_ITEM);
          if (isBlank(current.text)) {
            content.push({ text: "", line: current.line });
          } else if (
            current.text.slice(0, indent).trim() === "" &&
            /^\s/.test(current.text)
          ) {
            content.push({
              text: current.text.slice(indent),
              line: current.line,
            });
          } else if (
            !isBlank(previous.text) &&
            !interruptsParagraph(current.text) &&
            !(next && sameList(next[2]))
          ) {
            content.push(current);
          } else {
            break;
          }
          i++;
        }
        let trailingBlank = false;
        while (
          content.length > 0 &&
          isBlank(content[content.length - 1].text)
        ) {
          content.pop();
          trailingBlank = true;
        }
        // An item is loose when a blank line separates it from the next
        // item, or separates two of its own blocks.
        const nextIsItem = i < lines.length && lines[i].text.match(LIST_ITEM);
        if (trailingBlank && nextIsItem && sameList(nextIsItem[2]))
          loose = true;
        if (content.some((l) => isBlank(l.text))) loose = true;
        items.push(content);
      }
      blocks.push({
        kind: "list",
        ordered,
        start: ordered ? parseInt(marker, 10) : 1,
        loose,
        items: items.map(parseBlocks),
        line,
      });
      continue;
    }

    if (isTableStart(lines, i)) {
      const head = splitRow(text);
      const rows: { cells: string[]; line: number }[] = [];
      i += 2;
      while (
        i < lines.length &&
        !isBlank(lines[i].text) &&
        !interruptsParagraph(lines[i].text)
      ) {
        const cells = splitRow(lines[i].text);
        rows.push({
          cells: head.map((_, c) => cells[c] ?? ""),
          line: lines[i].line,
        });
        i++;
      }
      blocks.push({ kind: "table", head, rows, line });
      continue;
    }

    const paragraph = [text.trim()];
    i++;
    while (
      i < lines.length &&
      !isBlank(lines[i].text) &&
      !interruptsParagraph(lines[i].text)
    ) {
      paragraph.push(lines[i].text.trim());
      i++;
    }
    blocks.push({ kind: "paragraph", text: paragraph.join("\n"), line });
  }
  return blocks;
}

// Emphasis runs, longest delimiter first; a run may not open before or close
// after whitespace.
const EMPHASIS =
  /\*\*\*(?=\S)([\s\S]+?)(?<=\S)\*\*\*(?!\*)|\*\*(?=\S)([\s\S]+?)(?<=\S)\*\*(?!\*)|\*(?=[^\s*])([\s\S]+?)(?<=[^\s*])\*(?!\*)/;

export function Markdown({
  children,
  components = {},
}: {
  children: string;
  components?: Components;
}) {
  let key = 0;

  const element = (
    tag: Tag,
    line: number,
    content: ReactNode,
    extra: { start?: number } = {}
  ) => {
    const Component = components[tag];
    return Component
      ? createElement(Component, { key: key++, ...extra, line }, content)
      : createElement(
          tag,
          {
            key: key++,
            ...(extra.start && extra.start !== 1 ? { start: extra.start } : {}),
          },
          content
        );
  };

  const inline = (text: string, line: number): ReactNode[] => {
    const nodes: ReactNode[] = [];
    let rest = text;
    let match: RegExpMatchArray | null;
    while ((match = rest.match(EMPHASIS))) {
      if (match.index) nodes.push(rest.slice(0, match.index));
      if (match[1] !== undefined) {
        nodes.push(
          element("em", line, element("strong", line, inline(match[1], line)))
        );
      } else if (match[2] !== undefined) {
        nodes.push(element("strong", line, inline(match[2], line)));
      } else {
        nodes.push(element("em", line, inline(match[3], line)));
      }
      rest = rest.slice((match.index ?? 0) + match[0].length);
    }
    if (rest) nodes.push(rest);
    return nodes;
  };

  const render = (blocks: Block[], tight = false): ReactNode[] =>
    blocks.map((block) => {
      switch (block.kind) {
        case "heading":
          return element(
            `h${block.depth}` as Tag,
            block.line,
            inline(block.text, block.line)
          );
        case "paragraph":
          return tight ? (
            <Fragment key={key++}>{inline(block.text, block.line)}</Fragment>
          ) : (
            element("p", block.line, inline(block.text, block.line))
          );
        case "blockquote":
          return element("blockquote", block.line, render(block.children));
        case "list":
          return element(
            block.ordered ? "ol" : "ul",
            block.line,
            block.items.map((item) =>
              element(
                "li",
                item[0]?.line ?? block.line,
                render(item, !block.loose)
              )
            ),
            { start: block.start }
          );
        case "table":
          return element("table", block.line, [
            element(
              "thead",
              block.line,
              element(
                "tr",
                block.line,
                block.head.map((cell) =>
                  element("th", block.line, inline(cell, block.line))
                )
              )
            ),
            block.rows.length > 0 &&
              element(
                "tbody",
                block.line,
                block.rows.map((row) =>
                  element(
                    "tr",
                    row.line,
                    row.cells.map((cell) =>
                      element("td", row.line, inline(cell, row.line))
                    )
                  )
                )
              ),
          ]);
      }
    });

  const lines = children.split("\n").map((text, i) => ({ text, line: i + 1 }));
  return <>{render(parseBlocks(lines))}</>;
}
