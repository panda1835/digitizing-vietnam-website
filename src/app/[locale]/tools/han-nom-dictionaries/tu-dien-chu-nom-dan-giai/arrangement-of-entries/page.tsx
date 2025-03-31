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
            Arrangement of Entries
          </div>
          <div className="font-['Helvetica_Neue'] font-light text-lg mt-6">
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
              “Dẫn giải”. Thông tin này được đánh dấu bằng các ký hiệu #{},
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
              “lưỡng khả”: #{}|{}, nghĩa là cả hai cách phân tích đều có phần
              hợp lý, tạm thời chưa nên quyết đoán một bề. Khi gặp một thành tố
              biểu âm hay biểu ý là một chữ Nôm, thì âm đọc chữ Nôm này được in
              nghiêng.
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
                邁&gt;迈&gt;⻍⿺什
              </span>
              thập).
            </p>
            <p className="pt-5">
              Những ký hiệu chữ cái như A1,A2, B, C1,C2, D1,D2, E1,E2, F1,F2,
              G1,G2 là đại diện cho các loại cấu trúc chữ Nôm, theo mô hình tổng
              quát được áp dụng trong tự điển này.
            </p>
            <p className="pt-5">
              <b>4.</b> Thông tin tiếp theo ở phần “Dẫn giải” là giải nghĩa một
              cách ngắn gọn cho chữ Nôm đang xét, thể hiện qua các câu dẫn. Với
              những chữ có nhiều câu dẫn khác nhau, cần phải phân biệt các câu
              dẫn mà trong đó chữ đang xét có phân biệt ít hoặc nhiều về nghĩa
              chữ:
            </p>
            <p className="pt-5">
              - Dấu <span className="s2">◎</span> dùng để mở đầu và ngăn cách
              giữa các nhóm câu dẫn mà nghĩa chữ đó hoàn toàn khác nhau.
            </p>
            <p className="pt-5">
              - Dấu <span className="s2">〄</span> dùng để ngăn cách giữa các
              nhóm câu dẫn mà nghĩa chữ đó ít nhiều có nét giống nhau.
            </p>
            <p className="pt-5">
              - Dấu <span className="s2">〇</span> là để ngăn cách các câu dẫn
              trong cùng một nhóm mà chữ đang xét có nghĩa hoàn toàn như nhau.
              Nếu có nhiều câu dẫn như thế, thì thứ tự của chúng trên đại thể
              căn cứ vào niên đại sớm muộn của tác phẩm được trích dẫn. Để tránh
              rườm rà, với cùng một nghĩa thì mỗi văn bản Nôm nói chung (trừ vài
              trượng hợp cần thiết) chỉ được trích dẫn một câu mà thôi.
            </p>
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
              <i>Tre</i>{" "}
              <span className={`${NomNaTong.className}`}>椥 - 𥯌</span>,{" "}
              <i>Bèo</i>
              <span className={`${NomNaTong.className}`}>苞 - 䕯</span> v.v.)
              hoặc nhiều <i>biến thể</i> (xét theo “cấu trúc hình thể” khác nhau
              của chữ, ss. <i>Ngày </i>
              <span className={`${NomNaTong.className}`}>𣈗 - 𣈜</span>,{" "}
              <i>Ngồi </i>
              <span className={`${NomNaTong.className}`}>𡎢 - </span>𫮋
              <span className={`${NomNaTong.className}`}> - 𡎥 - 𡎦, </span>
              <i>Cửa</i>
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
      ) : (
        <div>
          <div
            className={`${merriweather.className} text-branding-black text-4xl`}
          >
            Thể lệ biên soạn
          </div>
          <div className="font-['Helvetica_Neue'] font-light text-lg mt-6">
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
              “Dẫn giải”. Thông tin này được đánh dấu bằng các ký hiệu #{},
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
              “lưỡng khả”: #{}|{}, nghĩa là cả hai cách phân tích đều có phần
              hợp lý, tạm thời chưa nên quyết đoán một bề. Khi gặp một thành tố
              biểu âm hay biểu ý là một chữ Nôm, thì âm đọc chữ Nôm này được in
              nghiêng.
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
                邁&gt;迈&gt;⻍⿺什
              </span>
              thập).
            </p>
            <p className="pt-5">
              Những ký hiệu chữ cái như A1,A2, B, C1,C2, D1,D2, E1,E2, F1,F2,
              G1,G2 là đại diện cho các loại cấu trúc chữ Nôm, theo mô hình tổng
              quát được áp dụng trong tự điển này.
            </p>
            <p className="pt-5">
              <b>4.</b> Thông tin tiếp theo ở phần “Dẫn giải” là giải nghĩa một
              cách ngắn gọn cho chữ Nôm đang xét, thể hiện qua các câu dẫn. Với
              những chữ có nhiều câu dẫn khác nhau, cần phải phân biệt các câu
              dẫn mà trong đó chữ đang xét có phân biệt ít hoặc nhiều về nghĩa
              chữ:
            </p>
            <p className="pt-5">
              - Dấu <span className="s2">◎</span> dùng để mở đầu và ngăn cách
              giữa các nhóm câu dẫn mà nghĩa chữ đó hoàn toàn khác nhau.
            </p>
            <p className="pt-5">
              - Dấu <span className="s2">〄</span> dùng để ngăn cách giữa các
              nhóm câu dẫn mà nghĩa chữ đó ít nhiều có nét giống nhau.
            </p>
            <p className="pt-5">
              - Dấu <span className="s2">〇</span> là để ngăn cách các câu dẫn
              trong cùng một nhóm mà chữ đang xét có nghĩa hoàn toàn như nhau.
              Nếu có nhiều câu dẫn như thế, thì thứ tự của chúng trên đại thể
              căn cứ vào niên đại sớm muộn của tác phẩm được trích dẫn. Để tránh
              rườm rà, với cùng một nghĩa thì mỗi văn bản Nôm nói chung (trừ vài
              trượng hợp cần thiết) chỉ được trích dẫn một câu mà thôi.
            </p>
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
              <i>Tre</i>{" "}
              <span className={`${NomNaTong.className}`}>椥 - 𥯌</span>,{" "}
              <i>Bèo</i>
              <span className={`${NomNaTong.className}`}>苞 - 䕯</span> v.v.)
              hoặc nhiều <i>biến thể</i> (xét theo “cấu trúc hình thể” khác nhau
              của chữ, ss. <i>Ngày </i>
              <span className={`${NomNaTong.className}`}>𣈗 - 𣈜</span>,{" "}
              <i>Ngồi </i>
              <span className={`${NomNaTong.className}`}>𡎢 - </span>𫮋
              <span className={`${NomNaTong.className}`}> - 𡎥 - 𡎦, </span>
              <i>Cửa</i>
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
