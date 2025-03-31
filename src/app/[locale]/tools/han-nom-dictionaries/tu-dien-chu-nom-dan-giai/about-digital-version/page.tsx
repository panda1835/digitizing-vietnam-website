import Image from "next/image";
import { Merriweather } from "next/font/google";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

import localFont from "next/font/local";
const NomNaTong = localFont({
  src: "../../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function AboutDigitalVersion({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div>
      {locale === "en" ? (
        <div>
          <div
            className={`${merriweather.className} text-branding-black text-4xl`}
          >
            About the Digital Version
          </div>
          <div className="font-['Helvetica_Neue'] font-light text-lg mt-6">
            <p className="pt-5">
              This digital version of <i>Tự Điển Chữ Nôm Dẫn Giải</i> was
              prepared by Lê Văn Cường, Lương Thị Hạnh, Trần Khải Hoài, and
              Alexandre Lê in the VNPF&aposs Nom Na office in Hanoi, working
              with Lee Collins in California. Prof. Nguyễn Quang Hồng, provided
              guidance in resolving a number of issues that came up in the
              conversion of his print version of the text to digital format.
            </p>
            <p className="pt-5">
              The digital version is based on the print publication from Nhà
              xuất bản Khoa học Xã hội in 2014. Use is free. In accordance with
              our terms-of-use, we ask that this source be acknowledged in any
              subsequent public use, in print, or digital. Comments and
              corrections can be sent to{" "}
              <a
                href="mailto:info@digitizingvietnam.com?Subject=TĐCNDG"
                target="_top"
                className="text-branding-brown"
              >
                Digitizing Vietnam
              </a>
              .
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div
            className={`${merriweather.className} text-branding-black text-4xl`}
          >
            Sơ đồ phân loại cấu trúc chữ Nôm
          </div>
          <div className="font-['Helvetica_Neue'] font-light text-lg mt-6">
            <p className="pt-5">
              Phiên bản số thức này của cuốn <i>Tự Điển Chữ Nôm Dẫn Giải</i> đã
              được Lê Văn Cường, Lương Thị Hạnh, Trần Khải Hoài, và Alexandre Lê
              chuẩn bị tại Văn phòng Nôm Na của VNPF tại Hà Nội, cùng làm việc
              với Lee Collins ở California. Gs. Ts. Nguyễn Quang Hồng cung cấp
              hướng dẫn trong việc giải quyết một số vấn đề xảy ra trong quá
              trình chuyển đổi từ phiên bản dạng in ra sang dạng số thức.
            </p>
            <p className="pt-5">
              Phiên bản số thức này dựa trên cuốn sách in do Nhà xuất bản Khoa
              học Xã hội in năm 2014. Việc sử dụng là tự do. Theo điều khoản sử
              dụng, chúng tôi đòi hỏi nguồn này cần được thừa nhận trong bất kì
              việc sử dụng công cộng về sau, trong in ấn, hay dạng số thức. Bình
              luận và sửa chữa có thể được gửi tới{" "}
              <a
                href="mailto:info@digitizingvietnam.com?Subject=TĐCNDG"
                target="_top"
                className="text-branding-brown"
              >
                Digitizing Vietnam
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
