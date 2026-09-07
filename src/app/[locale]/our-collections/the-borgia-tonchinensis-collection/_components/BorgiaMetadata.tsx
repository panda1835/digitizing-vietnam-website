// Metadata panel for one Borgia Tonchinensis manuscript.
//
// Follows EdictMetadata's Row typography so the two mirrored collections read
// alike, and uses the shared CollectionMetadata.* message keys where they fit.
//
// The panel is deliberately honest about how thin the source cataloguing is:
// the Vatican records a shelfmark, a page count and the language code "und",
// and everything else on this page is DVN's own description. The rows say which
// is which rather than presenting DVN's words as the Library's.

import { getTranslations } from "next-intl/server";

import {
  VATICAN_REPOSITORY,
  formatPageCount,
  getBorgiaDescription,
  type BorgiaEntry,
} from "../_data";

interface BorgiaMetadataProps {
  entry: BorgiaEntry;
  locale: string;
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="items-center gap-3 mt-4">
    <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
      {label}:
    </div>
    <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
      {children}
    </div>
  </div>
);

const linkClass =
  "text-branding-black text-base font-light font-['Helvetica Neue'] underline hover:text-branding-brown";

export default async function BorgiaMetadata({ entry, locale }: BorgiaMetadataProps) {
  const t = await getTranslations();
  const vi = locale === "vi";
  const description = getBorgiaDescription(entry);

  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-2 mt-8 gap-x-6">
        <Row label={vi ? "Ký hiệu" : "Shelfmark"}>{entry.shelfmark}</Row>

        <Row label={vi ? "Số trang số hóa" : "Digitised pages"}>
          {formatPageCount(entry.pageCount, locale)}
        </Row>

        {description?.genre && (
          <Row label={vi ? "Thể loại" : "Genre"}>{description.genre}</Row>
        )}

        {description?.century && (
          <Row label={vi ? "Thế kỷ" : "Century"}>
            {vi ? `Thế kỷ ${description.century.replace(/\D/g, "")}` : description.century}
          </Row>
        )}

        {description?.scripts?.length ? (
          <Row label={vi ? "Văn tự" : "Scripts"}>{description.scripts.join("; ")}</Row>
        ) : null}

        {/* The Vatican records "und" — undetermined — for every volume in this
            fond, which is worth showing rather than hiding: it is why DVN has
            to describe the languages itself. */}
        {entry.languageCodes.length > 0 && (
          <Row label={t("CollectionMetadata.languages")}>
            {entry.languageCodes.join(", ")}
            {entry.languageCodes.includes("und")
              ? vi
                ? " (chưa xác định, theo biên mục của Thư viện Vatican)"
                : " (undetermined, as catalogued by the Vatican Library)"
              : ""}
          </Row>
        )}

        {entry.firstPageLabels.length > 0 && (
          <Row label={vi ? "Các tờ đầu" : "Opening leaves"}>
            {entry.firstPageLabels.join(" · ")}
          </Row>
        )}

        <Row label={t("CollectionMetadata.location")}>
          <a
            href={entry.permalinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {VATICAN_REPOSITORY.label}
          </a>
        </Row>

        <Row label={t("CollectionMetadata.access-condition")}>
          {entry.attribution || VATICAN_REPOSITORY.attribution}
        </Row>
      </div>

      {/* Provenance: always send the reader back to the holding institution.
          Styled as a plain Note row rather than a panel, matching EdictMetadata,
          but the Library's own record, viewer and fond stay linked: they are the
          reader's route to the authoritative copy. */}
      <Row label={t("CollectionMetadata.note")}>
        <div className="space-y-3">
          <p>
            {vi
              ? `Bản gốc được lưu giữ tại ${VATICAN_REPOSITORY.labelVi} (${VATICAN_REPOSITORY.label}). Hình ảnh thuộc bản quyền của Thư viện và được tải trực tiếp từ ${VATICAN_REPOSITORY.digitalLibraryVi}; Digitizing Việt Nam giới thiệu tài liệu này với sự cho phép của Thư viện Số Vatican.`
              : `The original is held by the ${VATICAN_REPOSITORY.labelEn} (${VATICAN_REPOSITORY.label}). The images are copyright the Library and are loaded directly from the ${VATICAN_REPOSITORY.digitalLibrary}; Digitizing Việt Nam presents this manuscript by permission of the Vatican Digital Library.`}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a
              href={entry.permalinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {vi ? "Xem hồ sơ tại Vatican" : "View the Vatican record"}
            </a>
            <a
              href={entry.viewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {vi ? "Trình đọc của Vatican" : "The Vatican's own viewer"}
            </a>
            <a
              href={VATICAN_REPOSITORY.fondUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {vi ? "Toàn bộ bộ sưu tập" : "Full collection"}
            </a>
          </div>
        </div>
      </Row>
    </section>
  );
}
