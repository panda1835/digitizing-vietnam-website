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
          <div className="font-['Helvetica Neue'] font-light text-lg mt-6">
            <p className="pt-5">
              <b>
                <i>
                  The Dictionary of Nôm Characters with Quotations and
                  Annotations
                </i>
              </b>
              by Prof. Nguyễn Quang Hồng marks a remarkable advancement in the
              study and interpretation of Nôm characters, shedding light on the
              creativity and independent spirit of the Vietnamese people.
            </p>
            <p className="pt-5">
              Drawing from 124 ancient works and various classical texts from
              different periods, fields, and genres, the author has meticulously
              structured the dictionary entries, providing definitions and, more
              importantly, annotations that trace the origin of each Nôm
              character with vivid, well-documented examples.
            </p>
            <p className="pt-5">
              The dictionary is systematically and scientifically structured
              into two columns: one column identifies the characte&apos;s form,
              pronunciation, and encoding, while the other analyzes the
              structure of the Nôm character and provides its meaning in
              specific contextual settings.
            </p>
            <p className="pt-5">
              Particular attention is given to variants of Nôm characters. A
              single entry may include one or multiple variations of a Nôm
              character, with different forms recorded from specific textual
              sources. This emphasis on variant forms is a noteworthy highlight
              of this dictionary.
            </p>
            <p className="pt-5">
              As a reference tool, the dictionary is arranged alphabetically
              according to the Vietnamese language, enabling users to easily
              look up Nôm characters and their variants. For unfamiliar
              characters, readers can refer to the Index of Nôm Characters by
              Radicals to locate the corresponding page where the
              character&apos;s pronunciation is recorded.
            </p>
            <p className="pt-5">
              This work is exceptionally outstanding, showcasing profound
              erudition in its insights into the pictographic and
              phonetic-symbolic nature of Nôm characters, as well as the
              intricate combination of phonetic and semantic elements. These
              discoveries not only aid in “decoding” the treasure trove of Nôm
              texts left by our ancestors—an invaluable resource waiting to be
              explored—but also contribute to a deeper understanding of
              Vietnamese language and culture throughout historical development,
              paving the way for future research in Vietnamese linguistic and
              cultural studies.
            </p>
            <p className="pt-5">
              The work is recognized as a benchmark in terms of materials,
              methodology, and content for scientific research. It is an
              indispensable reference for scholars and educators engaged in the
              study of Vietnamese scripts, language, and culture, both
              domestically and internationally.
            </p>
            <p className="pt-5">
              This digital version of{" "}
              <b>
                <i>
                  The Dictionary of Nôm Characters with Quotations and
                  Annotations
                </i>
              </b>{" "}
              was prepared by Lê Văn Cường, Lương Thị Hạnh, Trần Khải Hoài, and
              Alexandre Lê in the Vietnamese Nôm Preservation Foundation&apos;s
              Nom Na office in Hanoi, working with Lee Collins in California.
              Prof. Nguyễn Quang Hồng provided guidance in resolving a number of
              issues that came up in the conversion of his print version of the
              text to digital format.The digital version is based on the print
              publication from Nhà xuất bản Khoa học Xã hội in 2014. This
              digital version of the dictionary has been transferred from its
              original home on the Vietnamese Nôm Preservation Foundation
              Website to the Digitizing Việt Nam Website.
            </p>
            <p className="pt-5">
              In 2022, the president of Vietnam honored The Dictionary of Nôm
              Characters with Quotations and Annotations with the Ho Chi Minh
              Award for Science and Technology in acknowledgment of its profound
              scholarly value.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div
            className={`${merriweather.className} text-branding-black text-4xl`}
          >
            Về phiên bản số thức
          </div>
          <div className="font-['Helvetica Neue'] font-light text-lg mt-6">
            <p className="pt-5">
              Cuốn{" "}
              <b>
                <i>Tự điển chữ Nôm dẫn giải</i>
              </b>{" "}
              của tác giả GS.TSKH Nguyễn Quang Hồng là một bước tiến vượt bậc về
              nghiên cứu, giảng giải chữ Nôm, góp phần làm sáng rõ sức sáng tạo,
              tinh thần tự chủ của dân tộc Việt Nam.
            </p>
            <p className="pt-5">
              Từ 124 tác phẩm cổ, văn bản cổ khác nhau thuộc nhiều thời kỳ,
              nhiều lĩnh vực, nhiều loại hình, tác giả đã cấu trúc thành mục từ,
              giải nghĩa và quan trọng hơn là chú thích, chỉ ra được xuất xứ của
              mỗi chữ Nôm bằng các ví dụ minh họa sinh động, có xuất xứ rõ ràng.
            </p>
            <p className="pt-5">
              Tự điển được cấu trúc có tính hệ thống, khoa học theo hai cột: một
              cột xác định hình chữ, âm đọc và kí mã của chữ, cột thứ hai có
              phần phân tích cấu trúc chữ Nôm, giải nghĩa chữ kèm theo văn cảnh
              cụ thể.
            </p>
            <p className="pt-5">
              Chú trọng tới các biến thể chữ Nôm, một mục từ có thể có một hoặc
              nhiều chữ Nôm với các cách viết khác nhau được ghi rõ từ các nguồn
              văn bản cụ thể. Đây là một điểm nhấn quan trọng của cuỗn tự điển
              này.
            </p>
            <p className="pt-5">
              Với tư cách là công cụ tra cứu, cuốn tự điển sắp xếp theo bảng chữ
              cái tiếng Việt. Vì thế, người sử dụng có thể tra cứu được các chữ
              Nôm cũng như các biến thể của chúng. Khi gặp những chữ lạ, người
              đọc có thể tìm tra ở Bảng tra chữ Nôm theo bộ thủ và tìm đến trang
              có âm độc được ghi nhận cho chữ đó.
            </p>
            <p className="pt-5">
              Đây là một công trình đặc biệt xuất sắc, bởi tính uyên thâm về chữ
              nghĩa với những phát hiện tinh tế về tính tượng hình và tượng
              thanh, sự kết hợp giữa tính biểu âm với tính biểu ý của văn tự chữ
              Nôm. Những phát hiện nay không chỉ giúp cho việc “giải mã” kho
              tàng các văn bản viết bằng chữ Nôm của cha ông ta đang cần khai
              thác mà còn góp phần vào nhận thức về ngôn ngữ văn hóa Việt Nam
              trong tiến trình phát triển của lịch sử, định hướng cho những
              nghiên cứu tiếp theo về ngôn ngữ văn hóa Việt Nam.
            </p>
            <p className="pt-5">
              Phiên bản số thức này của cuốn{" "}
              <b>
                <i>Tự điển chữ Nôm dẫn giải</i>
              </b>{" "}
              đã được Lê Văn Cường, Lương Thị Hạnh, Trần Khải Hoài, và Alexandre
              Lê chuẩn bị tại Văn phòng Nôm Na của Hội Bảo tồn Chữ Nôm Việt tại
              Hà Nội, cùng làm việc với Lee Collins ở California. GS. TSKH.
              Nguyễn Quang Hồng cung cấp hướng dẫn trong việc giải quyết một số
              vấn đề xảy ra trong quá trình chuyển đổi từ phiên bản dạng in ra
              sang dạng số thức. Phiên bản số thức này dựa trên cuốn sách in do
              Nhà xuất bản Khoa học Xã hội in năm 2014. Hiện nay, bản số thức
              này của cuốn từ điển đã được chuyển từ trang web của Hội Bảo tồn
              Chữ Nôm Việt sang trang web Digitizing Việt Nam.
            </p>
            <p className="pt-5">
              Công trình được coi là một chuẩn mực về tư liệu, phương pháp và
              nội dung nghiên cứu khoa học, là tài liệu tham khảo không thể
              thiếu trong nghiên cứu khoa học, trong đào tạo về văn tự học, ngôn
              ngữ văn hóa Việt Nam trong và ngoài nước. Công trình{" "}
              <b>
                <i>Tự điển chữ Nôm dẫn giải</i>
              </b>{" "}
              được Chủ tịch nước Việt Nam trao tặng Giải thưởng Hồ Chí Minh về
              Khoa học và Công nghệ năm 2022.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
