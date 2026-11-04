"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CitationContributor {
  name: string;
  role: string;
}

interface CitationProps {
  locale: string;
  entryTitle: string;
  bookTitle: string;
  year: string;
  publisher: string;
  contributors: CitationContributor[];
  pages: string;
  url: string;
}

export default function Citation({
  locale,
  entryTitle,
  bookTitle,
  year,
  publisher,
  contributors,
  pages,
  url,
}: CitationProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const vi = locale === "vi";
  const editors = contributors.filter(({ role }) =>
    /editor|chủ biên/i.test(role)
  );
  const creditedContributors = editors.length > 0 ? editors : contributors;
  const contributorNamesPlain = creditedContributors
    .map(({ name }) => name)
    .join(", ");
  const contributorNames = creditedContributors
    .map(({ name, role }) => {
      const isEditor = /editor|chủ biên/i.test(role);
      return `${name}${isEditor ? (vi ? " (Chủ biên)" : " (Ed.)") : ""}`;
    })
    .join(", ");
  const date = year ? `(${year})` : "(n.d.)";
  const publication = publisher ? ` ${publisher}.` : "";
  const bookCitation = `${
    contributorNames ? `${contributorNames}. ` : ""
  }${date}. ${bookTitle}.${publication} Digitizing Việt Nam. ${url}`;
  const pageCitation = pages ? `${vi ? " (tr. " : " (pp. "}${pages})` : "";
  const entryCitation = `${entryTitle}. ${date}. ${vi ? "Trong" : "In"} ${
    contributorNames ? `${contributorNames}, ` : ""
  }${bookTitle}${pageCitation}.${publication} Digitizing Việt Nam. ${url}`;

  const copyCitation = async (type: "book" | "entry", value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <section className="mt-8 border-t border-branding-brown/20 pt-6">
      <h2 className="text-branding-black text-xl font-normal font-['Helvetica Neue']">
        {vi ? "Trích dẫn" : "Citation"}
      </h2>
      <div className="mt-4 space-y-4 text-branding-black text-base font-light font-['Helvetica Neue']">
        <div className="flex items-start justify-between gap-4">
          <p>
            <span className="font-normal">
              {vi ? "Cả cuốn sách: " : "Whole book: "}
            </span>
            {contributorNames ? `${contributorNames}. ` : ""}
            {date}. <em>{bookTitle}</em>.{publication} Digitizing Việt Nam.{" "}
            {url}
          </p>
          <button
            type="button"
            aria-label={vi ? "Sao chép trích dẫn sách" : "Copy book citation"}
            title={vi ? "Sao chép trích dẫn sách" : "Copy book citation"}
            onClick={() => copyCitation("book", bookCitation)}
            className="shrink-0 p-1 hover:text-branding-brown"
          >
            {copied === "book" ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>
        <div className="flex items-start justify-between gap-4">
          <p>
            <span className="font-normal">
              {vi ? "Theo mục từ: " : "Entry: "}
            </span>
            {entryTitle}. {date}. {vi ? "Trong" : "In"}{" "}
            {contributorNames ? `${contributorNames}, ` : ""}
            <em>{bookTitle}</em>
            {pageCitation}.{publication} Digitizing Việt Nam. {url}
          </p>
          <button
            type="button"
            aria-label={
              vi ? "Sao chép trích dẫn mục từ" : "Copy entry citation"
            }
            title={vi ? "Sao chép trích dẫn mục từ" : "Copy entry citation"}
            onClick={() => copyCitation("entry", entryCitation)}
            className="shrink-0 p-1 hover:text-branding-brown"
          >
            {copied === "entry" ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>
        <p className="text-sm text-[#777777]">
          {vi
            ? `Trích dẫn tại chỗ: (${contributorNamesPlain || bookTitle}, ${
                year || "n.d."
              }) hoặc (“${entryTitle}”, ${
                year || "n.d."
              }). Khi trích nguyên văn, hãy thêm số trang, ví dụ (${
                contributorNamesPlain || bookTitle
              }, ${year || "n.d."}, tr. xx).`
            : `In-text citation: (${contributorNamesPlain || bookTitle}, ${
                year || "n.d."
              }) or (\"${entryTitle}\", ${
                year || "n.d."
              }). Include a page number for direct quotations.`}
        </p>
      </div>
    </section>
  );
}
