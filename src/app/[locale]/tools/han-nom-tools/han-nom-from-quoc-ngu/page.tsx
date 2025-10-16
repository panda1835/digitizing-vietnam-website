import HanNomFromQuocNgu from "./HanNomFromQuocNgu";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useLocale } from "next-intl";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: `${t(
      "Tools.han-nom-tools.tools.han-nom-from-quoc-ngu.name"
    )} | Digitizing Việt Nam`,
    description: t(
      "Tools.han-nom-tools.tools.han-nom-from-quoc-ngu.description"
    ),
  };
}

export default function HanNomFromQuocNguPage() {
  const locale = useLocale();
  return (
    <div>
      <HanNomFromQuocNgu />
      {/* Attribution */}
      <div className="mb-10 font-['Helvetica Neue'] font-light ">
        {locale === "vi" ? (
          <div>
            <p>
              <span className="">
                Dữ liệu ký tự và tài liệu tham khảo được trích từ các từ điển do{" "}
                <a
                  href="https://www.nomfoundation.org/?uiLang=vn"
                  className="text-blue-600 underline hover:text-blue-800"
                  target="_blank"
                >
                  Hội Bảo tồn di sản chữ Nôm Việt Nam
                </a>{" "}
                cung cấp
              </span>
              , bao gồm <em>Giúp Đọc Nôm và Hán Việt</em>,{" "}
              <em>Tự Điển Chữ Nôm Dẫn Giải</em>,{" "}
              <em>Nguyễn Trãi Quốc Âm Từ Điển</em>, và <em>Từ Điển Taberd</em>,
              cùng với tài liệu của <em>Viện Nghiên Cứu Hán Nôm</em>, và các
              nguồn trực tuyến như{" "}
              <a
                href="https://chunom.org"
                className="text-blue-600 underline hover:text-blue-800"
                target="_blank"
              >
                chunom.org
              </a>
              .
            </p>
          </div>
        ) : (
          <div>
            <p>
              <span className="">
                Character data and reference materials are sourced from
                dictionaries provided by the{" "}
                <a
                  href="https://www.nomfoundation.org/?uiLang=en"
                  className="text-blue-600 underline hover:text-blue-800"
                  target="_blank"
                >
                  Vietnamese Nôm Preservation Foundation
                </a>
              </span>
              , including <em>Giúp Đọc Nôm và Hán Việt</em>,{" "}
              <em>Tự Điển Chữ Nôm Dẫn Giải</em>,{" "}
              <em>Nguyễn Trãi Quốc Âm Từ Điển</em>, and{" "}
              <em>Taberd&apos;s Dictionary</em>, as well as materials from the{" "}
              <em>Institute of Hán-Nôm Studies</em>, and online resources such
              as{" "}
              <a
                href="https://chunom.org"
                className="text-blue-600 underline hover:text-blue-800"
                target="_blank"
              >
                chunom.org
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
