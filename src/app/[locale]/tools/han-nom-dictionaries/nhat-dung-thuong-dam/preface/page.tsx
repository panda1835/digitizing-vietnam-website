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
            Preface
          </div>
          <div className="font-['Helvetica_Neue'] font-light text-lg mt-6">
            <p className="pt-5">
              <b>
                <i>Nhật Dụng Thường Đàm</i>
              </b>{" "}
              is a dictionary composed by Phạm Đình Hổ (1768-1839). This is a
              small Sino-Vietnamese bilingual dictionary, explaining Han script
              based on Nom script and arranged in 32 categories such as:
              Astronomy, Order of morality, Confucianism, Taoism, Buddhism,
              Body, Dwelling-house, Effects, Food, Fruits, Appliances, Weapons,
              Disease, Beasts, Insects etc…Not much terms but it could be
              considered as enough to learn and know common words and phrases.
              This dictionary is also used as a document to compare the
              differences of words by giving explanation the meanings of Han
              script based on Nom script.
            </p>
            <p className="pt-5">
              Bilingual dictionary “Nhật Dụng Thường Đàm” has been kept in the
              National Library of Vietnam presently with the library number is
              R.1726. It was engraved in the Tự Đức 4th year by Đồng Văn Trai
              printing house. In addition to the cover and preface pages, this
              book includes 52 sheets and printed in dó paper. The content is
              divided into 32 categories. Each category is separated into
              various entries. Each entry is divided into 2 parts: one part is
              Han script and another is the explanation part for Han script
              based on Nom script. For example 天Thiên: 羅𡗶is the sky; Nhật
              日:羅𩈘𡗶 is the sun.
            </p>
            <p className="pt-5">
              According to the statistics of researchers, Sino-Vietnamese
              vocabulary accounts for 70% Vietnamese language. Thus, it would be
              really essential for Vietnamese students or foreigners who want to
              study Vietnamese to have a certain knowledge of Sino-Vietnamese
              vocabulary. At the moment, besides a number of specialized
              training schools about Han Nom like: Vietnam National University,
              Hanoi; Vietnam National University Ho Chi Minh city, Hue
              University of Science. The remainders are training institutions
              like universities, specialized colleges of social humanism.
              Generally, most students of these schools must study Han Nom and
              Sino-Vietnamese vocabulary.
            </p>
            <p className="pt-5">
              As an objective of Vietnamese Nom Preservation Foundation (VNPF),
              we continue digitizing the dictionary named “Nhật Dụng Thường Đàm”
              based on the result of “Digital library of Han Nom books”
              cooperated between the National Library of Vietnam (NLV) and The
              Vietnamese Nom Preservation Foundation (VNPF). Hoping that this
              dictionary (digital number: nlvnpf-0693; library number: R.1726)
              is an useful tool for students in general and Han Nom students in
              particular. Especially is for people who start learning Han Nom.
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
              Từ điển{" "}
              <b>
                <i>Nhật Dụng Thường Đàm</i>
              </b>{" "}
              của Phạm Đình Hổ (1768-1839), là bộ tự điển song ngữ Hán -Việt
              nhỏ, giải thích chữ Hán bằng chữ Nôm, xếp theo 32 môn loại như:
              Thiên văn, Luân tự, Nho giáo, Đạo giáo, Thích giáo, Thân thể, Thất
              ốc, Tác dụng, Thực phẩm, Quả thưởng, Đại dụng, Trướng dụng, Du hí,
              Tật bệnh, Cầm thú, Trùng loại v.v... Các từ ngữ tuy không nhiều,
              nhưng có thể nói là tạm đủ để đọc biết các chữ thông thường. Đó
              cũng là một tài liệu mà chúng ta có thể dùng so sánh để thấy những
              chỗ khác biệt trong cách chú và giải nghĩa chữ Hán bằng chữ Nôm.
            </p>
            <p className="pt-5">
              Từ điển song ngữ “Nhật Dụng Thường Đàm” hiện đang lưu giữ tại Thư
              viện Quốc gia Việt Nam, mang kí hiệu R.1726, được khắc in năm Tự
              Đức thứ 4 (1851), do nhà in Đồng Văn Trai tàng bản. Ngoài trang
              bìa và bài tựa, sách gồm 52 tờ khắc in trên dấy dó. Nội dung được
              chia làm 32 môn loại, mỗi môn loại chia thành nhiều mục từ khác
              nhau; mỗi mục từ được chia làm 2 phần là chữ Hán và giải thích
              nghĩa bằng chữ Nôm:天 Thiên: 羅𡗶là trời; Nhật 日:羅𩈘𡗶 là mặt
              trời …
            </p>
            <p className="pt-5">
              Theo như thống kê của các nhà nghiên cứu, Từ Hán Việt trong tiếng
              Việt chiếm khoảng 70 %. Do đó việc học tập và hiểu biết cặn kẽ từ
              Hán Việt đối với học sinh, sinh viên và những người ngoại quốc học
              tiếng Việt là rất cần thiết. Hiện nay, ở Việt Nam ngoài một số cơ
              sở đào tạo chuyên sâu về ngành cổ học Hán Nôm như: Đại học Quốc
              Gia Hà Nội, Đại học Quốc gia TPHCM, Đại học khoa học Huế, số còn
              lại các cơ sở đào tạo Đại học, cao đẳng chuyên ngành về xã hội
              nhân văn nói chung phần lớn sinh viên đều phải học Hán Nôm, và Từ
              Hán Việt.
            </p>
            <p className="pt-5">
              Nằm trong kế hoạch mục tiêu của Hội Bảo tồn Di sản chữ Nôm, chúng
              tôi tiếp tục thực hiện số hoá hoàn toàn quyển từ điển “Nhật Dụng
              Thường Đàm” dựa trên kết quả “Dự án số hoá thư tịch cổ văn hiến
              Hán Nôm” giữa Thư viện Quốc gia Việt Nam và Hội Bảo tồn Di sản chữ
              Nôm. Tài liệu số (mã số số hoá : nlvnpf-0693 ; mã số thư viện :
              R.1726) này hy vọng là một công cụ hữu ích đối với học sinh, sinh
              viên Hán Nôm, ngôn ngữ nói chung và các ngành khoa học xã hội nhân
              văn nói riêng. Đặc biệt là đối với những người đang bắt đầu học
              Hán Nôm.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
