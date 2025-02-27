export default function Metadata({ locale, collectionItemData }) {
  return (
    <div>
      {/* Title */}
      <div className="grid grid-cols-1 sm:grid-cols-2 mt-8">
        <div className="items-center gap-3">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {locale === "en" ? "Title" : "Tiêu đề"}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.title}
          </div>
        </div>
        {/* Resource Types */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {locale === "en" ? "Resource Types" : "Loại tài nguyên"}:
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
            {locale === "en" ? "Place of Publication" : "Nơi xuất bản"}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.place_of_publication?.name || "N/A"}
          </div>
        </div>
        {/* Date Created */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {locale === "en" ? "Date Created" : "Ngày tạo"}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.date_created?.full_date
              ? new Date(
                  collectionItemData.date_created.full_date
                ).toLocaleDateString(locale)
              : collectionItemData.date_created?.year_month_only
              ? new Date(
                  collectionItemData.date_created.year_month_only
                ).toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                })
              : collectionItemData.date_created?.year_only
              ? new Date(
                  collectionItemData.date_created.year_only
                ).toLocaleDateString(locale, {
                  year: "numeric",
                })
              : collectionItemData.date_created?.approximate_date
              ? new Date(
                  collectionItemData.date_created.approximate_date
                ).toLocaleDateString(locale)
              : "N/A"}
          </div>
        </div>
        {/* Format */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {locale === "en" ? "Format" : "Định dạng"}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.format?.name || "N/A"}
          </div>
        </div>
        {/* Languages */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {locale === "en" ? "Languages" : "Ngôn ngữ"}:
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
            {locale === "en" ? "Subjects" : "Chủ đề"}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.subjects
              .map((subject: any) => subject.name)
              .join(", ") || "N/A"}
          </div>
        </div>
        {/* Publisher */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {locale === "en" ? "Publisher" : "Nhà xuất bản"}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.publisher?.name || "N/A"}
          </div>
        </div>
        {/* Edition */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {locale === "en" ? "Edition" : "Phiên bản"}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.edition}
          </div>
        </div>
        {/* Identifier */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {locale === "en" ? "Identifier" : "Mã định danh"}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.identifier || "N/A"}
          </div>
        </div>
        {/* URL */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {locale === "en" ? "URL" : "Liên kết"}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.url || "N/A"}
          </div>
        </div>
        {/* Note */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {locale === "en" ? "Note" : "Ghi chú"}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.note || "N/A"}
          </div>
        </div>
        {/* Related Works */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {locale === "en" ? "Related Works" : "Tác phẩm liên quan"}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.related_works || "N/A"}
          </div>
        </div>

        {/* Access Condition */}
        <div className="items-center gap-3 mt-4">
          <div className="text-[#777777] text-lg font-normal font-['Helvetica Neue']">
            {locale === "en" ? "Access Condition" : "Điều kiện truy cập"}:
          </div>
          <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
            {collectionItemData.access_condition?.name || "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}
