"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
type ParsedPages = Record<string, string[]>;

function getSpreadPagesFromCanvasId(canvasId?: string): string[] {
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

  const recto = Math.ceil(canvasNumber / 2);
  const verso = recto - 1;

  if (verso <= 0) {
    return [`${recto}r`];
  }

  return [`${recto}r`, `${verso}v`];
}

export default function PhilippheBinhAnnotations({
  locale,
  initialCanvasId,
  nomByPage,
  qnByPage,
}: {
  locale: string;
  initialCanvasId?: string;
  nomByPage: ParsedPages;
  qnByPage: ParsedPages;
}) {
  const searchParams = useSearchParams();
  const liveCanvasId = searchParams.get("canvasId") || initialCanvasId || "";
  const spreadPages = useMemo(
    () => getSpreadPagesFromCanvasId(liveCanvasId),
    [liveCanvasId]
  );

  return (
    <section className="mt-10">
      <h2 className="text-2xl text-branding-black font-['Helvetica Neue']">
        {locale === "vi"
          ? "Bản gõ lại và chuyển tự"
          : "Transcription and Translation"}
      </h2>

      {spreadPages.length === 0 ? (
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
                      ? "Chưa có dữ liệu cho trang này."
                      : "No transcription data for this page yet."}
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
