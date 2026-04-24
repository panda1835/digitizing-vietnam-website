"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";

type ParsedPages = Record<string, string[]>;
type FileConfig = { nom?: string; qn?: string };
type CanvasStartConfig = { firstRectoCanvas: number };

const TRANSCRIPTION_FILES_BY_DOCUMENT_ID: Record<string, FileConfig> = {
  "borg-tonch-18": {
    nom: "/philipphe-binh/borg-tonch-18-nom.txt",
    qn: "/philipphe-binh/borg-tonch-18-qn.txt",
  },
  "borg-tonch-34": {
    nom: "/philipphe-binh/borg-tonch-34-nom.txt",
    qn: "/philipphe-binh/borg-tonch-34-qn.txt",
  },
};

const CANVAS_START_BY_DOCUMENT_ID: Record<string, CanvasStartConfig> = {
  "borg-tonch-18": { firstRectoCanvas: 2 },
  "borg-tonch-34": { firstRectoCanvas: 10 },
};

function parseTranscript(raw: string): ParsedPages {
  const normalized = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const pages: ParsedPages = {};
  let currentPage = "";

  for (const line of lines) {
    const pageMatch = line.trim().match(/^\[([^\]]+)\]$/);
    if (pageMatch) {
      currentPage = pageMatch[1].trim().toLowerCase();
      if (!pages[currentPage]) {
        pages[currentPage] = [];
      }
      continue;
    }

    if (!currentPage) {
      continue;
    }

    const content = line.trim();
    if (content) {
      pages[currentPage].push(content);
    }
  }

  return pages;
}

async function fetchTranscript(url?: string): Promise<ParsedPages> {
  if (!url) {
    return {};
  }

  try {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) {
      return {};
    }
    const rawText = await response.text();
    return parseTranscript(rawText);
  } catch {
    return {};
  }
}

function getSpreadPagesFromCanvasId(
  canvasId?: string,
  documentId?: string
): string[] {
  if (!canvasId) {
    return [];
  }

  const match = canvasId.match(/\/canvas\/p0*(\d+)/i);
  if (!match) {
    return [];
  }

  const canvasNumber = Number(match[1]);
  if (!Number.isFinite(canvasNumber) || canvasNumber <= 0) {
    return [];
  }

  const firstRectoCanvas =
    CANVAS_START_BY_DOCUMENT_ID[documentId || ""]?.firstRectoCanvas ?? 2;
  const normalizedCanvas = canvasNumber - (firstRectoCanvas - 2);
  if (!Number.isFinite(normalizedCanvas) || normalizedCanvas <= 0) {
    return [];
  }

  const recto = Math.ceil(normalizedCanvas / 2);
  const verso = recto - 1;

  if (verso <= 0) {
    return [`${recto}r`];
  }

  return [`${recto}r`, `${verso}v`];
}

export default function PhilippheBinhAnnotations({
  locale,
  documentId,
  initialCanvasId,
}: {
  locale: string;
  documentId: string;
  initialCanvasId?: string;
}) {
  const searchParams = useSearchParams();
  const liveCanvasId = searchParams.get("canvasId") || initialCanvasId || "";
  const [nomByPage, setNomByPage] = useState<ParsedPages>({});
  const [qnByPage, setQnByPage] = useState<ParsedPages>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fileConfig = TRANSCRIPTION_FILES_BY_DOCUMENT_ID[documentId];

    if (!fileConfig) {
      setNomByPage({});
      setQnByPage({});
      return () => {
        isMounted = false;
      };
    }

    setIsLoading(true);
    Promise.all([
      fetchTranscript(fileConfig.nom),
      fetchTranscript(fileConfig.qn),
    ]).then(([nom, qn]) => {
      if (!isMounted) {
        return;
      }
      setNomByPage(nom);
      setQnByPage(qn);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [documentId]);

  const spreadPages = useMemo(
    () => getSpreadPagesFromCanvasId(liveCanvasId, documentId),
    [liveCanvasId, documentId]
  );

  return (
    <section className="mt-10">
      <h2 className="text-2xl text-branding-black font-['Helvetica Neue']">
        {locale === "vi"
          ? "Bản gõ lại và chuyển tự"
          : "Transcription and Translation"}
      </h2>
      <div className="mt-2 text-sm italic font-light font-['Helvetica Neue'] text-[#191919]">
        {locale === "vi" ? (
          <>
            Nếu có ý kiến đóng góp về bản gõ lại và chuyển tự của thủ bản này,
            vui lòng gửi về cho tác giả tại{" "}
            <a
              href="mailto:wilfred.nguyen@centre.edu"
              className="text-blue-600 hover:underline"
            >
              wilfred.nguyen@centre.edu
            </a>{" "}
            hoặc liên hệ cho chúng tôi tại{" "}
            <a
              href="mailto:info@digitizingvietnam.com"
              className="text-blue-600 hover:underline"
            >
              info@digitizingvietnam.com
            </a>
          </>
        ) : (
          <>
            If you have any feedback for the translation and transcription of
            this manuscript, please send them to the author at{" "}
            <a
              href="mailto:wilfred.nguyen@centre.edu"
              className="text-blue-600 hover:underline"
            >
              wilfred.nguyen@centre.edu
            </a>{" "}
            or contact us at{" "}
            <a
              href="mailto:info@digitizingvietnam.com"
              className="text-blue-600 hover:underline"
            >
              info@digitizingvietnam.com
            </a>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4 text-base font-light font-['Helvetica Neue'] text-[#191919]">
          {locale === "vi" ? "Đang tải dữ liệu..." : "Loading transcription..."}
        </div>
      ) : spreadPages.length === 0 ? (
        <div className="mt-4 text-base font-light font-['Helvetica Neue'] text-[#191919]">
          {locale === "vi"
            ? "Chọn một trang trong Mirador để hiển thị phần bản gõ lại và chuyển tự."
            : "Select a canvas in Mirador to display the transcription and translation."}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
          {spreadPages.map((pageKey) => {
            const nomLines = nomByPage[pageKey] || [];
            const qnLines = qnByPage[pageKey] || [];
            const hasAnyContent = nomLines.length > 0 || qnLines.length > 0;

            return (
              <article
                key={pageKey}
                className="rounded-lg border border-gray-200 p-5 bg-white"
              >
                <h3 className="text-xl font-semibold text-branding-black">
                  {pageKey}
                </h3>

                {!hasAnyContent && (
                  <p className="mt-3 text-sm text-gray-600 font-['Helvetica Neue']">
                    {locale === "vi"
                      ? "Không có dữ liệu cho trang này."
                      : "No transcription data for this page."}
                  </p>
                )}

                {nomLines.length > 0 && (
                  <div className="mt-4">
                    <div className=" uppercase tracking-wide text-branding-brown font-semibold">
                      {locale === "vi" ? "Hán Nôm" : "Han Nom"}
                    </div>
                    <div className="mt-2 space-y-1 text-lg leading-relaxed">
                      {nomLines.map((line, index) => (
                        <LookupableHanNomText
                          key={`nom-${pageKey}-${index}`}
                          text={line}
                          className="mt-5 text-xl"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {qnLines.length > 0 && (
                  <div className="mt-6">
                    <div className=" uppercase tracking-wide text-branding-brown font-semibold">
                      {locale === "vi" ? "Quốc Ngữ" : "Vietnamese"}
                    </div>
                    <div className="mt-2 space-y-1 text-base leading-relaxed font-light font-['Helvetica Neue']">
                      {qnLines.map((line, index) => (
                        <p key={`qn-${pageKey}-${index}`}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
