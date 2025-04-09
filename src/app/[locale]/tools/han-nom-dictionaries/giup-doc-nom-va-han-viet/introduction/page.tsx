import { Merriweather } from "next/font/google";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export default function Introduction({
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
            Introduction
          </div>
          <div className="font-['Helvetica_Neue'] font-light text-lg mt-6">
            <p className="pt-5">
              The{" "}
              <b>
                <i>Nôm and Sino-Vietnamese Pronunciation Guide</i>
              </b>{" "}
              by Father Anthony Trần Văn Kiệm consists of two main parts: Part I
              introduces and lists the radicals used in writing Hán-Nôm
              characters, followed by an arrangement of Hán-Nôm characters
              classified by radicals and stroke count. This method of organizing
              Hán-Nôm characters by radicals allows readers to quickly identify
              the pronunciation of a character in both Sino-Vietnamese and
              modern Vietnamese, thereby enabling them to easily find the
              corresponding meaning in Part II. Part II provides the
              pronunciation and meaning of each Hán-Nôm character. The
              pronunciation section includes the Beijing Mandarin pronunciation
              (transcribed in Pinyin, which the author refers to as Phanh Âm),
              the Sino-Vietnamese pronunciation, and the Vietnamese (Nôm)
              reading. This arrangement significantly reduces the time required
              to look up the pronunciation and meaning of Hán-Nôm characters.
              The book also offers detailed instructions on how to use and look
              up Hán-Nôm characters quickly and efficiently, making it
              accessible even for those who have never studied Hán-Nôm before.
              Notably, by arranging the meaning lookup section in alphabetical
              order based on the Vietnamese pronunciation, readers can
              effortlessly locate the Nôm character they are interested in and
              verify how a modern Vietnamese sound may be represented in Nôm and
              what its meaning is.
            </p>
            <p className="pt-5">
              The dictionary is compact yet packed with valuable information and
              a vast collection of Hán-Nôm characters. It serves as a gateway
              for readers to explore the “mysterious” yet fascinating world of
              Hán-Nôm while also enabling them to study and research the wealth
              of Hán-Nôm documents still preserved in libraries across Vietnam
              and around the world. This is undoubtedly one of the rare and
              valuable books for referencing and self-studying Hán-Nôm that
              anyone passionate about learning these ancient scripts should
              read.
            </p>
            <p className="pt-5">
              This digital version of the{" "}
              <b>
                <i>Nôm and Sino-Vietnamese Pronunciation Guide</i>
              </b>{" "}
              by Antony Trần Văn Kiệm (based on the print publication from Đà
              Nẵng Publishing House in 2004) has been transferred from its
              original home on the Vietnamese Nôm Preservation Foundation
              Website to the Digitizing Việt Nam Website.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div
            className={`${merriweather.className} text-branding-black text-4xl`}
          >
            Lời dẫn
          </div>
          <div className="font-['Helvetica_Neue'] font-light text-lg mt-6">
            <p className="pt-5">
              Cuốn tự điển{" "}
              <b>
                <i>Giúp đọc Nôm và Hán Việt</i>
              </b>{" "}
              của Linh mục Anthony Trần Văn Kiệm được cấu tạo bởi hai phần
              chính: Phần I là phần giới thiệu và liệt kê các bộ thủ dùng viết
              chữ Hán Nôm, và liệt kê các chữ Hán Nôm được sắp xếp theo bộ thủ
              và các nét. Phương pháp sắp xếp chữ Hán Nôm theo bộ thủ giúp cho
              người đọc nhanh chóng tìm được cách phát âm theo âm Hán và âm
              tiếng Việt của một chữ Hán Nôm, qua đó giúp người đọc nhanh chóng
              tìm được nghĩa của chữ Hán Nôm tương ứng trong Phần II. Phần II là
              phần liệt kê cách đọc của từng chữ Hán Nôm và giải thích nghĩa của
              từng chữ. Phần liệt kê cách đọc của một chữ Hán Nôm bao gồm âm Bắc
              Kinh (theo phiên âm Pinjin, tác giả gọi là Phanh Âm), âm Hán Việt
              và âm tiếng Việt (Nôm). Cách biên soạn này giúp người đọc giảm
              thời gian tra cứu cách đọc và nghĩa của từng chữ Hán Nôm. Cuốn
              sách cũng giới thiệu chi tiết cách sử dụng và tra cứu các chữ Hán
              Nôm dễ dàng và nhanh chóng vì vậy có thể giúp cho những người chưa
              học chữ Hán Nôm bao giờ có thể dễ dàng tiếp cận và tra cứu được.
              Đặc biệt với cách sắp xếp phần tra nghĩa theo thứ tự bảng chữ cái
              tiếng Việt và âm đọc tiếng Việt của tác giả, bạn đọc có thể dễ
              dàng tra được chữ Nôm mà bạn muốn biết để kiểm tra xem một chữ đọc
              theo âm tiếng Việt hiện đại có thể được viết bằng chữ Nôm như thế
              nào và có nghĩa ra sao. Cuốn sách{" "}
              <b>
                <i>Giúp đọc Nôm và Hán Việt</i>
              </b>{" "}
              gọn nhẹ nhưng chứa đựng nhiều thông tin và số lượng lớn chữ Hán
              Nôm.
            </p>
            <p className="pt-5">
              Cuốn sách này có thể giúp các bạn đi vào tìm hiểu thế giới Hán Nôm
              đầy “huyền bí” nhưng rất thú vị, và nó cũng có thể giúp các bạn
              tìm hiểu và nghiên cứu được kho tàng tư liệu sách vở Hán Nôm vẫn
              còn nằm trong các thư viện ở Việt Nam và trên thế giới. Có thể
              nói, đây là một trong những cuốn sách quý hiếm dùng để tra cứu và
              tự học chữ Hán Nôm mà các bạn ham muốn học chữ Hán Nôm nên đọc.
            </p>
            <p className="pt-5">
              Phiên bản kỹ thuật số của cuốn{" "}
              <b>
                <i>Giúp đọc Nôm và Hán Việt</i>
              </b>{" "}
              của Linh mục Antony Trần Văn Kiệm (dựa trên ấn bản do Nhà xuất bản
              Đà Nẵng phát hành năm 2004) đã được chuyển từ trang web của Hội
              Bảo tồn Chữ Nôm Việt Nam sang trang web Digitizing Việt Nam.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
