// Attribution for the Penn State edicts collection.
//
// Rendered at the foot of the collection page, below the featured articles, so
// it reads as a closing credit rather than interrupting the browse grid.
//
// A server component: it is static text and links, so it needs no client
// bundle. Every fact here is sourced from Penn State's own finding aid — see
// EDICTS_REPOSITORY in src/lib/pennstate-edicts.ts.

import { EDICTS_REPOSITORY } from "@/lib/pennstate-edicts";

export default function EdictCollectionCredit({ locale }: { locale: string }) {
  const vi = locale === "vi";

  const link = "underline hover:text-branding-brown";

  return (
    <div className="max-width mx-auto w-full">
      <div className="mt-12 mb-4 rounded-md bg-gray-100 p-5">
        <p className="text-base text-branding-black font-light font-['Helvetica Neue'] leading-relaxed">
          {vi ? (
            <>
              Bộ sưu tập gốc do{" "}
              <a
                href={EDICTS_REPOSITORY.url}
                target="_blank"
                rel="noopener noreferrer"
                className={link}
              >
                {EDICTS_REPOSITORY.library}
              </a>
              , {EDICTS_REPOSITORY.institution}, lưu giữ và số hóa (
              {EDICTS_REPOSITORY.extent}, {EDICTS_REPOSITORY.dateRange}). Hình ảnh được
              tải trực tiếp từ kho số của Penn State, và phần mô tả ở trên được biên
              soạn dựa theo công cụ tra cứu của thư viện.
            </>
          ) : (
            <>
              The original collection is held and was digitised by the{" "}
              <a
                href={EDICTS_REPOSITORY.url}
                target="_blank"
                rel="noopener noreferrer"
                className={link}
              >
                {EDICTS_REPOSITORY.library}
              </a>
              , {EDICTS_REPOSITORY.institution} ({EDICTS_REPOSITORY.extent},{" "}
              {EDICTS_REPOSITORY.dateRange}). Images are loaded directly from Penn
              State&rsquo;s digital repository, and the description above is adapted from
              their finding aid.
            </>
          )}
        </p>

        <p className="mt-3 text-sm text-[#777777] font-['Helvetica Neue']">
          {vi ? "Nguồn trích dẫn: " : "Cited as: "}
          <a
            href={EDICTS_REPOSITORY.findingAidUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            {EDICTS_REPOSITORY.findingAidTitle}
          </a>
          {`, compiled by ${EDICTS_REPOSITORY.findingAidAuthor}, ${EDICTS_REPOSITORY.findingAidYear}. `}
          <a
            href={EDICTS_REPOSITORY.collectionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            {vi ? "Bộ sưu tập số" : "Digital collection"}
          </a>
          {" · "}
          <a
            href={EDICTS_REPOSITORY.rightsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            {EDICTS_REPOSITORY.rightsLabel}
          </a>
        </p>
      </div>
    </div>
  );
}
