// Metadata panel for one Penn State edict.
//
// Uses the existing CollectionMetadata.* message keys so labels stay consistent
// with the rest of the site, and the two-column grid from the Hán-Nôm and
// Strapi item pages.
//
// Rendered on the server: it is pure display, so it needs no client bundle and
// stays in the SSR HTML regardless of what the viewer does.
//
// This is a separate component rather than a reuse of han-nom-collection's
// HanNomMetadata because that one takes free-text IIIF {label, value} pairs and
// hardcodes "Columbia University Libraries" for its repository row. Here the
// fields are already typed and the repository is Penn State, so mapping typed
// fields directly is simpler than round-tripping them through label strings.

import { getTranslations } from "next-intl/server";

import { EDICTS_REPOSITORY, type EdictEntry } from "@/lib/pennstate-edicts";

interface EdictMetadataProps {
  entry: EdictEntry;
  locale: string;
}

/**
 * Matches the label/value typography used by han-nom-collection's Metadata.tsx
 * so the two collections' item pages read identically: grey Helvetica Neue
 * label at text-lg with a trailing colon, black light-weight value at
 * text-base.
 */
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

export default async function EdictMetadata({ entry, locale }: EdictMetadataProps) {
  const t = await getTranslations();
  const vi = locale === "vi";

  // Prefer the site's shared metadata labels; fall back to plain wording for
  // the few fields the existing namespace has no key for.
  const dateLabel = t("CollectionMetadata.date");

  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-2 mt-8 gap-x-6">
        <Row label={t("CollectionMetadata.title")}>{entry.title}</Row>

        {entry.creator && (
          <Row label={t("CollectionMetadata.authors")}>{entry.creator}</Row>
        )}

        <Row label={vi ? "Loại văn bản" : "Document type"}>{entry.documentType}</Row>

        {entry.dynasty && (
          <Row label={vi ? "Triều đại" : "Dynasty"}>
            {entry.dynasty}
            {entry.era ? ` — ${entry.era}` : ""}
          </Row>
        )}

        {entry.date && <Row label={dateLabel}>{entry.date}</Row>}

        {entry.vietnameseDate && (
          <Row label={vi ? "Ngày âm lịch" : "Date (Vietnamese calendar)"}>
            {entry.vietnameseDate}
          </Row>
        )}

        {entry.language && (
          <Row label={t("CollectionMetadata.languages")}>{entry.language}</Row>
        )}

        {entry.subjects.length > 0 && (
          <Row label={t("CollectionMetadata.subjects")}>{entry.subjects.join("; ")}</Row>
        )}

        {entry.place && (
          <Row label={t("CollectionMetadata.place-of-publication")}>{entry.place}</Row>
        )}

        {entry.physical && (
          <Row label={t("CollectionMetadata.physical-description")}>{entry.physical}</Row>
        )}

        {entry.container && (
          <Row label={vi ? "Vị trí lưu trữ" : "Container"}>{entry.container}</Row>
        )}

        {entry.identifier && (
          <Row label={t("CollectionMetadata.identifier")}>{entry.identifier}</Row>
        )}

        <Row label={t("CollectionMetadata.location")}>
          <a
            href={entry.permalinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-branding-black text-base font-light font-['Helvetica Neue'] underline hover:text-branding-brown"
          >
            {entry.repository || EDICTS_REPOSITORY.label}
          </a>
        </Row>

        <Row label={t("CollectionMetadata.access-condition")}>
          <a
            href={entry.rights || EDICTS_REPOSITORY.rightsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-branding-black text-base font-light font-['Helvetica Neue'] underline hover:text-branding-brown"
          >
            {EDICTS_REPOSITORY.rightsLabel}
          </a>
        </Row>
      </div>

      {entry.description && (
        <Row label={vi ? "Mô tả" : "Description"}>{entry.description}</Row>
      )}

      {entry.dateNotes && (
        <Row label={vi ? "Ghi chú niên đại" : "Date notes"}>{entry.dateNotes}</Row>
      )}

      <Row label={t("CollectionMetadata.note")}>
        <div className="space-y-3">
          {entry.notes && <p>{entry.notes}</p>}
          <p>
            {vi
              ? "Tài liệu gốc được lưu giữ tại Eberly Family Special Collections Library thuộc Penn State University Libraries. Hình ảnh do Penn State cung cấp từ kho lưu trữ số của trường."
              : "The original document is held by the Eberly Family Special Collections Library at Penn State University Libraries. Images are provided from Penn State's digital repository."}
          </p>
        </div>
      </Row>
    </section>
  );
}
