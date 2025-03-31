import Image from "next/image";
import { Merriweather } from "next/font/google";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

import localFont from "next/font/local";
const NomNaTong = localFont({
  src: "../../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function ChuNomStructure({
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
            Chữ Nôm Structure
          </div>
          <div className="font-['Helvetica_Neue'] font-light text-lg mt-6">
            <Image
              unoptimized
              src="/images/tu-dien-chu-nom-dan-giai/Chu_Nom_Structure.jpg"
              alt="Chữ Nôm Structure"
              width={800}
              height={600}
              className="pt-5"
            />
            <p className="pt-5">
              <b>
                <i>Thuyết minh sơ đồ:</i>
              </b>
            </p>
            <p className="pt-5">
              <b>
                <i>1.</i>
              </b>{" "}
              Đây là sơ đồ tổng quát về các loại cấu trúc chữ Nôm, được xác lập
              trong sách <i>Khái luận văn tự học Chữ Nôm </i>(Nguyễn Quang Hồng,
              Nxb Giáo dục, 2008). Khi áp dụng cho tự điển{" "}
              <i>Chữ Nôm dẫn giải, </i>chúng tôi có điều chỉnh đôi chút đối với
              loại G (Chữ Nôm đơn tự tạo): G1 và G2 đều là do mượn chữ Hán (cá
              biệt là chữ Nôm có trước) cải biến mà thành, nhưng G1 là cải biến{" "}
              <i>bớt nét, </i>còn G2 là cải biến <i>thêm nét</i>. Ở đây sẽ không
              phân biệt theo tiêu chí “lấy âm” hay “lấy nghĩa”, mặc dù nếu tiếp
              tục phân tích, thì mỗi loại G1 và G2 đều có thể lưỡng phân theo
              tiêu chí âm - nghĩa này.
            </p>
            <p className="pt-5">
              <b>
                <i>2.</i>
              </b>{" "}
              Trong tự đi ển này, những chữ Nôm mang “dấu cá” (
              <span className={`${NomNaTong.className}`}>个</span>) hoặc “dấu
              nháy” (<span className={`${NomNaTong.className}`}>‹</span>) cũng
              được xếp vào loại G2. Như vậy dung lượng và phạm vi các chữ Nôm
              đơn tự tạo (còn gọi là chữ Nôm “đặc chế”) có phần nhiều hơn và
              rộng hơn so với sự hình dung trước đây. Chữ Nôm mang “dấu nháy” có
              khi bắt gặp trong các văn bản khắc in, song chủ yếu được dùng
              trong các văn bản viết tay và có phần tùy tiện. Trong tự điển này
              chỉ thu nạp một số chữ mang “dấu nháy” làm đại diện mà thôi.
            </p>
            <p className="pt-5">
              <b>
                <i>3.</i>
              </b>{" "}
              Loại chữ A2, là những chữ vay mượn chữ Hán lấy cả âm và nghĩa mà
              không đọc theo âm Hán Việt, nếu phân tích kĩ về mặt âm đọc, có thể
              phân biệt hai nhóm: Nhóm (a) gồm những chữ đọc theo âm “Tiền Hán
              Việt”, tức là âm đọc của chữ Hán ấy còn bảo lưu âm cổ Hán ngữ từ
              lâu trước thời Đường Tống (như:{" "}
              <span className={`${NomNaTong.className}`}>務</span> <i>mùa</i>,{" "}
              <span className={`${NomNaTong.className}`}>燭</span> <i>đuốc</i>{" "}
              …), và nhóm (b) là gồm những chữ (như:{" "}
              <span className={`${NomNaTong.className}`}>嘆</span> <i>than</i>,{" "}
              <span className={`${NomNaTong.className}`}>禍</span> <i>vạ</i>, …)
              mà âm đọc có được từ sau khi hình thành âm Hán Việt và tiếp tục
              Việt hóa từ âm Hán Việt (và đôi khi cả từ âm “Tiền Hán Việt”) mà
              ra, tức là âm “Hậu Hán Việt”.
            </p>
            <p className="pt-5">
              <b>
                <i>4.</i>
              </b>{" "}
              Khi phân tích các chữ Nôm ghép tự tạo, gồm các loại “hội âm” “hội
              ý” “hình thanh” thì mô hình phân loại cấu trúc này không chỉ áp
              dụng cho các chữ Nôm có thành tố biểu âm và biểu ý đều là chữ Hán,
              mà cũng áp dụng cho cả những chữ Nôm trong đó có thành tố biểu âm
              hay biểu ý là chữ Nôm có trước. Đối với chữ Nôm là chữ mượn dùng
              một chữ Nôm đồng âm hoặc gần âm (mà khác nghĩa), thì dùng thuật
              ngữ “chuyển dụng” trước khi giải nghĩa chữ này trong các câu dẫn,
              còn cấu trúc của nó thì “trả về” cho chữ Nôm mà nó mượn dùng.
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
            <Image
              unoptimized
              src="/images/tu-dien-chu-nom-dan-giai/Chu_Nom_Structure.jpg"
              alt="Chữ Nôm Structure"
              width={800}
              height={600}
              className="pt-5"
            />
            <p className="pt-5">
              <b>
                <i>Thuyết minh sơ đồ:</i>
              </b>
            </p>
            <p className="pt-5">
              <b>
                <i>1.</i>
              </b>{" "}
              Đây là sơ đồ tổng quát về các loại cấu trúc chữ Nôm, được xác lập
              trong sách <i>Khái luận văn tự học Chữ Nôm </i>(Nguyễn Quang Hồng,
              Nxb Giáo dục, 2008). Khi áp dụng cho tự điển{" "}
              <i>Chữ Nôm dẫn giải, </i>chúng tôi có điều chỉnh đôi chút đối với
              loại G (Chữ Nôm đơn tự tạo): G1 và G2 đều là do mượn chữ Hán (cá
              biệt là chữ Nôm có trước) cải biến mà thành, nhưng G1 là cải biến{" "}
              <i>bớt nét, </i>còn G2 là cải biến <i>thêm nét</i>. Ở đây sẽ không
              phân biệt theo tiêu chí “lấy âm” hay “lấy nghĩa”, mặc dù nếu tiếp
              tục phân tích, thì mỗi loại G1 và G2 đều có thể lưỡng phân theo
              tiêu chí âm - nghĩa này.
            </p>
            <p className="pt-5">
              <b>
                <i>2.</i>
              </b>{" "}
              Trong tự đi ển này, những chữ Nôm mang “dấu cá” (
              <span className={`${NomNaTong.className}`}>个</span>) hoặc “dấu
              nháy” (<span className={`${NomNaTong.className}`}>‹</span>) cũng
              được xếp vào loại G2. Như vậy dung lượng và phạm vi các chữ Nôm
              đơn tự tạo (còn gọi là chữ Nôm “đặc chế”) có phần nhiều hơn và
              rộng hơn so với sự hình dung trước đây. Chữ Nôm mang “dấu nháy” có
              khi bắt gặp trong các văn bản khắc in, song chủ yếu được dùng
              trong các văn bản viết tay và có phần tùy tiện. Trong tự điển này
              chỉ thu nạp một số chữ mang “dấu nháy” làm đại diện mà thôi.
            </p>
            <p className="pt-5">
              <b>
                <i>3.</i>
              </b>{" "}
              Loại chữ A2, là những chữ vay mượn chữ Hán lấy cả âm và nghĩa mà
              không đọc theo âm Hán Việt, nếu phân tích kĩ về mặt âm đọc, có thể
              phân biệt hai nhóm: Nhóm (a) gồm những chữ đọc theo âm “Tiền Hán
              Việt”, tức là âm đọc của chữ Hán ấy còn bảo lưu âm cổ Hán ngữ từ
              lâu trước thời Đường Tống (như:{" "}
              <span className={`${NomNaTong.className}`}>務</span> <i>mùa</i>,{" "}
              <span className={`${NomNaTong.className}`}>燭</span> <i>đuốc</i>{" "}
              …), và nhóm (b) là gồm những chữ (như:{" "}
              <span className={`${NomNaTong.className}`}>嘆</span> <i>than</i>,{" "}
              <span className={`${NomNaTong.className}`}>禍</span> <i>vạ</i>, …)
              mà âm đọc có được từ sau khi hình thành âm Hán Việt và tiếp tục
              Việt hóa từ âm Hán Việt (và đôi khi cả từ âm “Tiền Hán Việt”) mà
              ra, tức là âm “Hậu Hán Việt”.
            </p>
            <p className="pt-5">
              <b>
                <i>4.</i>
              </b>{" "}
              Khi phân tích các chữ Nôm ghép tự tạo, gồm các loại “hội âm” “hội
              ý” “hình thanh” thì mô hình phân loại cấu trúc này không chỉ áp
              dụng cho các chữ Nôm có thành tố biểu âm và biểu ý đều là chữ Hán,
              mà cũng áp dụng cho cả những chữ Nôm trong đó có thành tố biểu âm
              hay biểu ý là chữ Nôm có trước. Đối với chữ Nôm là chữ mượn dùng
              một chữ Nôm đồng âm hoặc gần âm (mà khác nghĩa), thì dùng thuật
              ngữ “chuyển dụng” trước khi giải nghĩa chữ này trong các câu dẫn,
              còn cấu trúc của nó thì “trả về” cho chữ Nôm mà nó mượn dùng.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
