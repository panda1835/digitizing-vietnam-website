"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { MUONG_COMBINED_ROWS, MUONG_WORD_COLUMNS } from "./data";

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const columnsPerPageByWidth = (width: number) => {
  if (width < 640) return 3;
  if (width < 1024) return 5;
  if (width < 1280) return 7;
  return 9;
};

export default function TuVungTiengMuongTable({
  locale,
  showHeading = false,
}: {
  locale: string;
  showHeading?: boolean;
}) {
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [columnsPerPage, setColumnsPerPage] = useState(7);

  useEffect(() => {
    const handleResize = () => {
      setColumnsPerPage(columnsPerPageByWidth(window.innerWidth));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredColumns = useMemo(() => {
    const normalizedKeyword = normalizeSearchText(keyword);

    if (!normalizedKeyword) {
      return MUONG_WORD_COLUMNS;
    }

    return MUONG_WORD_COLUMNS.filter((column) =>
      normalizeSearchText(column.word).includes(normalizedKeyword)
    );
  }, [keyword]);

  const wordIndexByKey = useMemo(
    () =>
      new Map(MUONG_WORD_COLUMNS.map((column, index) => [column.key, index])),
    []
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, columnsPerPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredColumns.length / Math.max(columnsPerPage, 1))
  );
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const start = (safePage - 1) * columnsPerPage;
  const end = start + columnsPerPage;
  const visibleColumns = filteredColumns.slice(start, end);

  const pageTokens = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const leftPages = [
      Math.max(1, safePage - 1),
      safePage,
      Math.min(totalPages, safePage + 1),
    ].filter((page, index, arr) => arr.indexOf(page) === index);
    const rightPages = [totalPages - 2, totalPages - 1, totalPages];

    const leftEnd = leftPages[leftPages.length - 1];
    const rightStart = rightPages[0];

    if (leftEnd + 1 >= rightStart) {
      const merged = new Set<number>([...leftPages, ...rightPages]);
      return Array.from(merged).sort((a, b) => a - b);
    }

    return [...leftPages, "...", ...rightPages] as Array<number | "...">;
  }, [safePage, totalPages]);

  const canGoPrev = safePage > 1;
  const canGoNext = safePage < totalPages;

  return (
    <div className="mx-auto w-full py-10">
      {showHeading ? (
        <>
          <h1 className="text-3xl font-semibold">
            Từ vựng tiếng Mường (30 thổ ngữ)
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Dữ liệu Phụ lục II đã được gộp thành một bảng. Cột &quot;Các thổ ngữ
            tiếng Mường&quot; luôn hiển thị, còn phân trang áp dụng cho các cột
            từ tiếng Việt.
          </p>
        </>
      ) : null}

      <div className={showHeading ? "mt-6 max-w-md" : "max-w-md"}>
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm từ tiếng Việt..."
          aria-label="Tìm từ tiếng Việt"
        />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {filteredColumns.length} cột từ tiếng Việt, hiển thị trang {safePage}/
        {totalPages}
      </p>

      <div className="mt-6 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 border-r text-center">STT</TableHead>
              <TableHead className="w-40 border-r">
                Các thổ ngữ tiếng Mường
              </TableHead>
              {visibleColumns.map((column) => (
                <TableHead
                  key={column.key}
                  className="min-w-28 border-r text-center align-top"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{column.word}</span>
                    <Link
                      href={`/${locale}${column.ref}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-normal text-blue-600 underline hover:text-blue-700"
                    >
                      Tham khảo
                    </Link>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {MUONG_COMBINED_ROWS.map((row) => (
              <TableRow key={row.index}>
                <TableCell className="border-r text-center">
                  {row.index}
                </TableCell>
                <TableCell className="border-r">{row.dialectName}</TableCell>
                {visibleColumns.map((column) => {
                  const columnIndex = wordIndexByKey.get(column.key);

                  return (
                    <TableCell
                      key={`${row.index}-${column.key}`}
                      className="border-r font-mono text-xs"
                    >
                      {typeof columnIndex === "number"
                        ? row.values[columnIndex] || "..."
                        : "..."}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => canGoPrev && setCurrentPage((prev) => prev - 1)}
          disabled={!canGoPrev}
          className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Trước
        </button>
        {pageTokens.map((token, index) =>
          token === "..." ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm">
              ...
            </span>
          ) : (
            <button
              type="button"
              key={token}
              onClick={() => setCurrentPage(token)}
              className={`rounded border px-3 py-1 text-sm ${
                token === safePage ? "bg-black text-white" : ""
              }`}
            >
              {token}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => canGoNext && setCurrentPage((prev) => prev + 1)}
          disabled={!canGoNext}
          className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
