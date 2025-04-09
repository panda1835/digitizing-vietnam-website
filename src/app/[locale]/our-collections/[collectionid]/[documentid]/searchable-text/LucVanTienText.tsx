"use client";

import ImageTextNoteView from "./ImageTextNoteView";

export default function TruyenKieu({
  locale,
  collectionid,
  documentid,
  collectionTitle,
}) {
  return (
    <ImageTextNoteView
      collectionTitle={collectionTitle}
      title={`Lục Vân Tiên`}
      abstract=""
      dataApiUrl={`/api/luc-van-tien`}
      collectionid={collectionid}
      documentid={documentid}
      locale={locale}
    />
  );
}
