"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { VIET_MUONG_WORDS } from "./data";

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default function HundredVietMuongWordsTable({
  locale,
  showHeading = true,
}: {
  locale: string;
  showHeading?: boolean;
}) {
  const [keyword, setKeyword] = useState("");

  const filteredRows = useMemo(() => {
    const normalizedKeyword = normalizeSearchText(keyword);

    if (!normalizedKeyword) {
      return VIET_MUONG_WORDS;
    }

    return VIET_MUONG_WORDS.filter((row) => {
      const ngheTinh = normalizeSearchText(row.ngheTinh);
      const haNoi = normalizeSearchText(row.haNoi);
      return (
        ngheTinh.includes(normalizedKeyword) ||
        haNoi.includes(normalizedKeyword)
      );
    });
  }, [keyword]);

  return (
    <div className="mx-auto w-full py-10">
      {showHeading ? (
        <>
          <h1 className="text-3xl font-semibold">100 từ tiếng Việt - Mường</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Phụ lục I (trang 163-166). Tìm theo từ tiếng Việt ở cột Nghệ Tĩnh
            hoặc Hà Nội.
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
        Hiển thị {filteredRows.length}/{VIET_MUONG_WORDS.length} mục
      </p>

      <div className="mt-6 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="w-16 border-r text-center">
                STT
              </TableHead>
              <TableHead rowSpan={2} className="w-40 border-r text-center">
                Tiếng Việt Mường
              </TableHead>
              <TableHead colSpan={1} className="border-r text-center">
                Tiếng Mường
              </TableHead>
              <TableHead colSpan={2} className="border-r text-center">
                Tiếng Việt
              </TableHead>
              <TableHead rowSpan={2} className="w-32 text-center">
                Tham khảo
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="border-r text-center">Mường Bỉ</TableHead>
              <TableHead className="border-r text-center">Nghệ Tĩnh</TableHead>
              <TableHead className="border-r text-center">Hà Nội</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.index}>
                <TableCell className="border-r text-center">
                  {row.index}
                </TableCell>
                <TableCell className="border-r font-mono">
                  {row.tiengVietMuong}
                </TableCell>
                <TableCell className="border-r font-mono">
                  {row.muongBi}
                </TableCell>
                <TableCell className="border-r">{row.ngheTinh}</TableCell>
                <TableCell className="border-r">{row.haNoi}</TableCell>
                <TableCell className="text-center">
                  <Link
                    href={`/${locale}${row.ref}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700"
                  >
                    Xem
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
