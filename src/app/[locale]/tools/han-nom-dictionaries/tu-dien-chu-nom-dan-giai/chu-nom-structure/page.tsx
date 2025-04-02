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
                <i>Explanation of the classification diagram:</i>
              </b>
            </p>
            <p className="pt-5">
              <b>
                <i>1.</i>
              </b>{" "}
              This diagram provides a comprehensive overview of the structural
              classifications of <i>Chữ Nôm</i>, as established in{" "}
              <i>Khái luận văn tự học Chữ Nôm</i> (Nguyễn Quang Hồng, Education
              Publishing House, 2008). When applying this classification to the
              <i>
                The Dictionary of Nôm Characters with Quotations and Annotations
              </i>
              , we have made slight modifications to Category G (
              <i>Indigenously Created Chữ Nôm</i>). Specifically, both G1 and G2
              originate from modified Chinese characters (with rare cases where
              the <i>Chữ Nôm</i> form predates its Chinese counterpart).
              However, G1 refers to characters with reduced strokes, while G2
              encompasses those with additional strokes. This classification
              does not distinguish based on phonetic borrowing (<i>lấy âm</i>)
              or semantic borrowing (<i>lấy nghĩa</i>), though further analysis
              could subdivide both G1 and G2 along these lines.
            </p>
            <p className="pt-5">
              <b>
                <i>2.</i>
              </b>{" "}
              In this dictionary, <i>Chữ Nôm</i> marked with a
              &quot;fishhook&quot; symbol (
              <span className={`${NomNaTong.className}`}>个</span>) or an
              &quot;angle bracket&quot; symbol (
              <span className={`${NomNaTong.className}`}>‹</span>) are also
              classified under G2. Consequently, the number and scope of
              <i>indigenously created Chữ Nôm</i> (also referred to as
              <i>custom-designed Chữ Nôm</i>) are broader than previously
              assumed. Characters marked with the &quot;angle bracket&quot;
              symbol occasionally appear in printed texts but are primarily
              found in handwritten manuscripts, often used inconsistently. In
              this dictionary, only a representative selection of these
              characters has been included.
            </p>
            <p className="pt-5">
              <b>
                <i>3.</i>
              </b>{" "}
              Category A2 consists of <i>Chữ Nôm</i> borrowed from Chinese,
              retaining both pronunciation and meaning but diverging from{" "}
              <i>Sino-Vietnamese</i>
              pronunciation. A closer examination of their phonetics reveals two
              subgroups: <strong>(a)</strong> Characters pronounced according to{" "}
              <i>Pre-Sino-Vietnamese</i>
              phonetics, preserving ancient Chinese pronunciations that predate
              the Tang and Song dynasties (e.g.,{" "}
              <span className={`${NomNaTong.className}`}>務</span> <i>mùa</i>,{" "}
              <span className={`${NomNaTong.className}`}>燭</span> <i>đuốc</i>{" "}
              …), and <strong>(b)</strong> Characters (e.g.,{" "}
              <span className={`${NomNaTong.className}`}>嘆</span> <i>than</i>,{" "}
              <span className={`${NomNaTong.className}`}>禍</span> <i>vạ</i>, …)
              that underwent further phonetic adaptation after the formation of
              <i>Sino-Vietnamese</i> pronunciation, continuing to be Vietnamized
              from both <i>Sino-Vietnamese</i> and, in some cases,{" "}
              <i>pre-Sino-Vietnamese</i>
              phonetics. These represent <i>post-Sino-Vietnamese</i> phonetic
              adaptations.
            </p>
            <p className="pt-5">
              <b>
                <i>4.</i>
              </b>{" "}
              When analyzing compound <i>Chữ Nôm</i>—including phonetic compound
              (<i>hội âm</i>), semantic compound (<i>hội ý</i>), and
              phono-semantic (<i>hình thanh</i>) structures—this classification
              model applies not only to <i>Chữ Nôm</i>
              in which both phonetic and semantic components are derived from
              Chinese characters but also to cases where one of these components
              is an earlier <i>Chữ Nôm</i> form. For <i>Chữ Nôm</i> created by
              borrowing a homophonic or near-homophonic <i>Chữ Nôm</i> (with a
              different meaning), the term{" "}
              <i>semantic reassignment (chuyển dụng)</i>
              is used before defining the character in contextual examples.
              Structurally, these characters are categorized under the{" "}
              <i>Chữ Nôm</i> from which they were originally borrowed.
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
              Nxb Giáo dục, 2008). Khi áp dụng cho{" "}
              <i>Tự điển Chữ Nôm dẫn giải, </i>chúng tôi có điều chỉnh đôi chút
              đối với loại G (Chữ Nôm đơn tự tạo): G1 và G2 đều là do mượn chữ
              Hán (cá biệt là chữ Nôm có trước) cải biến mà thành, nhưng G1 là
              cải biến <i>bớt nét, </i>còn G2 là cải biến <i>thêm nét</i>. Ở đây
              sẽ không phân biệt theo tiêu chí “lấy âm” hay “lấy nghĩa”, mặc dù
              nếu tiếp tục phân tích, thì mỗi loại G1 và G2 đều có thể lưỡng
              phân theo tiêu chí âm - nghĩa này.
            </p>
            <p className="pt-5">
              <b>
                <i>2.</i>
              </b>{" "}
              Trong tự điển này, những chữ Nôm mang “dấu cá” (
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
