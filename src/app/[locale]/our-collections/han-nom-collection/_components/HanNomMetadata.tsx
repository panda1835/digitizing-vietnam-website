"use client";
import { useTranslations } from "next-intl";

interface MetadataItem {
  label: string;
  value: string;
}

interface HanNomMetadataProps {
  metadata: MetadataItem[];
  cuCatalogUrl?: string;
}

export default function HanNomMetadata({
  metadata,
  cuCatalogUrl,
}: HanNomMetadataProps) {
  const t = useTranslations();

  const metadataLabelMap: Record<string, string> = {
    title: "CollectionMetadata.title",
    name: "CollectionMetadata.authors",
    creator: "CollectionMetadata.authors",
    "other title": "CollectionMetadata.other-titles",
    "other titles": "CollectionMetadata.other-titles",
    subjects: "CollectionMetadata.subjects",
    genre: "CollectionMetadata.genre",
    date: "CollectionMetadata.date",
    "physical description": "CollectionMetadata.physical-description",
    "publication information": "CollectionMetadata.publication-information",
    "origin information": "CollectionMetadata.origin-information",
    publisher: "CollectionMetadata.publisher",
    language: "CollectionMetadata.languages",
    subject: "CollectionMetadata.subjects",
    format: "CollectionMetadata.format",
    identifier: "CollectionMetadata.identifier",
    "catalog record": "CollectionMetadata.catalog-record",
    location: "CollectionMetadata.location",
    note: "CollectionMetadata.note",
    "note (language)": "CollectionMetadata.note-language",
    "note (original location)": "CollectionMetadata.note-original-location",
    "note (statement of responsibility)":
      "CollectionMetadata.note-statement-of-responsibility",
    url: "CollectionMetadata.url",
  };

  const getLocalizedLabel = (label: string) => {
    const normalized = label.toLowerCase().replace(/:$/, "").trim();
    const translationKey = metadataLabelMap[normalized];
    return translationKey ? t(translationKey) : label;
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 mt-8 gap-x-6">
        {metadata.map((item, index) => (
          <div key={index} className="items-center gap-3 mt-4">
            <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
              {getLocalizedLabel(item.label)}:
            </div>
            {item.label.toLowerCase().replace(/:$/, "").trim() ===
              "location" && cuCatalogUrl ? (
              <a
                href={cuCatalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-branding-black text-base font-light font-['Helvetica Neue'] underline hover:text-branding-brown"
              >
                Columbia University Libraries
              </a>
            ) : (
              <div
                className="text-branding-black text-base font-light font-['Helvetica Neue']"
                dangerouslySetInnerHTML={{ __html: item.value }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
