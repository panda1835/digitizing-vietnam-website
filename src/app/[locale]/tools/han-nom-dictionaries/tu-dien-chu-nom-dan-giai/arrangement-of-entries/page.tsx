import { Merriweather } from "next/font/google";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

import localFont from "next/font/local";
const NomNaTong = localFont({
  src: "../../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function ArrangementOfEntries({
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
            Editorial Guide
          </div>
          <div className="font-['Helvetica Neue'] font-light text-lg mt-6">
            <p className="pt-5">
              <b>1.</b> This <i>Chữ Nôm</i> dictionary is organized into two
              columns: the <strong>Chữ Nôm</strong> column and the{" "}
              <strong>Annotations</strong> column. The <i>Chữ Nôm</i> column
              displays the character&apos;s form, pronunciation, and its
              international Unicode encoding (as per ISO standards) or Vcode
              (Vietnam&apos;s national encoding system). The
              <i>Annotations</i> column provides information on character
              structure, meaning, and citations from various literary and
              historical texts. This dictionary contains 9,200 <i>Chữ Nôm</i>{" "}
              characters, directly compiled from 122 carefully selected and
              analyzed <i>Chữ Nôm</i> texts. The primary method for looking up
              characters is by pronunciation (transliterated into the modern
              Vietnamese script), which aligns with contemporary readers&apos;
              habits. However, an additional radical-based index is included at
              the end of the dictionary to facilitate searches by radical, as
              well as to aid cross-referencing between character form and
              pronunciation—an essential aspect of interpreting <i>Chữ Nôm</i>{" "}
              texts.
            </p>
            <p className="pt-5">
              <b>2.</b> In this dictionary, <i>Chữ Nôm</i> characters—including
              both Chinese borrowings and indigenous creations—are the
              fundamental units of description. Vietnamese lexical items related
              to each <i>Chữ Nôm</i> character are also recorded and explained
              in the <i>Annotations</i> section. Characters sharing the same
              pronunciation (as represented in modern Vietnamese script) are
              grouped within a single &quot;section,&quot; separated from other
              pronunciation groups by a horizontal line. These groups are
              arranged alphabetically according to the Vietnamese alphabet.
              Within each homophonic group, characters with similar phonetic
              components are placed together, ordered by increasing stroke
              count. When documenting Chữ Nôm characters in the{" "}
              <strong>Chữ Nôm</strong> column and when citing textual examples
              in the <strong>Annotations</strong> section, the editors have
              strived to maintain the most accurate representation of their
              original forms within the constraints of modern typesetting
              technology.
            </p>
            <p className="pt-5">
              <b>3.</b> The first component of the Annotations section provides
              an analysis of character structure, marked by the symbol{" "}
              <strong>#{"{}"}</strong>. This section explains both{" "}
              <strong>functional composition</strong> (phonetic and semantic
              components) and <strong>structural form</strong>, using symbols
              such as:
            </p>
            <p className="pt-5">
              <span className="s2">⿰</span> (left-right composition){" "}
              <span className="s2">⿱</span> (top-bottom composition),{" "}
              <span className="s2">⿺</span> (enclosing from the side),
            </p>
            <p className="pt-5">
              <span className="s2">⿸</span> (enclosing from the left),
              <span className="s2"> ⿹</span> (enclosing from the right)
            </p>
            <p className="pt-5">
              <span className="s2">⿵</span> (enclosing from above),{" "}
              <span className="s2">⿴</span> (fully enclosed)
              <span className="s2">, etc.</span>
            </p>
            <p className="pt-5">
              In some cases, a Chữ Nôm character may exhibit structural
              ambiguity, indicated by the symbol{" "}
              <strong>
                #{"{}"}|{"{}"}
              </strong>
              , meaning that multiple interpretations are plausible, and a
              definitive classification has not yet been established. If a
              phonetic or semantic component itself is a Chữ Nôm character, its
              pronunciation is italicized.
            </p>
            <p className="pt-5">
              There are instances where the functional structure of a Chữ Nôm
              character is not immediately apparent on the surface but is
              instead embedded at a deeper structural level. For example, the
              true composition of the character{" "}
              <span className={`${NomNaTong.className}`}>𨑮</span> (mười,
              meaning &quot;ten&quot;) is not (F2:{" "}
              <span className={`${NomNaTong.className}`}>⻍</span> &quot;walk
              radical&quot; +{" "}
              <span className={`${NomNaTong.className}`}>⿺什</span>{" "}
              &quot;thập&quot; [ten]), as it might initially seem. Rather, it
              should be analyzed as (F1: mại{" "}
              <span className={`${NomNaTong.className}`}>
                邁 &gt; 迈 &gt; ⻍⿺什
              </span>{" "}
              &quot;thập&quot;), revealing a more complex historical and
              structural evolution.
            </p>
            <p className="pt-5">
              Letter codes such as{" "}
              <strong>A1, A2, B, C1, C2, D1, D2, E1, E2, F1, F2, G1</strong>,
              and <strong>G2</strong> represent different structural categories
              of Chữ Nôm, following the comprehensive classification model
              applied in this dictionary.
            </p>
            <p className="pt-5">
              <b>4.</b> The next component of the <i>Annotations</i> section
              provides a concise definition of the examined <i>Chữ Nôm</i>{" "}
              character, illustrated through textual citations. For characters
              that appear in multiple contexts, distinctions must be made
              between citations based on the degree of variation in meaning:
            </p>
            <ul className="list-disc">
              <li className="ml-10">
                <span className="s2">◎</span> Marks the beginning and separation
                of citation groups where the character&lsquo;s meaning is
                completely different.
              </li>
              <li className="ml-10">
                <span className="s2">〄</span> Separates citation groups where
                the character&apos;s meanings share some similarity.
              </li>
              <li className="ml-10">
                <span className="s2">〇</span> Distinguishes citations within
                the same group where the character&lsquo;s meaning remains
                identical.
              </li>
            </ul>

            <p className="pt-5">
              <b>5.</b> The citations included in the dictionary are presented
              in their original Chữ Nôm form (digitally typeset) and
              transliterated into modern Chữ Quốc Ngữ. When transcribing, cases
              of dual possibilities (&quot;lưỡng khả&quot;) or phonetic shifts
              for poetic or rhythmic purposes are noted. One transcription is
              provided in the main text, while the alternative is enclosed in{" "}
              <strong>parentheses ()</strong> for the reader&apos;s reference.
              For certain cases where pronunciation or meaning is ambiguous, the
              compiler adds explanatory notes in{" "}
              <strong>square brackets []</strong> (in a smaller font size) for
              clarity. Additional notation includes:
              <ul className="list-disc ">
                <li className="ml-10">
                  <strong>*</strong> marks a reconstructed ancient pronunciation
                  when necessary.{" "}
                </li>
                <li className="ml-10">
                  <strong>&gt;</strong> indicates the transformation from one
                  form to another (applied to characters, pronunciation, and
                  meanings).
                </li>
              </ul>
              Abbreviations commonly used in the <i>Annotations</i> section:{" "}
              <ul className="list-disc ">
                <li className="ml-10">
                  <strong>Cđ</strong> - cũng đọc (also read as)
                </li>
                <li className="ml-10">
                  <strong>Cv</strong> - cũng viết (also written as)
                </li>
                <li className="ml-10">
                  <strong>Ss</strong> - so sánh (compare)
                </li>
              </ul>
            </p>
            <p className="pt-5">
              <b>6.</b> A given Vietnamese morpheme (<i>monosyllabic</i> or
              <i>polysyllabic</i>) may be represented by multiple{" "}
              <i>variants</i> in writing. These variants can be categorized as
              follows:
              <ul className="list-disc">
                <li className="ml-10">
                  Structural-functional variants (characters differing in
                  phonetic or semantic components, e.g., <i>Lạy </i>
                  <span className={`${NomNaTong.className}`}>𥛉 - 󰀌</span>,{" "}
                  <i>Tre </i>
                  <span className={`${NomNaTong.className}`}>
                    椥 - 𥯌
                  </span>, <i>Bèo </i>
                  <span className={`${NomNaTong.className}`}>苞 - 䕯</span>,
                  etc.).
                </li>
                <li className="ml-10">
                  Graphical-form variants (characters with different forms but
                  the same phonetic and semantic function, e.g., <i>Ngày </i>
                  <span className={`${NomNaTong.className}`}>
                    𣈗 - 𣈜
                  </span>, <i>Ngồi </i>
                  <span className={`${NomNaTong.className}`}>𡎢 - 𫮋</span>
                  <span className={`${NomNaTong.className}`}> - 𡎥 - 𡎦, </span>
                  <i>Cửa</i>
                  <span className={`${NomNaTong.className}`}>
                    {" "}
                    󰘂 - 𬮌 - 𫔸{" "}
                  </span>
                  , etc.).
                </li>
              </ul>
              This dictionary records all such variants. However, when selecting
              a representative character for reference, readers may prioritize
              based on the following criteria: <strong>(a)</strong> Prefer
              characters that are original Chữ Nôm creations.{" "}
              <strong>(b)</strong> Favor characters with a well-structured
              phonetic-semantic composition and a balanced, compact form.{" "}
              <strong>(c)</strong> Select characters with wider usage in
              historical texts (i.e., those appearing in multiple citations).
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div
            className={`${merriweather.className} text-branding-black text-4xl`}
          >
            Thể lệ biên soạn
          </div>
          <div className="font-['Helvetica Neue'] font-light text-lg mt-6">
            <p className="pt-5">
              <b>1.</b> Đây là một bộ tự điển chữ Nôm được trình bày theo hai
              cột: cột CHỮ NÔM và cột DẪN GIẢI. Ở cột “Chữ Nôm” ghi rõ hình chữ
              Nôm, âm đọc và ký mã quốc tế Unicode (theo quy định của ISO) hoặc
              Vcode (là nội mã của Việt Nam). Ở cột “Dẫn giải” cung cấp các
              thông tin về cấu tạo chữ, nghĩa chữ và những câu trích dẫn từ
              nhiều tác phẩm và văn bản khác nhau. Tự điển này thu nạp 9.200 chữ
              Nôm được ghi nhận trực tiếp từ 122 văn bản tác phẩm Nôm đã được
              lựa chọn và khảo sát. Tự điển <i>Chữ Nôm dẫn giải </i>chủ yếu tra
              theo âm đọc (ghi theo chữ Quốc ngữ), là cách tra chữ quen thuộc
              của độc giả ngày nay. Song cuối sách cũng có đính kèm một{" "}
              <i>Bảng tra theo bộ thủ</i>, nhằm thỏa mãn nhu cầu tra chữ theo
              bộ, cũng như một số nhu cầu khác liên quan với sự đối chiếu qua
              lại giữa hình chữ và âm chữ, vốn rất quan hệ đến việc giải đọc văn
              bản Nôm.
            </p>
            <p className="pt-5">
              <b>2.</b> Trong tự điển, lấy chữ Nôm (cả chữ mượn Hán và chữ tự
              tạo) làm đơn vị mô tả. Những từ ngữ tiếng Việt liên quan với chữ
              Nôm đang xét cũng được ghi nhận và giải thích ở phần “Dẫn giải”.
              Những chữ Nôm có cùng âm đọc (phân biệt theo chữ Quốc ngữ), được
              sắp xếp vào cùng một “khuôn viên”, ngăn cách với nhóm các chữ có
              âm đọc khác bằng một đường kẻ ngang. Các nhóm chữ được sắp xếp lần
              lượt theo trật tự chữ cái ABC của chữ Quốc ngữ. Trong nội bộ một
              nhóm chữ cùng âm, những chữ có phần biểu âm giống nhau thì được
              xếp gần nhau theo thứ tự từ ít nét đến nhiều nét. Khi ghi nhận các
              hình chữ Nôm vào cột “Chữ” cũng như khi trích các câu dẫn từ văn
              bản cụ thể vào phần “Dẫn giải”, soạn giả cố gắng phản ảnh sát đúng
              hình thể vốn có của chúng trong điều kiện kỹ thuật cho phép.
            </p>
            <p className="pt-5">
              <b>3.</b> Thông tin về cấu tạo chữ là nội dung đầu tiên ở phần
              “Dẫn giải”. Thông tin này được đánh dấu bằng các ký hiệu #{"{}"},
              trong đó trình bày về cấu trúc chức năng (biểu âm, biểu ý) và cả
              cấu trúc hình thể của chữ, như:
            </p>
            <p className="pt-5">
              <span className="s2">⿰</span> (phải trái){" "}
              <span className="s2">⿱</span> (trên dưới),{" "}
              <span className="s2">⿺</span> (ôm bên),
            </p>
            <p className="pt-5">
              <span className="s2">⿸</span> (che trái),
              <span className="s2"> ⿹</span> (che phải)
            </p>
            <p className="pt-5">
              <span className="s2">⿵</span> (bọc trên),{" "}
              <span className="s2">⿴</span> (bọc kín)
              <span className="s2">, v.v.</span>
            </p>
            <p className="pt-5">
              Có khi, với một chữ Nôm nào đó ta có thể ghi nhận tình trạng
              “lưỡng khả”: #{"{}"}|{"{}"}, nghĩa là cả hai cách phân tích đều có
              phần hợp lý, tạm thời chưa nên quyết đoán một bề. Khi gặp một
              thành tố biểu âm hay biểu ý là một chữ Nôm, thì âm đọc chữ Nôm này
              được in nghiêng.
            </p>
            <p className="pt-5">
              Cũng có khi cấu trúc chức năng của một chữ Nôm không thể hiện ở bề
              nổi trực giác, mà ẩn ngầm trong chiều sâu của nó, như cấu trúc
              thực sự của chữ{" "}
              <span className={`${NomNaTong.className}`}>𨑮</span> <i>mười</i>{" "}
              không phải là (F2: xước{" "}
              <span className={`${NomNaTong.className}`}>⻍⿺什</span>thập), mà
              phải là (F1: mại{" "}
              <span className={`${NomNaTong.className}`}>
                邁 &gt; 迈 &gt; ⻍⿺什
              </span>
              thập).
            </p>
            <p className="pt-5">
              Những ký hiệu chữ cái như{" "}
              <strong>A1, A2, B, C1, C2, D1, D2, E1, E2, F1, F2, G1, G2</strong>{" "}
              là đại diện cho các loại cấu trúc chữ Nôm, theo mô hình tổng quát
              được áp dụng trong tự điển này.
            </p>
            <p className="pt-5">
              <b>4.</b> Thông tin tiếp theo ở phần “Dẫn giải” là giải nghĩa một
              cách ngắn gọn cho chữ Nôm đang xét, thể hiện qua các câu dẫn. Với
              những chữ có nhiều câu dẫn khác nhau, cần phải phân biệt các câu
              dẫn mà trong đó chữ đang xét có phân biệt ít hoặc nhiều về nghĩa
              chữ:
            </p>
            <ul className="list-disc pt-5">
              <li className="ml-10">
                Dấu <span className="s2">◎</span> dùng để mở đầu và ngăn cách
                giữa các nhóm câu dẫn mà nghĩa chữ đó hoàn toàn khác nhau.
              </li>
              <li className="ml-10">
                Dấu <span className="s2">〄</span> dùng để ngăn cách giữa các
                nhóm câu dẫn mà nghĩa chữ đó ít nhiều có nét giống nhau.
              </li>
              <li className="ml-10">
                Dấu <span className="s2">〇</span> là để ngăn cách các câu dẫn
                trong cùng một nhóm mà chữ đang xét có nghĩa hoàn toàn như nhau.
                Nếu có nhiều câu dẫn như thế, thì thứ tự của chúng trên đại thể
                căn cứ vào niên đại sớm muộn của tác phẩm được trích dẫn. Để
                tránh rườm rà, với cùng một nghĩa thì mỗi văn bản Nôm nói chung
                (trừ vài trượng hợp cần thiết) chỉ được trích dẫn một câu mà
                thôi.
              </li>
            </ul>

            <p className="pt-5">
              <b>5.</b> Các câu dẫn được đưa vào tự điển dưới dạng nguyên văn
              chữ Nôm (qua chế bản vi tính) và được phiên chuyển sang chữ Quốc
              ngữ hiện hành. Khi phiên âm, đôi khi gặp những trường hợp “lưỡng
              khả”, hoặc biến âm để hiệp vần, thì soạn giả xin ghi nhận một cách
              và cách còn lại thì ghi trong ngoặc đơn () để độc giả tiện bề lựa
              chọn sử dụng. Với một số trường hợp mà về mặt âm đọc hay nghĩa chữ
              có phần khúc mắc, soạn giả cố gắng ghi chú thêm tại chỗ trong
              ngoặc vuông [] (cỡ nhỏ) cho dễ hiểu hơn. Dấu * chỉ báo hình thức
              tái lập âm đọc cổ (khi cần), và dấu &gt; chỉ báo sự diễn biến từ
              hình thức này sang hình thức kia (áp dụng cho cả hình chữ, âm chữ
              và nghĩa chữ). Một số chữ viết tắt được dùng ở phần Dẫn giải là:{" "}
              <i>Cđ - </i>cũng đọc; <i>Cv - </i>cũng viết; <i>Ss</i> - so sánh.
            </p>
            <p className="pt-5">
              <b>6.</b> Với một ngữ tố (từ đơn tiết hoặc hình tiết) tiếng Việt
              có thể được thể hiện trên văn tự bằng nhiều <i>dị thể</i> (xét
              theo “cấu trúc chức năng” gồm những ký tự biểu âm biểu ý khác
              nhau, ss. <i>Lạy </i>
              <span className={`${NomNaTong.className}`}>𥛉 - 󰀌</span>{" "}
              <i>Tre </i>
              <span className={`${NomNaTong.className}`}>椥 - 𥯌</span>,{" "}
              <i>Bèo </i>
              <span className={`${NomNaTong.className}`}>苞 - 䕯</span> v.v.)
              hoặc nhiều <i>biến thể</i> (xét theo “cấu trúc hình thể” khác nhau
              của chữ, ss. <i>Ngày </i>
              <span className={`${NomNaTong.className}`}>𣈗 - 𣈜</span>,{" "}
              <i>Ngồi </i>
              <span className={`${NomNaTong.className}`}>𡎢 - 𫮋</span>
              <span className={`${NomNaTong.className}`}> - 𡎥 - 𡎦, </span>
              <i>Cửa </i>
              <span className={`${NomNaTong.className}`}> 󰘂 - 𬮌 - 𫔸 </span>
              v.v.). Trong tự điển này tất cả các dị thể và biến thể văn tự như
              thế đều được ghi nhận. Nếu cần ghi nhớ một vài hình chữ đại diện
              cho một ngữ tố nào đó, độc giả có thể tự lựa chọn lấy theo các
              tiêu chí ưu tiên như sau: (a) Ưu tiên lựa chọn hình chữ là chữ Nôm
              tự tạo. (b) Ưu tiên lựa chọn hình chữ có cấu trúc chức năng hợp lý
              và cấu trúc hình thể gọn gàng, cân đối. (c) Ưu tiên lựa chọn hình
              chữ được sử dụng phổ biến hơn (có nhiều câu dẫn trong các văn bản
              khác nhau).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
