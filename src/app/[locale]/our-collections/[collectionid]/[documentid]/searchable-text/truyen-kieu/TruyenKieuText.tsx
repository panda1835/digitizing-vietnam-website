"use client";

import ImageTextNoteView from "./ImageTextNoteView";

export default function TruyenKieu({
  version,
  locale,
  collectionid,
  documentid,
  collectionTitle,
}) {
  return (
    <ImageTextNoteView
      collectionTitle={collectionTitle}
      title={`Truyện Kiều bản ${version}`}
      abstract=""
      dataApiUrl={`/api/searchable-text/truyen-kieu?version=${version}`}
      collectionid={collectionid}
      documentid={documentid}
      locale={locale}
    />
  );
}
