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

const INTRO_FILE = path.join(process.cwd(), "public/data/kho-tang-tuc-ngu/intro.md");

// Sections of the Front Matter the page handles itself: the title page is
// drawn as a title block, and the book's Mục lục points at printed pages, so
// the page's own table of contents replaces it.
const TITLE_PAGE = "Trang tên sách";
const BOOK_CONTENTS = "Mục lục";
// The empty heading where the book's Proverb Entries begin.
const PROVERBS_START = "Hệ thống tục ngữ người Việt";

// The Phàm lệ numbers its Source Notes within two groups; sources.json names
// each note by group and number (hn-1, qn-6).
const NOTE_GROUPS: Record<string, string> = { "Sách Hán nôm": "hn", "Sách quốc ngữ": "qn" };

interface Heading {
  depth: number;
  text: string;
  id: string;
}

interface Intro {
  /** The title page's lines; `title` marks the book's name, bold in the source. */
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
      if (!line.startsWith("## ") && line.trim()) titlePage.push({ text: plain(line), title: line.startsWith("**") });
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
    let id = depth === 6 && noteGroup && noteNumber ? sourceNoteId(`${noteGroup}-${noteNumber}`) : slug(text);
    while (used.has(id)) id = `${id}-`;
    used.add(id);
    headings.set(i + 1, { depth, text, id });
  });

  return { titlePage, body: body.join("\n"), headings };
}

export function IntroContent({ enterLabel, tocLabel }: { enterLabel: string; tocLabel: string }) {
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
          {h?.depth === 2 && h.text.startsWith(PROVERBS_START) && <EnterButton label={enterLabel} />}
        </>
      );
    };

  const components: Components = {
    h2: heading(2, `${merriweather.className} text-2xl md:text-3xl font-bold text-branding-black mt-14 mb-5`),
    h3: heading(3, `${merriweather.className} text-xl md:text-2xl font-bold text-branding-brown mt-10 mb-4`),
    h4: heading(4, "text-lg font-bold text-branding-black mt-8 mb-3"),
    h5: heading(5, "text-base font-bold uppercase tracking-wider text-branding-brown mt-8 mb-3"),
    h6: heading(6, "text-base font-bold text-branding-black mt-6 mb-2"),
    p: ({ children }) => <p className="mb-4 leading-relaxed text-[15px] md:text-base text-branding-black/90">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1.5">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1.5">{children}</ol>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-branding-brown/30 pl-4 italic text-branding-black/80 mb-4">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-6 rounded-xl border border-branding-brown/15">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => <th className="text-left font-bold bg-branding-brown/10 px-3 py-2">{children}</th>,
    td: ({ children }) => <td className="px-3 py-1.5 border-t border-branding-brown/10 align-top">{children}</td>,
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 items-start">
      <nav className="w-full lg:w-[280px] flex-shrink-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <details open className="group bg-white rounded-2xl border border-branding-brown/15 p-5">
          <summary className="cursor-pointer text-sm font-bold uppercase tracking-wider text-branding-brown list-none">
            {tocLabel}
          </summary>
          <ul className="mt-4 space-y-2 text-sm border-l border-branding-brown/30">
            {toc.map((h) => (
              <li key={h.id} className={h.depth === 3 ? "pl-7" : "pl-4"}>
                <a href={`#${h.id}`} className="text-branding-black/80 hover:text-branding-brown leading-snug block">
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </details>
        <div className="mt-4">
          <EnterButton label={enterLabel} />
        </div>
      </nav>

      <article className="flex-1 min-w-0 bg-white rounded-3xl border border-branding-brown/10 shadow-sm p-6 md:p-10">
        <header className="text-center border-b border-branding-brown/15 pb-8 mb-2">
          {intro.titlePage.map((line, i) => (
            <p
              key={i}
              className={
                line.title
                  ? `${merriweather.className} text-2xl md:text-3xl font-bold text-branding-black my-4`
                  : "text-sm tracking-wider text-branding-black/70"
              }
            >
              {line.text}
            </p>
          ))}
        </header>
        <Markdown components={components}>
          {intro.body}
        </Markdown>
        <div className="mt-10 flex justify-center">
          <EnterButton label={enterLabel} />
        </div>
      </article>
    </div>
  );
}

function EnterButton({ label }: { label: string }) {
  return (
    <Link
      href={LIST_PATH}
      className="inline-flex items-center gap-2 px-6 py-3 bg-branding-black text-white text-sm font-bold rounded-lg hover:bg-branding-brown transition-colors"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
