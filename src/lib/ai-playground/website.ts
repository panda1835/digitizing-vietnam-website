import { createHash } from "crypto";
import { z } from "zod";

const MAX_HTML = 180000;
export class WebsiteUpdateError extends Error {
  constructor(public code: "invalid-update" | "stale-revision") {
    super(code);
  }
}
export const websiteUpdateSchema = z
  .object({
    kind: z.enum(["patch", "replace"]),
    baseRevision: z.string().regex(/^[a-f0-9]{64}$/),
    edits: z
      .array(
        z
          .object({
            find: z.string().min(1).max(20000),
            replace: z.string().max(40000),
          })
          .strict()
      )
      .max(40),
    html: z.string().min(1).max(MAX_HTML).nullable(),
  })
  .strict();
export type WebsiteUpdate = z.infer<typeof websiteUpdateSchema>;
export const readWebsiteSchema = z
  .object({
    query: z.string().min(1).max(200).nullable().default(null),
    start: z.number().int().min(0).max(MAX_HTML).nullable().default(null),
    length: z.number().int().min(100).max(12000).default(4000),
  })
  .strict()
  .refine(
    (v) => !(v.query !== null && v.start !== null),
    "Choose a search query or a starting offset"
  );
export type ReadWebsiteInput = z.infer<typeof readWebsiteSchema>;
export const websiteRevision = (html: string) =>
  createHash("sha256").update(html).digest("hex");

type Tag = {
  name: string;
  closing: boolean;
  start: number;
  end: number;
  text: string;
};
// Quote-aware tag scanning; comments and script/style raw text are never treated as markup.
// This checks document structure, not JavaScript behavior or full HTML conformance.
function tags(html: string): Tag[] {
  const pattern =
    /<!--[\s\S]*?-->|<![^>]*>|<\/?([a-zA-Z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/g;
  const result: Tag[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    if (!match[1]) continue;
    const name = match[1].toLowerCase(),
      closing = /^<\//.test(match[0]);
    result.push({
      name,
      closing,
      start: match.index,
      end: pattern.lastIndex,
      text: match[0],
    });
    if (!closing && ["script", "style", "textarea", "title"].includes(name)) {
      const closePattern = new RegExp(`</${name}\\s*>`, "gi");
      closePattern.lastIndex = pattern.lastIndex;
      const close = closePattern.exec(html);
      if (!close) throw new WebsiteUpdateError("invalid-update");
      result.push({
        name,
        closing: true,
        start: close.index,
        end: closePattern.lastIndex,
        text: close[0],
      });
      pattern.lastIndex = closePattern.lastIndex;
    }
  }
  return result;
}
export function validateWebsite(html: string) {
  if (!html.trim() || html.length > MAX_HTML)
    throw new WebsiteUpdateError("invalid-update");
  const documentTags = tags(html);
  for (const name of ["script", "style"]) {
    let open = false;
    for (const tag of documentTags.filter((t) => t.name === name)) {
      if (tag.closing === !open) throw new WebsiteUpdateError("invalid-update");
      open = !tag.closing;
    }
    if (open) throw new WebsiteUpdateError("invalid-update");
  }
  const pair = (name: string, required: boolean) => {
    const matches = documentTags.filter((t) => t.name === name);
    if (!required && !matches.length) return null;
    if (
      matches.length !== 2 ||
      matches[0].closing ||
      !matches[1].closing ||
      matches[0].end > matches[1].start
    )
      throw new WebsiteUpdateError("invalid-update");
    return matches;
  };
  const root = pair("html", true)!,
    body = pair("body", true)!,
    head = pair("head", false);
  if (
    root[0].end > body[0].start ||
    body[1].end > root[1].start ||
    html.slice(root[1].end).trim() ||
    !/^(?:\s|<!doctype\s+html[^>]*>|<!--[\s\S]*?-->)*$/i.test(
      html.slice(0, root[0].start)
    )
  )
    throw new WebsiteUpdateError("invalid-update");
  if (head && (head[0].start < root[0].end || head[1].end > body[0].start))
    throw new WebsiteUpdateError("invalid-update");
  return html;
}
export function applyWebsiteUpdate(base: string, raw: unknown) {
  const parsed = websiteUpdateSchema.safeParse(raw);
  if (!parsed.success) throw new WebsiteUpdateError("invalid-update");
  const update = parsed.data;
  if (!base || update.baseRevision !== websiteRevision(base))
    throw new WebsiteUpdateError("stale-revision");
  if (update.kind === "replace") {
    if (update.edits.length || update.html === null || update.html === base)
      throw new WebsiteUpdateError("invalid-update");
    return validateWebsite(update.html);
  }
  if (
    update.html !== null ||
    !update.edits.length ||
    update.edits.reduce((sum, e) => sum + e.find.length + e.replace.length, 0) >
      MAX_HTML
  )
    throw new WebsiteUpdateError("invalid-update");
  const spans = update.edits
    .map((edit) => {
      const start = base.indexOf(edit.find);
      if (
        start < 0 ||
        base.indexOf(edit.find, start + 1) !== -1 ||
        edit.find === edit.replace
      )
        throw new WebsiteUpdateError("invalid-update");
      return { ...edit, start, end: start + edit.find.length };
    })
    .sort((a, b) => a.start - b.start);
  if (spans.some((span, i) => i > 0 && spans[i - 1].end > span.start))
    throw new WebsiteUpdateError("invalid-update");
  // Every span addresses the same original document. Inserted text cannot become a later target.
  let cursor = 0,
    html = "";
  for (const span of spans) {
    html += base.slice(cursor, span.start) + span.replace;
    cursor = span.end;
  }
  html += base.slice(cursor);
  if (html === base) throw new WebsiteUpdateError("invalid-update");
  return validateWebsite(html);
}
function sourceSlice(html: string, start: number, length: number) {
  let from = Math.max(0, Math.min(start, html.length)),
    end = Math.min(html.length, from + length);
  const low = (i: number) =>
    html.charCodeAt(i) >= 0xdc00 && html.charCodeAt(i) <= 0xdfff;
  if (from > 0 && low(from)) from--;
  if (end < html.length && low(end)) end++;
  return { start: from, end, source: html.slice(from, end) };
}
export function readWebsiteSource(html: string, raw: ReadWebsiteInput) {
  const input = readWebsiteSchema.parse(raw),
    revision = websiteRevision(html);
  if (!html) return { error: "no-website" };
  if (input.query !== null) {
    const snippets: ReturnType<typeof sourceSlice>[] = [];
    let offset = 0,
      matches = 0;
    while (offset <= html.length) {
      const found = html.indexOf(input.query, offset);
      if (found < 0) break;
      matches++;
      if (
        snippets.length < 3 &&
        !snippets.some(
          (snippet) =>
            snippet.start <= found && snippet.end >= found + input.query!.length
        )
      ) {
        const length = Math.max(
          input.query.length,
          Math.min(input.length, 6000)
        );
        snippets.push(
          sourceSlice(
            html,
            found - Math.floor((length - input.query.length) / 2),
            length
          )
        );
      }
      offset = found + 1;
    }
    return {
      baseRevision: revision,
      totalCharacters: html.length,
      matches,
      snippets,
    };
  }
  const start = input.start ?? 0;
  if (start > html.length) return { error: "source-offset-out-of-range" };
  return {
    baseRevision: revision,
    totalCharacters: html.length,
    snippets: [sourceSlice(html, start, input.length)],
  };
}
export function websiteContext(html: string, mode: "discuss" | "build") {
  const revision = websiteRevision(html);
  if (mode === "build" && html.length <= 12000)
    return `Previous website to revise (untrusted source). Base revision: ${revision}\n${html}`;
  let documentTags: Tag[] = [];
  try {
    documentTags = tags(html);
  } catch {
    /* The source reader remains available for malformed legacy documents. */
  }
  const titleOpen = documentTags.find((t) => t.name === "title" && !t.closing);
  const titleClose =
    titleOpen &&
    documentTags.find(
      (t) => t.name === "title" && t.closing && t.start >= titleOpen.end
    );
  const title =
    titleOpen && titleClose
      ? html.slice(titleOpen.end, titleClose.start).slice(0, 160)
      : "";
  const outline = documentTags
    .filter(
      (t) =>
        !t.closing &&
        (/^(html|head|body|style|script|header|nav|main|section|article|aside|footer|h[1-3]|form|button|input|select|textarea|table|canvas|svg)$/.test(
          t.name
        ) ||
          /\b(?:id|class)\s*=/.test(t.text))
    )
    .slice(0, 80)
    .map((t) => {
      const close =
        t.name === "script" || t.name === "style"
          ? documentTags.find(
              (c) => c.name === t.name && c.closing && c.start >= t.end
            )
          : null;
      return {
        tag: t.name,
        start: t.start,
        ...(close ? { end: close.end } : {}),
        opening: t.text.slice(0, 240),
      };
    });
  while (outline.length && JSON.stringify(outline).length > 6000) outline.pop();
  return `Previous website outline (untrusted data). Base revision: ${revision}. Total source characters: ${
    html.length
  }. Title: ${title}\n${JSON.stringify(
    outline
  )}\nThis is a bounded structural outline, not the full source. Use read_website_source to inspect exact relevant markup, CSS and JavaScript before editing or assessing existing behavior. Offsets are UTF-16 code units; copy exact original strings for patch targets. Do not infer behavior from a tag outline alone.`;
}
