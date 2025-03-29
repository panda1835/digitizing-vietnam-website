"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import type { TruyenKieuRaw, TruyenKieuText } from "./types";
import { useTranslations } from "next-intl";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import CollectionPermalink from "@/components/CollectionPermalink";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { Merriweather } from "next/font/google";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

import localFont from "next/font/local";
import { Separator } from "@/components/ui/separator";

const NomNaTong = localFont({
  src: "../../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function ImageTextNoteView({
  collectionTitle,
  title,
  abstract,
  dataApiUrl,
  locale,
  documentid,
  collectionid,
}) {
  // params: { locale: string; collectionid: string; documentid: string }
  // const { locale, collectionid } = params;
  const t = useTranslations();
  const [rawData, setRawData] = useState<TruyenKieuRaw>();
  const [textData, setTextData] = useState<TruyenKieuText>();
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${dataApiUrl}`);
        const result = await res.json();
        setTextData(result.text);
        setRawData(result.rawText);
        setTotalPages(result.text.length);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataApiUrl]);

  // Ensure page is within valid range
  const pageIndex = Math.min(Math.max(0, currentPage - 1), totalPages - 1);

  if (loading || !textData || !rawData) {
    return (
      <div className="flex flex-col max-width justify-center items-center">
        <div className="mt-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Generate pagination items
  const generatePaginationItems = () => {
    const items: JSX.Element[] = [];
    const maxVisiblePages = 5;

    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink href={`?page=1`} isActive={currentPage === 1}>
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Add ellipsis if needed
    if (currentPage > maxVisiblePages - 1) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Add pages around current page
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last page as they're always shown
      items.push(
        <PaginationItem key={i}>
          <PaginationLink href={`?page=${i}`} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Add ellipsis if needed
    if (currentPage < totalPages - (maxVisiblePages - 2)) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink
            href={`?page=${totalPages}`}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex-col mb-20 w-full">
        {/* Breadcrumbs */}

        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[
            {
              label: t("NavigationBar.our-collections"),
              href: "/our-collections",
            },
            {
              label: collectionTitle,
              href: "/our-collections/" + collectionid,
            },
            { label: title },
          ]}
        />

        {/* Headline */}
        <div
          className={`${merriweather.className} text-branding-black text-4xl`}
        >
          {title}
        </div>

        {/* Subheadline */}
        <div
          className={`font-light font-['Helvetica Neue'] leading-relaxed mt-8 max-w-4xl`}
        >
          {abstract}
        </div>

        {/* Share links */}
        <CollectionPermalink />

        <div className="mt-10">
          <Separator />
        </div>

        {/* Content */}
        <div className="flex flex-col mt-16">
          {/* Image and Text */}
          <div className="flex flex-col md:flex-row md:justify-center space-x-4">
            {/* Image */}
            <div>
              {textData[pageIndex] && textData[pageIndex].$ && (
                <Image
                  unoptimized
                  // src="/page01a.jpg"
                  src={`https://backend.digitizingvietnam.com/images/iiif/2/${documentid}/${textData[pageIndex].$.pi}/full/full/0/default.jpg`}
                  alt={`${title}`}
                  width={200}
                  height={300}
                  className="max-w-4xl w-full"
                />
              )}
              <div className="text-center text-sm mt-2">
                Trang {currentPage} / {totalPages}
              </div>

              {/* Pagination */}
              <Pagination className="mt-4 mb-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={`?page=${Math.max(1, currentPage - 1)}`}
                      aria-disabled={currentPage === 1}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {generatePaginationItems()}

                  <PaginationItem>
                    <PaginationNext
                      href={`?page=${Math.min(totalPages, currentPage + 1)}`}
                      aria-disabled={currentPage === totalPages}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
            {/* Text */}
            <div className={`text-center ${NomNaTong.className}`}>
              {textData[pageIndex].div[1].lg[0].l.map((line, index) => (
                <div
                  key={`line-${index}`}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center"
                >
                  <div className="text-2xl">
                    {textData[pageIndex].div[0].lg[0].l[index]._}
                  </div>

                  {(() => {
                    let highlightedLine = line._;
                    if (rawData[pageIndex].div[1].lg[0].l[index].seg) {
                      rawData[pageIndex].div[1].lg[0].l[index].seg.forEach(
                        (s) => {
                          const correspondingNote = rawData[
                            pageIndex
                          ].noteg[0].note.find(
                            (note) => note.$.id === s.$.corresp
                          );
                          highlightedLine = highlightedLine.replace(
                            s._,
                            `<span class="text-branding-brown relative group"="${
                              s._
                            }">
                          ${s._}
                          <div class="z-50 absolute w-60 left-0 top-full mt-1 hidden group-hover:block bg-branding-gray text-black text-sm p-2 rounded border border-black shadow-lg">
                          ${correspondingNote ? correspondingNote._ : s._}
                          </div>
                          </span>
                          `
                          );
                        }
                      );
                    }
                    return (
                      <div
                        dangerouslySetInnerHTML={{ __html: highlightedLine }}
                        className="text-2xl mb-2"
                      />
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="mt-10">
            <table className="table-auto border-collapse border border-gray-300 w-full text-left">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2 w-32">
                    Quốc ngữ
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Chú thích
                  </th>
                </tr>
              </thead>
              <tbody>
                {rawData[pageIndex].noteg[0].note.map((note, index) => (
                  <tr key={`note-${note.$.id}`}>
                    <td className="border border-gray-300 px-4 py-2 text-branding-brown w-32">
                      {
                        rawData[pageIndex].div[1].lg[0].l
                          .flatMap(
                            (l: { seg?: { $: { corresp: string } }[] }) =>
                              l.seg ?? []
                          )
                          .find((seg) => seg.$.corresp === note.$.id)?._
                      }
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {note._}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
