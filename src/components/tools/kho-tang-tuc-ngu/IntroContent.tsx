import fs from "fs";
import path from "path";
import { ArrowRight, ChevronDown } from "lucide-react";
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
const BACK_MATTER_FILE = path.join(
  process.cwd(),
  "public/data/kho-tang-tuc-ngu/back-matter.md"
);

// Render book information separately; replace printed contents with section links.
const TITLE_PAGE = "Trang tên sách";
const BOOK_CONTENTS = "Mục lục";
// The empty heading where the book's Proverb Entries begin.
const PROVERBS_START = "Hệ thống tục ngữ người Việt";
// Shown in place of the Back Matter's printed # heading.
const BACK_MATTER_TITLE = "THƯ MỤC VỀ TỤC NGỮ";
// The Back Matter heading over the Topic Index's title page.
const TOPIC_INDEX_START = "Hệ thống tra cứu theo chủ đề";
// Not in the book: a heading set beside the Topic Index's, so the two ways
// into the list close the Front Matter, ahead of the Back Matter.
const ALPHABET_INDEX_START = "Hệ thống tra cứu theo bảng chữ cái";
// The Back Matter section shown on the page but left out of the contents: the
// Topic Index's preface.
const UNLISTED_SECTIONS = ["Lời dẫn"];
// The notes on the compilers are listed, but not each compiler's name.
const COMPILERS_SECTION = "Vài nét về các soạn giả";
// The Front Matter section whose subsections fold away in the contents.
const COLLAPSED_SECTION = "Phàm lệ biên soạn";
// The abbreviation tables' bare numerals (I, II) stay out of the contents.
const ROMAN_NUMERAL = /^[IVX]+$/;
// The transcriber's notes in back-matter.md, each on one line.
const COMMENT = /<!--.*?-->/g;

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

  // The two lookup headings, then the Back Matter under its own # heading,
  // so a reader can tell where the book ends.
  body.push(
    "",
    `## ${ALPHABET_INDEX_START}`,
    "",
    `## ${TOPIC_INDEX_START}`,
    ""
  );
  for (const line of fs.readFileSync(BACK_MATTER_FILE, "utf8").split("\n")) {
    if (line.startsWith("# ")) {
      body.push(`# ${BACK_MATTER_TITLE}`);
      continue;
    }
    if (line.startsWith("## ") && plain(line.slice(3)) === TOPIC_INDEX_START) {
      continue;
    }
    body.push(line.replace(COMMENT, "").trimEnd());
  }

  const headings = new Map<number, Heading>();
  const used = new Set<string>();
  let noteGroup = "";
  body.forEach((line, i) => {
    const match = line.match(/^(#{1,6}) (.*)$/);
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
  enterAlphabetLabel,
  enterTopicsLabel,
  tocLabel,
  progressLabel,
}: {
  enterLabel: string;
  enterAlphabetLabel: string;
  enterTopicsLabel: string;
  tocLabel: string;
  progressLabel: string;
}) {
  const intro = readIntro();
  // Second-level headings, each with the third-level headings under it.
  const toc: { heading: Heading; children: Heading[] }[] = [];
  let unlisted = false;
  let compilers = false;
  for (const h of Array.from(intro.headings.values())) {
    if (h.depth === 2) {
      unlisted = UNLISTED_SECTIONS.some((s) => h.text.startsWith(s));
      compilers = h.text.startsWith(COMPILERS_SECTION);
      if (!unlisted) toc.push({ heading: h, children: [] });
    } else if (
      h.depth === 3 &&
      !unlisted &&
      !compilers &&
      !ROMAN_NUMERAL.test(h.text)
    ) {
      toc[toc.length - 1]?.children.push(h);
    }
  }

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
          {h?.depth === 2 && h.text === ALPHABET_INDEX_START && (
            <EnterButton label={enterAlphabetLabel} />
          )}
          {h?.depth === 2 && h.text === TOPIC_INDEX_START && (
            <EnterButton label={enterTopicsLabel} />
          )}
        </>
      );
    };

  const components: Components = {
    // Only the Back Matter has one: a rule marks where the end of the book
    // begins.
    h1: function BackMatterHeading({ line, children }: MarkdownProps) {
      const h = intro.headings.get(line);
      return (
        <h1
          id={h?.id}
          className={`${merriweather.className} scroll-mt-28 mt-12 border-t-2 border-branding-brown/30 pt-10 text-center text-2xl sm:text-3xl text-branding-black leading-relaxed mb-4`}
        >
          {children}
        </h1>
      );
    },
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
        <div className="lg:hidden">
          <EnterButton label={enterLabel} />
        </div>
        <p className="text-sm leading-relaxed text-branding-black/65">
          {progressLabel}
        </p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
        {/* On desktop the enter button rides along with the sticky TOC. */}
        <div className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:flex lg:flex-col lg:gap-4">
          <div className="hidden lg:block flex-shrink-0">
            <EnterButton label={enterLabel} />
          </div>
          <nav
            aria-label={tocLabel}
            className="w-full lg:min-h-0 lg:overflow-y-auto"
          >
            <div className="bg-white/70 rounded-xl border border-branding-black/10 p-5">
              <h2
                className={`${merriweather.className} text-base text-branding-black`}
              >
                {tocLabel}
              </h2>
              <ul className="mt-4 space-y-1 text-sm">
                {toc.map(({ heading: h, children }) => (
                  <li
                    key={h.id}
                    className={
                      h.text === ALPHABET_INDEX_START
                        ? "mt-3 border-t border-branding-black/10 pt-3"
                        : ""
                    }
                  >
                    {h.text === COLLAPSED_SECTION && children.length > 0 ? (
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md px-2 py-2 text-branding-black/75 hover:bg-branding-brown/5 hover:text-[#956319] leading-relaxed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-branding-brown [&::-webkit-details-marker]:hidden">
                          {h.text}
                          <ChevronDown
                            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                            aria-hidden
                          />
                        </summary>
                        <ul className="space-y-1">
                          {children.map((c) => (
                            <li key={c.id} className="pl-3">
                              <TocLink heading={c} />
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : (
                      <>
                        <TocLink heading={h} />
                        {children.length > 0 && (
                          <ul className="space-y-1">
                            {children.map((c) => (
                              <li key={c.id} className="pl-3">
                                <TocLink heading={c} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

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
          </div>
        </article>
      </div>
    </div>
  );
}

function TocLink({ heading }: { heading: Heading }) {
  return (
    <a
      href={`#${heading.id}`}
      className="rounded-md px-2 py-2 text-branding-black/75 hover:bg-branding-brown/5 hover:text-[#956319] leading-relaxed block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-branding-brown"
    >
      {heading.text}
    </a>
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
