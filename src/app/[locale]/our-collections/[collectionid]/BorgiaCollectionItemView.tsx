"use client";

// Browse view for the Vatican's Borgia Tonchinensis manuscripts.
//
// Follows EdictCollectionItemView's card grid, pagination and URL sync so the
// static collections feel alike, with one difference: there is no facet
// sidebar. The Vatican catalogues this fond as shelfmark-only records, so until
// DVN's descriptions carry genre, script and century there is nothing to filter
// on, and an empty sidebar would only promise more than the data can deliver.
// When those fields fill in, the facet machinery in EdictCollectionItemView is
// the model to copy.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

import { Link } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BORGIA_COLLECTION_SLUG,
  VATICAN_REPOSITORY,
  borgiaMatchesQuery,
  formatPageCount,
  getBorgiaDescription,
  getBorgiaText,
  type BorgiaEntry,
} from "@/lib/vatican-borgia";

interface BorgiaCollectionItemViewProps {
  items: BorgiaEntry[];
  pageSize?: number;
  initialPage?: number;
  locale: string;
}

const PAGE_SIZE_DEFAULT = 20;

const BorgiaCollectionItemView = ({
  items,
  pageSize = PAGE_SIZE_DEFAULT,
  initialPage = 1,
  locale,
}: BorgiaCollectionItemViewProps) => {
  const t = useTranslations();
  const vi = locale === "vi";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [currentPage, setCurrentPage] = useState(initialPage);

  const matchesQuery = useCallback(
    (item: BorgiaEntry) => borgiaMatchesQuery(item, query),
    [query]
  );

  const filteredItems = useMemo(
    () => items.filter(matchesQuery),
    [items, matchesQuery]
  );

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const currentItems = filteredItems.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  // Reset to page 1 whenever the result set changes underneath the pager.
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  // Keep the URL shareable.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (safeCurrentPage > 1) params.set("page", String(safeCurrentPage));

    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, {
      scroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, safeCurrentPage]);

  const itemHref = (item: BorgiaEntry) =>
    `/our-collections/${BORGIA_COLLECTION_SLUG}/${item.itemId}`;

  return (
    <div className="w-full">
      <div className="max-width mx-auto">
        <div className="mt-10 max-w-xl">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              vi
                ? "Tìm theo ký hiệu hoặc mô tả…"
                : "Search by shelfmark or description…"
            }
            aria-label={t("Filter.search-title-label")}
          />
          <p className="mt-2 text-xs text-[#777777]">
            {vi
              ? "Thư viện Vatican chỉ ghi ký hiệu cho bộ sưu tập này; phần mô tả do Digitizing Việt Nam biên soạn và đang được bổ sung."
              : "The Vatican catalogues this fond by shelfmark alone; the descriptions are written by Digitizing Việt Nam and are still being added."}
          </p>
        </div>

        <div className="mt-10">
          <div
            id="borgia-tonchinensis-list"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-8 gap-y-12"
          >
            {currentItems.map((item) => {
              const { title } = getBorgiaText(item, locale);
              const description = getBorgiaDescription(item);

              return (
                <div key={item.itemId}>
                  <Link href={itemHref(item)}>
                    {item.thumbnailUrl && (
                      <Image
                        unoptimized
                        src={item.thumbnailUrl}
                        alt={title}
                        width={256}
                        height={228}
                        className="object-cover rounded w-full h-40 bg-gray-100"
                      />
                    )}
                  </Link>
                  <Link href={itemHref(item)}>
                    <div className="font-['Helvetica Neue'] font-medium text-branding-black text-xl mt-[12px] hover:text-branding-brown hover:underline">
                      {title}
                    </div>
                  </Link>
                  {/* Once a volume is catalogued its shelfmark still belongs on
                      the card: it is how the Vatican, and every citation of it,
                      refers to the manuscript. */}
                  <div className="text-sm text-[#777777] mt-2">
                    {[
                      title === item.shelfmark ? "" : item.shelfmark,
                      description?.century
                        ? vi
                          ? `Thế kỷ ${description.century.replace(/\D/g, "")}`
                          : `${description.century} c.`
                        : "",
                      formatPageCount(item.pageCount, locale),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
              );
            })}
          </div>

          {currentItems.length === 0 && (
            <div className="text-branding-black mt-8">
              {t("Filter.no-items-match")}
            </div>
          )}

          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-sm font-light font-['Helvetica Neue'] text-branding-black">
              {totalItems} {t("Collection.result")}
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                {t("Button.previous")}
              </Button>
              <span className="text-sm font-light font-['Helvetica Neue'] text-branding-black min-w-16 text-center">
                {safeCurrentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={safeCurrentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
              >
                {t("Button.next")}
              </Button>
            </div>
          </div>
        </div>

        {/* The Vatican asserts copyright over these images, so the credit says
            plainly whose they are, where they load from, and that DVN shows
            them by permission. */}
        <p className="mt-8 mb-8 text-base text-branding-black font-light font-['Helvetica Neue'] leading-relaxed">
          {vi ? "Ghi chú: " : "Note: "}
          {vi
            ? `Bản gốc được lưu giữ và số hóa bởi ${VATICAN_REPOSITORY.labelVi} (${VATICAN_REPOSITORY.label}), gồm 41 thủ bản và ấn phẩm từ thế kỷ XVII đến thế kỷ XIX. Hình ảnh thuộc bản quyền của Thư viện và được tải trực tiếp từ ${VATICAN_REPOSITORY.digitalLibraryVi}; Digitizing Việt Nam giới thiệu bộ sưu tập này với sự cho phép của Thư viện Số Vatican.`
            : `The originals are held and were digitised by the ${VATICAN_REPOSITORY.labelEn} (${VATICAN_REPOSITORY.label}) — 41 manuscripts and early printed works of the 17th to 19th centuries. The images are copyright the Library and are loaded directly from the ${VATICAN_REPOSITORY.digitalLibrary}; Digitizing Việt Nam presents the collection by permission of the Vatican Digital Library.`}{" "}
          <a
            href={VATICAN_REPOSITORY.fondUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-branding-brown"
          >
            {vi ? "Truy cập bộ sưu tập gốc." : "Access the original collection."}
          </a>
        </p>
      </div>
    </div>
  );
};

export default BorgiaCollectionItemView;
