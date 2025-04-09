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
              To date, research and compilations of Nôm characters have obtained
              many important achievements. I would like to discuss briefly two
              Nôm dictionaries that have appeared in recent years and are most
              related to <i>Nôm characters with Quotations and Annotations</i>:
            </p>
            <p className="pt-5">
              (a) <i>Tự điển Chữ Nôm </i>(<i>Dictionary of Nôm characters</i>):
              The collective work by the Institute of Hán Nôm Studies, under
              Nguyễn Quang Hồng as the chief editor, published by the Publisher
              of Education in Hà Nội in 2006. The book contains 1.546 pages, and
              the size is 16x24 cm. This is the first Nôm characters dictionary
              in which quotations from Nôm works (almost 50 texts) are provided
              for each character. It has been highly reviewed in recent years.
              This dictionary has more characters than the Nôm dictionaries
              preceding it, however it is still not fully plentiful (as there
              are 7.888 glyphs with 12.000 units described). For each character,
              there is explanation and analysis of word structure. However,
              there are still places that are not accurate or entirely rational.
              In the context of that period, the editorial board could not
              provide quotations in the original Nôm characters, but only in
              Quốc ngữ transliteration.
            </p>
            <p className="pt-5">
              (b). <i>Tự điển Chữ Nôm trích dẫn</i> (
              <i>Dictionary of Nôm characters with quotations</i>): The
              collective work compiled by the Institute of Vietnamese Studies in
              the United States (including 7 co-authors), published by the
              Institute of Vietnamese Studies, printed in Taiwan, in 2009, 1.708
              pages, size 19x26 cm. The authors collected data using computers,
              and for the first time provided quotations in the original Nôm
              characters (with standard and accurate Nôm fonts created by the
              author) accompanied by Quốc Ngữ transliterations. The number of
              Nôm texts used is larger (60 texts) with many works on Nôm from
              the South of Vietnam. Although being presented as a dictionary,
              this work has no explanations for Nôm characters and there is no
              structural analysis of each character.
            </p>
            <p className="pt-5">
              Recognizing the advantages and disadvantages of previous works and
              the need to apply new approaches and methods has led me to compile{" "}
              <i>Nôm Characters with Quotations and Annotations</i>. My wish is
              to contribute to society a new-style dictionary of Nôm characters,
              with higher capacity and quality than preceding dictionaries.
            </p>
            <p className="pt-5">
              For basic understanding of the subject, the book{" "}
              <i>Khái luận văn tự học Chữ Nôm </i>(
              <i>An Introduction to Nôm characters Grammatology</i>) (Nguyễn
              Quang Hồng, Publisher of Education, Hồ Chí Minh city, 2008, 538
              pages) has been available. In this book, the characteristics of
              chữ Nôm are determined from a diachronic perspective and,
              especially, new classification and concepts of the structures and
              functional environments of Nôm characters are provided
              (distinguishing between <i>formal</i> structures and{" "}
              <i>functional</i> structures, <i>deep</i> structures and{" "}
              <i>surface</i> structures). All these are very necessary for the
              selection, explanation, transliteration of texts, and also for the
              analysis and classification of Nôm characters structures in the
              dictionary. This system of textual theories was not fully
              developed when the author was working as the chief editor on the
              dictionary mentioned in (A), and it is now applied for the first
              time in the compilation of{" "}
              <i>Chữ Nôm with Quotations and Annotations</i>.
            </p>
            <p className="pt-5">
              For materials, the author began by collecting Nôm characters
              texts. After that the author selected 124 documents (many times
              more than the number of documents used in previous dictionaries)
              of various formats and belonging to different time periods. For
              famous Nôm works, the author sometimes used two or three different
              texts. He solely performed all the steps of this work on the
              computer (except some steps in the final stage), thereby avoiding
              the problem of multiple errors in consistency that can occur when
              many people are working on a text.
              <span className="">  </span>Besides, we have recognized and put in
              the <i>Appendix</i> section more character forms and
              pronunciations presented in the two well-known dictionaries of P.
              de Béhaine (1772) and J.L. Taberd (1838).{" "}
            </p>
            <p className="pt-5">
              In this dictionary, the reader first looks up a Nôm character
              based on pronunciation (known or predicted). Corresponding to each
              modern Vietnamese syllable, there will be tens of different
              characters. Each character is a descriptive unit consisting of two
              columns: (a) A <i>Chữ Nôm</i> column identifying the glyph,
              pronunciation, and code of the character (according to Unicode or
              Vcode). (b) An explanation column consisting of structural
              analysis of the character and explanation of meaning. All
              different syllables (corresponding to one or several Nôm
              Characters), are arranged according to the alphabet of Quốc Ngữ.
              To look up an unfamiliar character for which one does not know or
              cannot predict the pronunciation, one can first look up the
              character in <i>Chữ Nôm Look-Up Table by Radicals</i>, then go to
              the page having that pronunciation.
            </p>
            <p className="pt-5">
              In the process of compiling this dictionary, the author used all
              the Nôm and Hán fonts currently available for computers, with the
              main font being <i>Nom Na Tong. </i>This dictionary gathered 9.200
              different Nôm glyphs (not including the 250 characters in the{" "}
              <i>Appendix </i>
              section), corresponding to 14.519 pronunciations documented in
              contemporary Vietnamese national script (based on latin alphabet,
              chữ Quốc Ngữ), 3.000 of which were constructed by the author and
              had never been presented in the available Nôm fonts and
              dictionaries. For the modifications of these “new” Nôm characters,
              the author has received sponsorship, both in terms of human
              resources and materials, from the
              <i> Nôm Preservation Foundation</i> (United States).
              <span className="">  </span>The <i>Nôm Preservation Foundation</i>{" "}
              (in the United States) has supported the entire expense not only
              the regard of publishing but also for the printing of{" "}
              <i>Nôm characters with Quotations and Annotations.</i> Just
              because of this, before welcoming the dictionary to come on the
              scene, the author would like to express his profound gratitude to
              this organization and the employees of its office in Hanoi, the{" "}
              <i>Nôm Na</i> group.
            </p>
            <p className="pt-5">
              The author also sincerely thanks all his colleagues at the
              Institute of Hán Nôm Studies and the Literature Department of the
              Hanoi University of Humanities and Social Sciences for having
              provided some rare and valuable Nôm characters materials, helping
              to enrich the source of materials of this dictionary.
            </p>
            <p className="pt-5">
              Finally, the author is honored that the Social Sciences Publishing
              House (Vietnam Academy of Social Sciences) with the{" "}
              <i>Nôm Preservation Foundation</i> (United States) has co-operated
              to assume responsibility in publishing{" "}
              <i>Nôm characters with Quotations and Annotations</i> and
              introducing it to readers in this country as well as abroad.
            </p>
            <p className="pt-5">
              The author hopes that the readers of this dictionary are not only
              researchers in the Hán Nôm areas, but also all those who would{" "}
              <span className="s2">
                like to find traces of the language and writing system,
                literature and culture of the Vietnamese in the distant past,
                but still extremely close to
              </span>{" "}
              today’s life. 
            </p>
            <p className="pt-5">
              Although the author has tried his best for many years to realize
              this work with high expectation, mistakes are inevitable. The
              author hopes to receive forgiveness and instructive feedback from
              the readers.
            </p>
            <p className="pt-5">
              <br />
            </p>
            <p className="pt-5">
              <i>Author</i>
            </p>
            <p className="pt-5">Professor NGUYỄN QUANG HỒNG</p>
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
              Cho đến hiện nay, công cuộc nghiên cứu và biên soạn về chữ Nôm đã
              đạt được nhiều thành tựu khả quan. Để giản tiện, chỉ xin điểm qua
              hai bộ tự điển chữ Nôm xuất hiện trong những năm gần đây và có
              liên quan nhiều hơn cả với bộ <i>Tự điển</i>{" "}
              <i>Chữ Nôm dẫn giải </i>này của chúng tôi:
            </p>
            <p className="pt-5">
              (A). <i>Tự điển chữ Nôm. </i>Công trình biên soạn tập thể của Viện
              Nghiên cứu Hán Nôm, do Nguyễn Quang Hồng chủ biên. NXB Giáo dục,
              Hà Nội, 2006. Sách dày 1.546 tr., khổ 16x24. Đây là tự điển chữ
              Nôm đầu tiên trong đó mỗi đơn vị chữ được nêu những câu dẫn cụ thể
              từ tác phẩm Nôm (gần 50 văn bản). Nó đã được bạn đọc đánh giá cao
              trong mấy năm qua. Số lượng chữ cũng nhiều hơn các tự điển có
              trước, song chưa thật phong phú (tất cả có 7.888 hình chữ với hơn
              12.000 đơn vị miêu tả). Với mỗi chữ đều cho giải nghĩa và phân
              tích cấu trúc của chữ, song cũng có chỗ chưa được chính xác, chưa
              thật hợp lý. Trong điều kiện lúc đó, nhóm biên soạn đã không dẫn
              được nguyên văn chữ Nôm, mà chỉ phiên âm theo chữ quốc ngữ.{" "}
            </p>
            <p className="pt-5">
              (B). <i>Tự điển chữ Nôm trích dẫn.</i> Công trình biên soạn tập
              thể của Viện Việt học tại Hoa Kỳ (gồm 7 đồng tác giả). Viện Việt
              học ấn hành. In tại Đài Loan, 2009, dày 1.708 trang, khổ 19x26.
              Các tác giả đã thu nhập dữ liệu trực tiếp bằng máy tính, lần đầu
              tiên trích dẫn các câu theo nguyên văn chữ Nôm (với phông chữ Nôm
              tự tạo khá chuẩn xác) và kèm theo phiên âm chữ quốc ngữ. Số lượng
              văn bản Nôm được dùng nhiều hơn (gồm 69 văn bản) với nhiều tác
              phẩm Nôm ở trong Nam. Gọi là tự điển, nhưng công trình này không
              hề giải nghĩa cho các chữ Nôm và hầu như không phân tích cấu trúc
              của từng chữ.
            </p>
            <p className="pt-5">
              {" "}
              Kế thừa có chọn lọc những điểm khả thủ và khắc phục những hạn chế
              và sai sót trong các công trình biên soạn có trước, áp dụng những
              cách tiếp cận và xử lý mới mà chúng tôi nhận thức được, chính là
              đòi hỏi bức thiết dẫn dắt chúng tôi đi vào biên soạn công trình{" "}
              <i>Tự điển Chữ Nôm dẫn giải </i>này, với mong muốn cống hiến cho
              xã hội một bộ tự điển chữ Nôm kiểu mới, với dung lượng lớn hơn và
              chất lượng cao hơn trước.
            </p>
            <p className="pt-5">
              Về phần nhận thức đối tượng, chúng tôi có chuyên luận{" "}
              <i>Khái luận văn tự học Chữ Nôm</i> (Nguyễn Quang Hồng, NXB Giáo
              dục, Tp.Hồ Chí Minh, 2008) làm chỗ dựa. Trong chuyên luận này,
              chúng tôi đã xác định được những đặc điểm của chữ Nôm theo cách
              nhìn lịch đại và đặc biệt là đưa ra cách phân loại mới và quan
              niệm mới về cấu trúc của chữ Nôm (phân biệt cấu trúc hình thể và
              cấu trúc chức năng, cấu trúc chiều sâu và cấu trúc bề mặt), và cả
              về môi trường hành chức của chữ Nôm. Đó là những gì rất cần thiết
              cho việc xử lý các vấn đề về lựa chọn văn bản, về giải nghĩa và
              phiên âm, về phân tích và xếp loại cấu trúc chữ Nôm trong tự điển
              này. Hệ thống lý thuyết văn tự này chưa hình thành đầy đủ khi
              chúng tôi chủ biên tự điển (A) nói trên, và đây là lần đầu tiên
              được áp dụng vào công việc biên soạn bộ <i>Chữ Nôm dẫn giải</i>{" "}
              này.
            </p>
            <p className="pt-5">
              Về phần tư liệu, chúng tôi trực tiếp bắt tay làm từ đầu công việc
              sưu tầm các văn bản chữ Nôm. Từ đó lựa chọn ra 124 đơn vị văn bản,
              (gấp bội so với các tự điển có trước) thuộc nhiều thời kỳ khác
              nhau, thuộc nhiều lĩnh vực văn hóa xã hội khác nhau, và thuộc
              nhiều loại hình văn bản khác nhau. Với những tác phẩm Nôm nổi
              tiếng, chúng tôi sử dụng không chỉ 1, có khi là 2 thậm chí 3 văn
              bản khác nhau. Ngoài ra, trong phần <i>Phụ lục, </i>chúng tôi ghi
              nhận thêm một số hình chữ và âm đọc khác được phản ánh qua hai bộ
              tự điển nổi tiếng của P. de Béhaine (1772) và của J.L. Taberd
              (1838). Bộ tự điển này của chúng tôi thu nạp được 9.200 hình chữ
              Nôm khác nhau (chưa kể gần 250 chữ ở phần <i>Phụ lục</i>), tương
              ứng với 14.519 âm đọc ghi theo chữ quốc ngữ, trong đó có tới gần
              3.000 chữ Nôm tự tạo chưa hề có mặt trong các tự điển và các phông
              chữ Nôm hiện dùng.
            </p>
            <p className="pt-5">
              Trong nội dung chính của tự điển này, người đọc trước hết tìm kiếm
              chữ Nôm theo âm đọc (đã biết trước hoặc theo dự đoán). Tương ứng
              với từng âm tiết tiếng Việt hiện đại, sẽ có từ một đến hàng chục
              chữ Nôm khác nhau. Mỗi chữ là một đơn vị miêu tả, theo 2 cột: (a)
              Cột <i>Chữ Nôm</i> xác nhận hình chữ, âm đọc và ký mã của chữ
              (theo Unicode hoặc Vcode). (b) Cột <i>Dẫn giải </i>bao gồm: Phân
              tích cấu trúc của chữ. Tiếp đến là giải nghĩa chữ kèm theo những
              câu dẫn cụ thể. Các âm tiết khác nhau (tương ứng với một hoặc một
              số chữ Nôm) sẽ được sắp xếp theo thứ tự ABC của chữ quốc ngữ. Khi
              gặp những chữ lạ, mà người đọc không biết chắc và không dự đoán
              được âm đọc của nó, thì có thể tra tìm chữ đó ở{" "}
              <i>Bảng tra chữ Nôm theo bộ thủ</i>, rồi lần giở đến trang có âm
              đọc được ghi nhận cho chữ đó.{" "}
            </p>
            <p className="pt-5">
              Trong quá trình biên soạn, tác giả đã sử dụng các bộ phông chữ Nôm
              và cả chữ Hán hiện có, chuyên dùng cho máy tính, mà chủ yếu là bộ
              phông <i>Nôm Na Tống</i>. Tác giả đã tự mình thực hiện công trình
              này trên máy tính trong tất cả các khâu (trừ một số khâu ở phần
              hậu kỳ). Công việc vẽ bổ sung những chữ Nôm chưa có sẵn trong các
              bộ phông hiện dùng, lập bảng tra cứu chữ Nôm theo bộ thủ, cũng như
              thực hiện một loạt các thao tác kỹ thuật khác ở giai đoạn hậu kỳ
              để hoàn thiện chế bản in ấn cho công trình này, đã nhận được sự hỗ
              trợ về nhân lực và cả vật lực của Hội Bảo tồn Di sản Chữ Nôm (Hoa
              Kỳ). Nhóm Nôm Na của Hội ở Hà Nội cùng với tác giả đã bỏ nhiều tâm
              sức trong suốt hơn một năm để thực hiện công việc phức tạp này.
            </p>
            <p className="pt-5">
              {" "}
              Không chỉ trong khâu chế bản, mà cả trong việc in ấn bộ{" "}
              <i>Tự điển chữ Nôm dẫn giải </i>này, chúng tôi đã nhận được sự hỗ
              trợ quý báu của Hội Bảo tồn Di sản Chữ Nôm (Hoa Kỳ). Chính vì lẽ
              đó, trước khi đón mừng bộ tự điển ra mắt, tại đây, soạn giả xin
              bày tỏ lòng biết ơn sâu sắc tới quý Hội (http:// www.
              nomfoundation.org) và với cả các đồng nghiệp trong nhóm{" "}
              <i>Nôm Na </i>thuộc Văn phòng của Hội tại Hà Nội.
            </p>
            <p className="pt-5">
              {" "}
              Tác giả cũng chân thành cảm ơn các đồng nghiệp của mình tại Viện
              Nghiên cứu Hán Nôm và Khoa Văn học Trường Đại học Khoa học Xã hội
              và Nhân văn - Đại học Quốc gia Hà Nội, đã nhiệt tình cung cấp cho
              tác giả một số tư liệu chữ Nôm quý hiếm, góp phần bổ sung và làm
              phong phú thêm nguồn tư liệu cho công trình tự điển này.
            </p>
            <p className="pt-5">
              Cuối cùng, tác giả xin gửi lời cám ơn sâu sắc tới Lãnh đạo Viện
              Hàn lâm Khoa học xã hội Việt Nam đã quan tâm giúp đỡ cho việc in
              ấn, và rất lấy làm hân hạnh được Nhà xuất bản Khoa học xã hội
              (thuộc Viện Hàn lâm Khoa học xã hội Việt Nam) hợp tác với Hội Bảo
              tồn Di sản Chữ Nôm (Hoa Kỳ) đứng ra đảm nhận việc xuất bản bộ tự
              điển <i>Chữ Nôm dẫn giải</i> này, và giới thiệu cùng đông đảo bạn
              đọc trong và ngoài nước.
            </p>
            <p className="pt-5">
              Hy vọng rằng độc giả sách này không chỉ là các nhà nghiên cứu
              thuộc nhiều thế hệ trong lĩnh vực Hán Nôm, mà có lẽ (thậm chí
              trước hết) là tất cả những ai muốn tìm về hình bóng của ngôn ngữ
              và chữ viết, văn chương và văn hóa người Việt trong quá khứ rất
              đỗi xa xôi, mà cũng vô cùng gần gũi với cuộc sống hôm nay.
            </p>
            <p className="pt-5">
              Mặc dù soạn giả đã hết sức cố gắng trong nhiều năm để thực hiện
              công trình với yêu cầu cao, song sức không chiều lòng, sự sai sót
              lầm lẫn chỗ này chỗ khác hẳn là không tránh khỏi. Kính mong quý vị
              độc giả sẵn lòng lượng thứ và chỉ giáo cho.
            </p>
            <p className="pt-5">
              <i>Hà Nội, Mùa Thu năm Nhâm Thìn</i>
            </p>
            <p className="pt-5">22-9-2012</p>
            <p className="pt-5">
              Soạn giả: <b>GS.TSKH Nguyễn Quang Hồng</b>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
