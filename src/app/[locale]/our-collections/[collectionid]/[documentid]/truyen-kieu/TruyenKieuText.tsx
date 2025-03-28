"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import type { TruyenKieuRaw, TruyenKieuText } from "./types";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import localFont from "next/font/local";

const NomNaTong = localFont({
  src: "../../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function TruyenKieu({ version }) {
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
        const res = await fetch(`/api/truyen-kieu?version=${version}`);
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
  }, [version]);

  // Ensure page is within valid range
  const pageIndex = Math.min(Math.max(0, currentPage - 1), totalPages - 1);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

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
    <div className=" mx-auto p-4">
      <div className="text-3xl text-center">TRUYỆN KIỀU BẢN {version}</div>
      <div className="text-center text-sm mt-2">
        Trang {currentPage} / {totalPages}
      </div>

      {/* Pagination */}
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={`?page=${Math.max(1, currentPage - 1)}`}
              aria-disabled={currentPage === 1}
              className={
                currentPage === 1 ? "pointer-events-none opacity-50" : ""
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

      {/* Content */}
      <div className="flex flex-col space-y-4 mt-4">
        {/* Image and Text */}
        <div className="flex flex-col md:flex-row md:justify-center space-x-4">
          {/* Image */}
          <div>
            {textData[pageIndex] && textData[pageIndex].$ && (
              <Image
                unoptimized
                src={`https://backend.digitizingvietnam.com/images/iiif/2/truyen-kieu-${version}/${textData[pageIndex].$.pi}/full/full/0/default.jpg`}
                alt="Truyen Kieu"
                width={200}
                height={300}
                className="max-w-4xl w-full"
              />
            )}
          </div>
          {/* Text */}
          <div className={`text-center ${NomNaTong.className}`}>
            {textData[pageIndex].div[1].lg[0].l.map((line, index) => (
              <div
                key={`line-${index}`}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {textData[pageIndex].div[0].lg[0].l[index]._}
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
                          `<span class="text-blue-500 relative group"="${s._}">
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
                    />
                  );
                })()}
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <div>Chú thích</div>
          <div>
            {rawData[pageIndex].noteg[0].note.map((note, index) => (
              <div key={`note-${note.$.id}`} className="">
                <span className="text-blue-500">
                  {
                    rawData[pageIndex].div[1].lg[0].l
                      .flatMap(
                        (l: { seg?: { $: { corresp: string } }[] }) =>
                          l.seg ?? []
                      )
                      .find((seg) => seg.$.corresp === note.$.id)?._
                  }
                </span>
                {": "} {note._}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
