import fs from "fs";
import path from "path";
import { ArrowRight } from "lucide-react";
import { Merriweather } from "next/font/google";
import { Link } from "@/i18n/routing";
import { LIST_PATH, foldDiacritics, sourceNoteId } from "./data";
import { Components, Markdown, MarkdownProps } from "./Markdown";

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});

const INTRO_FILE = path.join(
  process.cwd(),
  "public/data/kho-tang-tuc-ngu/intro.md"
);

// Render book information separately; replace printed contents with section links.
const TITLE_PAGE = "Trang tên sách";
const BOOK_CONTENTS = "Mục lục";
// The empty heading where the book's Proverb Entries begin.
const PROVERBS_START = "Hệ thống tục ngữ người Việt";

// The Phàm lệ numbers its Source Notes within two groups; sources.json names
// each note by group and number (hn-1, qn-6).
const NOTE_GROUPS: Record<string, string> = {
  "Sách Hán nôm": "hn",
  "Sách quốc ngữ": "qn",
};

interface Heading {
  depth: number;
  text: string;
  id: string;
}

interface Intro {
  titlePage: { text: string; title: boolean }[];
  body: string;
  /** Headings of `body`, keyed by their 1-based line in it. */
  headings: Map<number, Heading>;
}

const plain = (text: string) => text.replace(/[*_`]/g, "").trim();

function slug(text: string): string {
  return foldDiacritics(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function readIntro(): Intro {
  const lines = fs.readFileSync(INTRO_FILE, "utf8").split("\n");
  const titlePage: Intro["titlePage"] = [];
  const body: string[] = [];
  let section = "";
  for (const line of lines) {
    if (line.startsWith("# ")) continue;
    if (line.startsWith("## ")) section = plain(line.slice(3));
    if (section === TITLE_PAGE) {
      if (!line.startsWith("## ") && line.trim()) {
        titlePage.push({ text: plain(line), title: line.startsWith("**") });
      }
    } else if (section !== BOOK_CONTENTS) {
      body.push(line);
    }
  }

  const headings = new Map<number, Heading>();
  const used = new Set<string>();
  let noteGroup = "";
  body.forEach((line, i) => {
    const match = line.match(/^(#{2,6}) (.*)$/);
    if (!match) return;
    const depth = match[1].length;
    const text = plain(match[2]);
    if (depth <= 5) noteGroup = NOTE_GROUPS[text] ?? "";
    const noteNumber = text.match(/^(\d+)\./)?.[1];
    let id =
      depth === 6 && noteGroup && noteNumber
        ? sourceNoteId(`${noteGroup}-${noteNumber}`)
        : slug(text);
    while (used.has(id)) id = `${id}-`;
    used.add(id);
    headings.set(i + 1, { depth, text, id });
  });

  return { titlePage, body: body.join("\n"), headings };
}

export function IntroContent({
  enterLabel,
  tocLabel,
  progressLabel,
}: {
  enterLabel: string;
  tocLabel: string;
  progressLabel: string;
}) {
  const intro = readIntro();
  const toc = Array.from(intro.headings.values()).filter((h) => h.depth <= 3);

  const heading = (depth: number, className: string) =>
    function IntroHeading({ line, children }: MarkdownProps) {
      const h = intro.headings.get(line);
      const Tag = `h${depth}` as "h2";
      return (
        <>
          <Tag id={h?.id} className={`scroll-mt-28 ${className}`}>
            {children}
          </Tag>
          {h?.depth === 2 && h.text.startsWith(PROVERBS_START) && (
            <EnterButton label={enterLabel} />
          )}
        </>
      );
    };

  const components: Components = {
    h2: heading(
      2,
      `${merriweather.className} text-2xl text-branding-black leading-relaxed mt-10 mb-4`
    ),
    h3: heading(
      3,
      `${merriweather.className} text-xl text-branding-black leading-relaxed mt-8 mb-3`
    ),
    h4: heading(
      4,
      "text-lg font-medium text-branding-black leading-relaxed mt-7 mb-3"
    ),
    h5: heading(
      5,
      "text-base font-medium text-branding-black leading-relaxed mt-7 mb-3"
    ),
    h6: heading(
      6,
      "text-base font-medium text-branding-black leading-relaxed mt-6 mb-2"
    ),
    p: ({ children }) => (
      <p className="mb-4 leading-[1.8] text-base text-branding-black/75 break-words">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-5 mb-5 space-y-2 text-branding-black/75 leading-relaxed">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-5 mb-5 space-y-2 text-branding-black/75 leading-relaxed">
        {children}
      </ol>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l border-branding-black/20 pl-4 text-branding-black/75 mb-5">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-6 rounded-lg border border-branding-black/10">
        <table className="w-full text-sm leading-relaxed text-branding-black/75">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="text-left font-medium text-branding-black bg-branding-brown/5 px-3 py-3">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2.5 border-t border-branding-black/10 align-top">
        {children}
      </td>
    ),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <EnterButton label={enterLabel} />
        <p className="text-sm leading-relaxed text-branding-black/65">
          {progressLabel}
        </p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
        <nav
          aria-label={tocLabel}
          className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
        >
          <div className="bg-white/70 rounded-xl border border-branding-black/10 p-5">
            <h2
              className={`${merriweather.className} text-base text-branding-black`}
            >
              {tocLabel}
            </h2>
            <ul className="mt-4 space-y-1 text-sm">
              {toc.map((h) => (
                <li key={h.id} className={h.depth === 3 ? "pl-3" : ""}>
                  <a
                    href={`#${h.id}`}
                    className="rounded-md px-2 py-2 text-branding-black/75 hover:bg-branding-brown/5 hover:text-[#956319] leading-relaxed block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-branding-brown"
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <article className="w-full flex-1 min-w-0 bg-white/90 rounded-xl border border-branding-black/10 p-5 sm:p-8">
          <div className="max-w-prose mx-auto [&>h2:first-child]:mt-0">
            <header className="border-b border-branding-black/10 pb-6 text-center space-y-2">
              {intro.titlePage.map((line, i) => (
                <p
                  key={i}
                  className={
                    line.title
                      ? `${merriweather.className} text-xl leading-relaxed text-branding-black py-3`
                      : "text-sm leading-relaxed text-branding-black/65"
                  }
                >
                  {line.text}
                </p>
              ))}
            </header>
            <Markdown components={components}>{intro.body}</Markdown>
            <div className="mt-8 border-t border-branding-black/10 pt-6">
              <EnterButton label={enterLabel} />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

function EnterButton({ label }: { label: string }) {
  return (
    <Link
      href={LIST_PATH}
      className="inline-flex items-center gap-2 px-6 py-3 bg-[#956319] text-white text-sm font-bold rounded-lg hover:bg-[#805516] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-branding-brown"
    >
      {label}
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
    </Link>
  );
}
