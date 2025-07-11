"use client";
import { useTranslations } from "next-intl";

export default function DocumentMetadata({ locale, collectionItemData }) {
  const t = useTranslations();

  let createdDateNew;
  if (collectionItemData.date_created_new) {
    createdDateNew = collectionItemData.date_created_new;
  }
  let createdDate = createdDateNew || "N/A";

  const isValidDateFormat = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);
  const isValidYearMonthFormat = (date: string) => /^\d{4}-\d{2}$/.test(date);
  const isValidYearFormat = (date: string) => /^\d{4}$/.test(date);
  const isValidApproximateDateFormat = (date: string) => /^~\d{4}$/.test(date);

  if (
    collectionItemData.date_created?.full_date ||
    isValidDateFormat(createdDateNew)
  ) {
    createdDate = new Date(
      collectionItemData.date_created?.full_date || createdDateNew
    ).toLocaleDateString(locale);
  } else if (
    collectionItemData.date_created?.year_month_only ||
    isValidYearMonthFormat(createdDateNew)
  ) {
    createdDate = new Date(
      collectionItemData.date_created?.year_month_only || createdDateNew
    ).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
    });
  } else if (
    collectionItemData.date_created?.year_only ||
    isValidYearFormat(createdDateNew)
  ) {
    createdDate = new Date(
      collectionItemData.date_created?.year_only || createdDateNew
    ).toLocaleDateString(locale, {
      year: "numeric",
    });
  } else if (
    collectionItemData.date_created?.approximate_date ||
    isValidApproximateDateFormat(createdDateNew)
  ) {
    // Assuming approximate_date is in the format ~YYYY
    createdDate = ((locale === "vi" ? "Khoảng năm " : "Around the year ") +
      (collectionItemData.date_created?.approximate_date ||
        createdDateNew.replace("~", ""))) as string;
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 mt-8 gap-x-6">
        {/* Title */}
        <div className="items-center gap-3">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {t("CollectionMetadata.title")}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.title}
          </div>
        </div>
        {/* Authors */}
        <div className="items-center gap-3">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {t("CollectionMetadata.authors")}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {Object.entries(
              collectionItemData.contributor.reduce((acc: any, author: any) => {
                const role = author.author_role_term?.name || "Unknown";
                if (!acc[role]) {
                  acc[role] = [];
                }
                acc[role].push(author.author?.name || "");
                return acc;
              }, {})
            )
              .map(
                ([role, authors]: [string, string[]]) =>
                  `${role}: ${authors.join(", ")}`
              )
              .join("; ") || "N/A"}
          </div>
        </div>
        {/* Resource Types */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {t("CollectionMetadata.resource-types")}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.resource_types
              .map((type: any) => type.name)
              .join(", ") || "N/A"}
          </div>
        </div>
        {/* Place of Publication */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {t("CollectionMetadata.place-of-publication")}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.place_of_publication?.name || "N/A"}
          </div>
        </div>
        {/* Date Created */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {t("CollectionMetadata.date-created")}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {createdDate}
          </div>
        </div>
        {/* Format */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {t("CollectionMetadata.format")}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.format?.name || "N/A"}
          </div>
        </div>
        {/* Languages */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {t("CollectionMetadata.languages")}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.languages
              .map((lang: any) => lang.name)
              .join(", ") || "N/A"}
          </div>
        </div>
        {/* Subjects */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {t("CollectionMetadata.subjects")}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.subjects
              .map((subject: any) => subject.name)
              .join(", ") || "N/A"}
          </div>
        </div>
        {/* Publisher */}
        {collectionItemData.publisher && (
          <div className="items-center gap-3 mt-4">
            <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
              {t("CollectionMetadata.publisher")}:
            </div>
            <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
              {collectionItemData.publisher?.name || "N/A"}
            </div>
          </div>
        )}

        {/* Edition */}
        {collectionItemData.edition && (
          <div className="items-center gap-3 mt-4">
            <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
              {t("CollectionMetadata.edition")}:
            </div>
            <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
              {collectionItemData.edition}
            </div>
          </div>
        )}

        {/* Identifier */}
        {collectionItemData.identifier && (
          <div className="items-center gap-3 mt-4">
            <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
              {t("CollectionMetadata.identifier")}:
            </div>
            <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
              {collectionItemData.identifier || "N/A"}
            </div>
          </div>
        )}

        {/* URL */}
        {collectionItemData.url && (
          <div className="items-center gap-3 mt-4">
            <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
              {t("CollectionMetadata.url")}:
            </div>
            <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
              {collectionItemData.url || "N/A"}
            </div>
          </div>
        )}

        {/* Note */}
        {collectionItemData.note && (
          <div className="items-center gap-3 mt-4">
            <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
              {t("CollectionMetadata.note")}:
            </div>
            <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
              {collectionItemData.note || "N/A"}
            </div>
          </div>
        )}

        {/* Related Works */}
        {collectionItemData.related_works && (
          <div className="items-center gap-3 mt-4">
            <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
              {t("CollectionMetadata.related-works")}:
            </div>
            <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
              {collectionItemData.related_works || "N/A"}
            </div>
          </div>
        )}

        {/* Access Condition */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {t("CollectionMetadata.access-condition")}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.access_condition?.description || "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}
