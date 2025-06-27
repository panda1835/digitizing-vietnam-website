import { Merriweather } from "next/font/google";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export default function Abbreviations({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div>
      <div className={`${merriweather.className} text-branding-black text-4xl`}>
        {locale === "en" ? "References" : "Tài liệu tham khảo"}
      </div>
      <div className="mt-10 font-['Helvetica Neue'] text-lg font-light">
        <ol className="list-decimal pl-6 space-y-2">
          <li className="li1">
            Mark <b>Alves</b>. (2009).
            <i>
              Loanwords in the World&apos;s Languages: A Comparative Handbook.
            </i>{" "}
            (Edited by Martin Haspelmath). De Gruyter Mouton. Germany. p.617-
            637.
          </li>
          <li className="li1">
            Mark <b>Alves</b>. (2012).{" "}
            <i>Notes on Grammatical Vocabulary in Centrai Vietnamese</i>.
            Journal of the Southeast Asian Linguistic Society. 5/2012. p.1- 11.
          </li>
          <li className="li1">
            Đào Duy <b>Anh</b> (phiên chú). (1976). <i>Quốc âm thi tập</i>.
            Trong “Nguyễn Trãi toàn tập”. Nxb KHXH. H.
          </li>
          <li className="li1">
            Đào Duy <b>Anh</b>. (1987). <i>Từ điển Truyện Kiều.</i> Phan Ngọc bổ
            sung sửa chữa. Nxb KHXH. H.{" "}
          </li>
          <li className="li1">
            Trần Kim <b>Anh</b>, Hoàng Thị Ngọ. (1987).{" "}
            <i>
              Vài nét về tình hình ghi từ lấp láy bằng chữ Nôm trong Quốc âm thi
              tập của Nguyễn Trãi.
            </i>{" "}
            TC Hán Nôm 2/1987.
          </li>
          <li className="li1">
            Trần Kim <b>Anh</b>. (1995).{" "}
            <i>Về nghĩa của từ &quot;Triện hương&quot; trong thơ Nôm</i>. TC Hán
            Nôm. Số 2 (23)/ 1995. Tr.51- 52.
          </li>
          <li className="li1">
            Gabriel <b>Aubaret</b>. (1861).{" "}
            <i>Vocabulaire Français- Annamite et Annamite - Français</i>. Imp.
            de la Mission Catholique. Bangkok.
          </li>
          <li className="li1">
            Hoàng Triều <b>Ân</b>. (2003). <i>Từ điển chữ Nôm Tày</i>. Nxb KHXH.
            H.
          </li>
          <li className="li1">
            William Hubbard <b>Baxter</b>. (1992).{" "}
            <i>A Handbook of Old Chinese Phonology</i>. Mouton de Gruyter.
            Berlin - NewYork.
          </li>
          <li className="li1">
            Pierre Pegneaux de <b>Béhaine </b> (Bá Đa Lộc Bỉ Nhu). (1772-1772),{" "}
            <i>Dictionarium Anamitico Latinum</i> 1772 - 1773 (
            <i>Tự vị An nam- La tinh</i>). bản chép tay. tb. (1999). Hồng Nhuệ
            Nguyễn Khắc Xuyên dịch và giới thiệu. Nxb.Trẻ. Tp. HCM.
          </li>
          <li className="li1">
            Nguyễn <b>Bỉnh</b> 阮秉 (dịch quốc ngữ và viết tựa). 1909.{" "}
            <i>Ngũ thiên tự dịch quốc ngữ</i> 五千字譯國語. Liễu Chàng Đường in.
            Duy Tân Kỷ Dậu.{" "}
          </li>
          <li className="li1">
            Jean <b>Bonet</b>. (1889). 南國音字彙合解大法國音 (
            <i>Dictionnaire Annamite-Français</i>). Paris Imprimerie Nationale.
            Ernest Leroux, Éditeur, Rue Bonaparte, 28. M DCCC XCIX .{" "}
          </li>
          <li className="li1">
            Nguyễn Tài <b>Cẩn</b>. (1979),{" "}
            <i>Nguồn gốc và quá trình hình thành cách đọc Hán Việt</i>, NXB
            KHXH, H; tái bản: NXB Đại học Quốc gia Hà Nội, 2002.
          </li>
          <li className="li1">
            Nguyễn Tài <b>Cẩn</b>. (1986).{" "}
            <i>
              Thử tìm cách xác định tác giả một số bài thơ hiện chưa rõ của
              Nguyễn Trãi hay Nguyễn Bỉnh Khiêm
            </i>
            . TC Văn học, số 03/1986.
          </li>
          <li className="li1">
            Nguyễn Tài <b>Cẩn</b>. (1997).{" "}
            <i>Giáo trình lịch sử ngữ âm tiếng Việt</i>. Nxb Giáo dục. H.
          </li>
          <li className="li1">
            Nguyễn Tài <b>Cẩn</b>, N.V. Stankevitch. (2001).{" "}
            <i>Thử phân định thơ Nôm Nguyễn Trãi và Nguyễn Bỉnh Khiêm</i>. Trong
            “Một số chứng tích về ngôn ngữ - văn tự - văn hóa”. Nxb. Đại học
            Quốc gia Hà Nội. H.
          </li>
          <li className="li1">
            An <b>Chi</b>. (2006). <i>Chuyện Đông chuyện Tây</i> (T1- T6). Nxb
            Trẻ. Tp HCM. tr.131 - 136.{" "}
          </li>
          <li className="li1">
            An <b>Chi</b>. (2012). <i>Gốc và nghĩa của từ CHỈN</i>. Năng Lượng
            Mới số 125. tr. 1-6.
          </li>
          <li className="li1">
            Thiều <b>Chửu</b>. (1999). 漢越字典 <i>Hán Việt tự điển</i>. Nxb
            VHTT. H.
          </li>
          <li className="li1">
            Huình Tịnh Paulus <b>Của</b>. (1895 - 1896). “大南國音字彙”
            <i> Đại Nam quấc âm tự vị</i>. SaiGon Imprimerie REY, CURIOL &amp;
            Cie, 4, rue d’Adran, 4.; Nxb.Trẻ.1998 (theo ấn bản 1895-1896).
          </li>
          <li className="li1">
            Nguyễn Tuấn <b>Cường</b>. (2004).{" "}
            <i>
              Khảo sát tác động của các tạo tố ngoại lai tới cấu trúc loại chữ
              Nôm mượn âm Phi Hán Việt
            </i>
            . Trong &quot;Nghiên cứu chữ Nôm&quot;. Nxb. KHXH. H. tr. 83 - 98.
          </li>
          <li className="li1">
            Gerard <b>Diffloth</b>. (1991).{" "}
            <i>Vietnamese as a Mon Khmer language</i>. Paper from the first
            annual Meeting of the Southest Asian Linguistics Society. Arizona
            State University.
          </li>
          <li className="li1">
            Trần Trí <b>Dõi</b>. (1996).{" "}
            <i>
              Les initiales */s, z/ et du Proto Viet Muong (PVM) et leur
              changements dans le Vietnamien
            </i>
            . Mon- Khmer Studies. 25/1996, p.263 - 268.
          </li>
          <li className="li1">
            Bùi Duy <b>Dương</b>. (2002).{" "}
            <i>Thành ngữ gốc Hán trong Quốc âm thi tập</i> (Nguyễn Trãi). TC
            Ngôn ngữ. số 16/ 2002.
          </li>
          <li className="li1">
            Bùi Duy <b>Dương</b>. (2009).{" "}
            <i>Thành ngữ gốc Hán trong ba kiệt tác thơ Nôm</i>. TC Hán Nôm. số
            5/2009.
          </li>
          <li className="li1">
            Phan John <b>Dương</b>. (2010).{" "}
            <i>
              Re- Imagining &quot;Annam&quot;: a New Analysis of Sino - Viet -
              Muong Linguistic Contact.{" "}
            </i>
            Chinese Southern Diasposa Studies. Volume 4.2010. p.3- 24.
          </li>
          <li className="li1">
            Phan John <b>Dương</b>. (2012).{" "}
            <i>
              Mường is not a subgroup: Phonological Evidence for a Paraphyletic
              Taxon in the Viet- Muong sub-family
            </i>
            . Mon - Khmer Studies 40. p.1- 18.
          </li>
          <li className="li1">
            Phan John <b>Dương</b>. (2013).{" "}
            <i>
              Lacquer words: the Evolution of Vietnamese under Sinitic
              Influences from the 1<sup>st</sup> Century BCE through the 17
            </i>
            <sup>th</sup> <i>Century CE</i>. A Dissertation Presented to the
            Faculty of the Graduate School of Cornell University in Partial
            Fulfillment of the Requirements for the Degree of Doctor of
            Philosophy.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2004a).{" "}
            <i>
              Vài ý kiến về cách đọc một số chữ Nôm trong “Truyền kỳ mạn lục
              giải âm”.
            </i>{" "}
            Thông báo Hán Nôm học 2003. Nxb KHXH. H.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2004b).{" "}
            <i>
              Bước đầu tìm hiểu cách dịch cấu trúc sử động qua bản “Tân biên
              truyền kỳ mạn lục tăng bổ giải âm tập chú”
            </i>
            . Thông báo Hán Nôm 2004. (chưa in).
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2004c).{" "}
            <i>
              Bước đầu tìm hiểu cách dịch cấu trúc bị động qua bản “Tân biên
              truyền kỳ mạn lục tăng bổ giải âm tập chú”
            </i>
            . TC Hán Nôm, số 03/2004. Tr.34- 39.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2006a).{" "}
            <i>Đi tìm âm đọc cổ cho chữ “lơ thơ”</i>. TC Hán Nôm. Số 03/2006.
            tr.44-53.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2006b).{" "}
            <i>
              Khảo sát hệ thống từ cổ trong bản giải âm “Khóa hư lục” của Phúc
              Điền hòa thượng
            </i>
            . Thông báo Hán Nôm 2005.. Nxb. KHXH. H
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2008a).{" "}
            <i>Thử tầm nguyên hai chữ “tha la”</i>. Trong “Nghiên cứu về chữ
            Nôm”. Hội bảo tồn Di sản chữ Nôm Hoa Kỳ - Nxb KHXH. H. tr.169-180.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2008).{" "}
            <i>
              Tình hình cấu trúc chữ Nôm qua &quot;Khóa hư lục giải nghĩa&quot;
              và “Khóa hư lục giải âm”.{" "}
            </i>
            TC Hán Nôm. số 02/2008. tr. 43-57.{" "}
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2009).{" "}
            <i>Khảo về Đại Cồ Việt - nước Việt - nước Phật giáo. </i>TC Hán Nôm
            số 02/2009. tr.53-75.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2010a){" "}
            <i>
              Vấn đề khai thác từ cổ qua hệ thống từ điển và các văn bản chữ Nôm
            </i>
            . TC Hán Nôm. số 01/2010. tr.17-37, 20 trang.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2010b).{" "}
            <i>Về dấu vết chữ Nôm kỵ húy trong sách Phật thuyết</i>. TC Văn hóa
            Nghệ An.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2011a).{" "}
            <i>Phật thuyết có phải là bản dịch phẩm Nôm của thế kỷ XII?</i> TC
            Ngôn ngữ. Số 04/2011.tr.31-47.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2011b).
            <i>Từ nguyên của một số từ đơn tiết gốc Hán</i>. Trong “Đào tạo và
            nghiên cứu ngôn ngữ học ở Việt Nam: Những vấn đề lý luận và thực
            tiễn”. Nxb Đại học Quốc gia. H.{" "}
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2011d).{" "}
            <i>Tổng thuật tình hình nghiên cứu diễn biến cấu trúc chữ Nôm</i>.
            The International Sympoisium on Nom script. Temple University (USA:
            2008), TC Hán Nôm, số 2 (105)/ 2011, tr.11 - 28.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương.</b> (2012a).{" "}
            <i>
              Thủy âm kép tiếng Việt thế kỷ XIV-XV qua chữ Nôm cổ trong “Quốc âm
              thi tập
            </i>
            ”. TC Ngôn ngữ số 8 2012.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2012b).{" "}
            <i>
              Nghiên cứu chữ Nôm và tiếng Việt qua các bản dịch “Khóa Hư Lục
            </i>
            . Nhà xuất bản Từ điển Bách khoa. H.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2012c).{" "}
            <i>
              Một số từ gốc Hán có cấu trúc CCVC qua ngữ liệu thơ Nôm trong Quốc
              âm thi tập
            </i>
            . Trong &nbsp;<i>Một số vấn đề về ngôn ngữ và văn hóa</i>. Nhà xuất
            bản Thông tin và Truyền thông. H.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2012d).{" "}
            <i>Từ nguyên của XE và các điệp thức của nó</i>. “Thông báo Hán Nôm
            học 2010-2011”. Nxb Thế giới. H. 2012. tr. 557 - 562.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2012e).{" "}
            <i>
              Từ nguyên của từ “văn hiến”trong bối cảnh tri thức Nho gia Việt
              Nam Trung Hoa
            </i>
            . TC NC Văn hóa. Hà Nội. số 3/2012. tr. 5 - 14.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b> 陈仲洋。 (2012f)。 南字研究 -
            喃字來源，历史发展和结構。廣西民族師範學院学报。 4 (83)/07/2012 。頁
            82 - 88。
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2012g).{" "}
            <i>
              Nghiên cứu phương pháp giải nghĩa và giải âm qua Khóa hư lục giải
              nghĩa và Khóa hư lục giải âm
            </i>
            . Tc Hán Nôm. Số 4 (113)/2012. tr. 19-30.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>, Nguyễn Hùng Vĩ (2012h).{" "}
            <i>
              Khảo về CHẰM và TRẢI trong tiếng Việt cổ qua “Cư trần lạc đạo phú”
              của Trần Nhân Tông.{" "}
            </i>
            Trong “Những vấn đề ngôn ngữ và văn hóa”. Nxb Thông tin và Truyền
            thông. Tp Hồ Chí Minh. Tr.177-186.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b> (2013a).{" "}
            <i>
              Giải mã những câu thơ sáu chữ trong Quốc âm thi tập từ ngả đường
              ngữ âm học lịch sử
            </i>
            . TC Hán Nôm. Số 1/2013.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b> (2013b).{" "}
            <i>
              Thủy âm kép tiếng Việt thế kỷ XIV - XV qua chữ Nôm hậu kỳ trong
              “Quốc âm thi tập
            </i>
            ”. TC Hán Nôm. Số 03/ 2013.{" "}
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>, Nguyễn Hùng Vĩ (2013c).{" "}
            <i>
              Từ nguyên của KHOẢNG - QUÃNG - KHOÁNG - KHOẢN - KHOANG - XOANG -
              XANG - XƯƠNG qua ngữ liệu tiếng Việt thế kỷ XIII - XX
            </i>
            . Trong “Bốn mươi năm đào tạo và nghiên cứu Hán Nôm (1972- 2012)”.
            Nxb. Đại học Quốc gia Hà Nội. H.{" "}
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b> (2013d).{" "}
            <i>Từ nguyên của &apos;rái cá&apos;</i>. TC Từ điển học &amp; Bách
            khoa thư (Lexicography &amp; Encyclopedia). ISSN: 1859- 3135. Số 5
            (25). 09/2013. tr.68- 75.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2013e).{" "}
            <i>Cách dịch kết cấu định trung trong Bình ngô đại cáo</i>. Trong
            &quot;Hán Nôm học trong nhà trường&quot;. Nxb. ĐH Sư Phạm. H.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2013f).{" "}
            <i>
              Nguồn gốc, lịch sử, cấu trúc chữ Nôm từ bối cảnh văn hóa Đông Á
            </i>
            . Trong &quot;Nghiên cứu Nôm từ hướng tiếp cận liên ngành&quot;.
            Nxb. Từ điển Bách khoa. H. tr. 53 - 78.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b>. (2013g){" "}
            <i>
              Từ nguyên của “pháy pháy” và “phới phới” qua ngữ liệu tiếng Việt
              thế kỷ XV-XX
            </i>
            . Thông báo Hán Nôm học 2012. Nxb Thế giới. H. tr. 192 - 196.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b> (2014a).{" "}
            <i>Hệ thống từ cổ tiếng Việt qua sáng tác Nôm thế kỷ XIII</i>. TC
            Hán Nôm, sô 1/ 2014.
          </li>
          <li className="li1">
            Trần Trọng <b>Dương</b> (2014b).
            <i> Từ nguyên của Lỗi, Rối, Trói, Tói, Lụy</i>. TC Từ điển và Bách
            khoa thư. (sắp in).
          </li>
          <li className="li1">
            Phạm Trọng <b>Điềm</b> và Bùi Văn Nguyên phiên chú. (1982).{" "}
            <i>Hồng Đức Quốc âm thi tập</i>. Nxb Văn học. H.
          </li>
          <li className="li1">
            Trần Quang <b>Đức</b>. (2013).{" "}
            <i>Ngàn năm áo mũ (Lịch sử trang phục Việt Nam giai đoạn </i>1009 -
            1945). Nhã Nam - Nxb. Thế giới. H.
          </li>
          <li className="li1">
            Hội Khai trí Tiến <b>Đức</b>, (1931), <i>Việt Nam tự điển</i>, HANOI
            Imprimerie Trung - Bac Tan - Van. Mặc Lâm xuất bản.
          </li>
          <li className="li1">
            Nhan <b>Gaston</b>. (1967).
            <i>
              {" "}
              Etude du consonantisme du Quốc âm thi tập (Nghiên cứu hệ thống phụ
              âm đầu của Quốc âm thi tập
            </i>
            ). LATS đệ tam cấp. Thư viện I. N. A. C. O. Pháp. 203 tr.
          </li>
          <li className="li1">
            J.F.M. <b>Génibrel</b>. (1898).{" "}
            <i>Dictionnaire Annamite - Français</i> (大越國音漢字法釋集成).
            SaiGon Imprimerie de la mission à Tân Định.
          </li>
          <li className="li1">
            Trần Văn <b>Giáp</b>, Phạm Trong Điềm phiên âm chú giải. (1956).
            <i> Nguyễn Trãi quốc âm thi tập</i>. Nxb Văn Sử Địa. H.
          </li>
          <li className="li1">
            Hoàng Xuân <b>Hãn</b>. (1998). <i>La Sơn Yên Hồ Hoàng Xuân Hãn </i>
            (T.1, 2, 3). Nxb. Giáo dục. H.{" "}
          </li>
          <li className="li1">
            Lorenzo <b>Hervás</b>. (1787).{" "}
            <i>
              Saggio pratico delle lingue: con prolegomeni, e una raccolta di
              orazioni dominicali in piu di … (1787)
            </i>{" "}
            Published Per Gregorio Biasini.
          </li>
          <li className="li1">
            Nguyễn Văn <b>Hiệp</b>. (1989).{" "}
            <i>
              Bằng phương pháp ngôn ngữ học: tiếp tục giám định một số bài thơ
              chưa rõ là của Nguyễn Trãi hay Nguyễn Bỉnh Khiêm
            </i>
            . TC Khoa học. Đại học Tổng hợp. Số 03/ 1989.
          </li>
          <li className="li1">
            Lê <b>Hiệu</b>, Kiều Thu Hoạch phiên chú. (1982).{" "}
            <i>Thơ văn Nguyễn Trãi</i>. Nxb Văn học. H.
          </li>
          <li className="li1">
            Nguyễn Đình <b>Hòa</b>. (1985).{" "}
            <i>
              The Case of song viết in archaic Vietnamese (Trường hợp song viết
              trong tiếng Việt cổ.
            </i>{" "}
            Vietnam Forum. số 6, Hè - Thu 1985. tr. 58-72.
          </li>
          <li className="li1">
            Nguyễn Đình <b>Hòa</b>. (1992).{" "}
            <i>
              Graphemic Borrowings from Chinese - The Case of Chữ Nôm, Vietnam’s
              Demotic Script
            </i>
            .: <i>Bulletin of the Institute of History and Philosophy</i>, Tập
            61, phần 2. Taipei, Taiwan.
          </li>
          <li className="li1">
            Nguyễn Đình <b>Hòa</b>. (2001).{" "}
            <i>Some Archaic Vietnamese Words in Nguyễn Trãi’s Poems</i>. In
            “Monograph on Nôm Characters”. Viet-Hoc Publishing Department.
            tr.41-59.
          </li>
          <li className="li1">
            Tang Lệ <b>Hòa </b>vcs 臧勵龢(等)。 (1931)。 中國古今地名大辭典
            (Trung Quốc cổ kim địa danh đại từ điển)。商务印书馆。
          </li>
          <li className="li1">
            Trần Kinh <b>Hòa</b> 陳荊和. (1969). 安南訳語の研究. Nippon. 286 p.
            repr from SHIGAKU vol.XXXIX. no.3-4; vol.XL, no1; vol XLI, no 1,2,3
            1966-1968.
          </li>
          <li className="li1">
            Đỗ Quang Tuấn <b>Hoàng</b>. (2014). <i>Khát uống trà mai</i>. Trong
            “Đặc san chùa Hương”. Công ty TNHH một thành viên In &amp; Văn hóa
            Phẩm. H. Tr.44- 47.
          </li>
          <li className="li1">
            Nguyễn Hữu <b>Hoành</b>, Nguyễn Văn Lợi. (1998). <i>Tiếng Katu</i>.
            Nxb. KHXH. H.
          </li>
          <li className="li1">
            Phạm Đình <b>Hổ</b>. (1827). <i>Nhật dụng thường đàm</i>. Khắc in
            năm Tự&nbsp; Đức 4 (1851). Đồng Văn trai tàng bản. Ký hiệu R.1726
            (Tv Quốc gia).
          </li>
          <li className="li1">
            Phạm Đình <b>Hổ</b>. (&lt;1832). <i>Quần thư tham khảo</i>. Viện
            Nghiên cứu Hán Nôm, ký hiệu A.487.
          </li>
          <li className="li1">
            Nguyễn Quang <b>Hồng</b>. (1988). <i>“Êm nềm” và “Lắm thăn”. </i>TC
            Hán Nôm, số 1 (4)/ 1988. tr.81- 84.
          </li>
          <li className="li1">
            Nguyễn Quang <b>Hồng</b>. (2008).{" "}
            <i>Khái luận văn tự học chữ Nôm</i>. Nxb Giáo Dục. H.{" "}
          </li>
          <li className="li1">
            Nguyễn Quang <b>Hồng</b> phiên khảo. (2001).{" "}
            <i>Tân biên truyền kỳ mạn lục tăng bổ giải âm tập chú</i>, Nxb.KHXH,
            H.
          </li>
          <li className="li1">
            Nguyễn Quang <b>Hồng</b> (chủ biên). (2006). <i>Tự điển chữ Nôm</i>.
            Nxb. Giáo dục. H.{" "}
          </li>
          <li className="li1">
            Gustave <b>Hue</b>. (1937).{" "}
            <i>Dictionaire Vietnamien Chinois Français</i> (
            <i>Tự điển Việt- Hoa - Pháp</i>). Imprimerie Trung Hòa. (tb
            1971).Nhà sách Khai trí. Saigon.{" "}
          </li>
          <li className="li1">
            Hoàng <b>Hựu</b>. (2012). <i>Bảng tra chữ Nôm dân tộc Dao</i>. Viện
            NC Hán Nôm- Nxb. KHXH. H.
          </li>
          <li className="li1">
            Hướng <b>Hy</b> 向熹. (1988). <i>Thi kinh từ điển</i> (詩經詞典). Tứ
            Xuyên nhân dân xbx.
          </li>
          <li className="li1">
            Bernhard <b>Karlgren</b>. (1915, repr 1926).{" "}
            <i>Etudes sur la Phonologie Chinoise</i>. Archives D’etudes
            Orientales Publiées par J. A. Lundell. Vol.15. Leyde, E.-J. Brill.
            Stockholm, P.A. Norstedt and Soner Gotembourg, Elanders Boktryckeri
            A.B 1915-1926.
          </li>
          <li className="li1">
            Bernhard <b>Karlgren</b>. (1923).{" "}
            <i>Analytic Dictionary of Chinese- Japanese. </i>Paris. Librairie
            Orientalise Paul Geuthner. 18 RUE JACOP 6<sup>0</sup>.
          </li>
          <li className="li1">
            Nguyễn Văn <b>Khang</b>. (2002). <i>Từ điển Mường Việt</i>. Nxb Văn
            hóa Dân tộc. H.
          </li>
          <li className="li1">
            Đặng Thế <b>Kiệt</b>. 2010. Hán Việt Từ Điển Trích Dẫn 漢越辭典摘引,
            http:‖www.vietnamtudien.org/hanviet/{" "}
          </li>
          <li className="li1">
            Vũ Văn <b>Kính </b>phiên khảo - chú thích<b>.</b> (1995).{" "}
            <i>Quốc âm thi tập</i>: <i>đối chiếu chữ Nôm - Quốc ngữ</i>. Nxb.
            Trẻ. Tp. HCM. 240 tr.
          </li>
          <li className="li1">
            Vũ Văn <b>Kính</b>, Khổng Đức (phiên âm). (2003).{" "}
            <i>Ngũ thiên tự </i>. Nxb. VHTT. Tp. HCM.
          </li>
          <li className="li1">
            Trần Xuân Ngọc <b>Lan</b>. (1985). <i>Chỉ nam ngọc âm giải nghĩa</i>
            . Nxb KHXH. H.
          </li>
          <li className="li1">
            Trần Xuân Ngọc <b>Lan</b>. (1985).{" "}
            <i>
              Về mấy từ &quot;thuở&quot;- “nếu”-“ban”-“no” trong tiếng Việt thế
              kỷ XV-XVIII
            </i>
            . “Những vấn đề ngôn ngữ học về các ngôn ngữ phương Đông”. Viện Ngôn
            ngữ học. H. Tr.351-357.
          </li>
          <li className="li1">
            Trần Xuân Ngọc <b>Lan</b>. (1988).{" "}
            <i>Một giả thuyết về từ nguyên của từ “Nôm”. </i>TC Hán Nôm số 1
            (4)/ 1988. tr.85- 87.
          </li>
          <li className="li1">
            Cao Hữu <b>Lạng</b>. (1985).{" "}
            <i>Chữ “chớ” trong Quốc âm thi tập của Nguyễn Trãi</i>. Nghiên cứu
            Hán Nôm. Số 01/1985. tr. 82-83.
          </li>
          <li className="li1">
            Hoàng Văn <b>Lâu</b>. (1986).{" "}
            <i>
              Về bài thơ &quot;Chu Công phụ Thành Vương đồ&quot; của Nguyễn Trãi
            </i>
            . TC Hán Nôm. Số 1. Tr.72 - 79.{" "}
          </li>
          <li className="li1">
            Mai Quốc <b>Liên</b>, Kiều Thu Hoạch, Vương Lộc, Nguyễn Khuê (phiên
            chú). (2001). <i>Quốc âm thi tập</i>. Trong{" "}
            <i>Nguyễn Trãi toàn tập tân biên </i>(T3). Nxb Văn học - TTNC Quốc
            học. H.
          </li>
          <li className="li1">
            Vương <b>Lộc</b>. (1999). <i>Từ điển từ cổ</i>. TT Từ điển học &amp;
            Nxb. Đà Nẵng.{" "}
          </li>
          <li className="li1">
            Vương <b>Lộc</b> (khảo cứu, dịch chú). (1997).{" "}
            <i>An Nam dịch ngữ. </i>Nxb Đà Nẵng - TT Từ điển học. Đà Nẵng.
          </li>
          <li className="li1">
            Đỗ Tất <b>Lợi</b>. (1968 tb 2009).{" "}
            <i>Những cây thuốc và vị thuốc Việt Nam</i>. Nxb Y học- Nxb Thời
            đại. H.{" "}
          </li>
          <li className="li1">
            Nguyễn Như <b>Luân</b>. (1992).{" "}
            <i>Ba bài văn - ba dòng văn hóa trong một thiên tài Nguyễn Trãi</i>.
            TC Hán Nôm. Số 1 (12). Tr.37-41.
          </li>
          <li className="li1">
            Phạm <b>Luận</b> (phiên âm và chú giải).{" "}
            <i>Nguyễn Trãi Quốc âm thi tập</i>. Nxb Giáo dục Việt Nam. H.
          </li>
          <li className="li1">
            Quách Tích <b>Lương</b>郭锡良。 漢字古音手冊 (Hán tự cổ âm thủ
            sách)。北京大學出本社。北京。
          </li>
          <li className="li1">
            Vương <b>Lực</b> 王力。 (1982)。 同源字典。商務印書館。北京。
          </li>
          <li className="li1">
            Cung Văn <b>Lược</b>. (1980).{" "}
            <i>
              Thử tìm âm vang của tiếng Thăng Long - Đông Đô trong &quot;Quốc âm
              thi tập&quot;.{" "}
            </i>
            Trong &quot;Nguyễn Trãi Thăng Long Hà Nội&quot;. Hội Văn nghệ - Sở
            VHTT Hà Nội. H. tr. 175 - 187.
          </li>
          <li className="li1">
            Hoàng Văn <b>Ma</b>, Lục Văn Pảo. (1984).{" "}
            <i>Từ điển Việt - Tày - Nùng. </i>Nxb KHXH. H.
          </li>
          <li className="li1">
            Victor H. <b>Mair</b>, Tsu-Mei Lin (1991).{" "}
            <i>The Sanskrit Origins of Recent Style Prosody</i>. Harvard Journal
            of Asiatic Studies. Vol.51, No. 2 (Dec., 1991). pp. 375-470.
          </li>
          <li className="li1">
            Shimizu <b>Masaaki</b> (2002).{" "}
            <i>
              Khảo sát sơ lược về cấu trúc âm tiết tiếng Việt vào thế kỷ XIV-XV
              qua hai cứ liệu chữ Nôm
            </i>
            . Trong “Các nhà Việt Nam học nước ngoài viết về Việt Nam” (Tập 2).
            Nxb Thế giới. H.{" "}
          </li>
          <li className="li1">
            Shimizu <b>Masaaki</b>. (2010).{" "}
            <i>
              A Phonological Reconstruction of 15th Century Vietnamese Using Chữ
              Nôm
            </i>{" "}
            字喃<i>Materials</i>. 2010 International Conference and Taiwanese
            Studies, National Cheng Kung University, Taiwan.
          </li>
          <li className="li1">
            Henri <b>Maspéro.</b> (1912).{" "}
            <i>Etudes sur la phonétique historique de la langue Annamite. </i>
            Bulletin de l’Ecole Française d&apos;Extrême- Orient, XII, 1.
          </li>
          <li className="li1">
            Jimes A. <b>Matisoff</b>. (1973).{" "}
            <i>Tonogenesis in Southeast Asia</i>, in: Hyman, Larry M. (ed.)
            Consonant Types and Tones. Southern California Occasional Papers in
            Linguistics 1, 71- 96.{" "}
          </li>
          <li className="li1">
            Alexis <b>Michaud</b>. (2009).{" "}
            <i>Monosyllabicization: patterns of Evolution in Asian Languages</i>
            . “Monosyllables: From Phonology To Typology”, IAAS (Institut für
            Allgemeine und Angewandte Sprachwissenschaft der Universität
            Bremen), Bremen : Germany.
          </li>
          <li className="li1">
            Trương Hồng <b>Minh</b> 张洪明 (USA)。(2005)。汉语 “江” 词源考 (Khảo
            về từ nguyên của chữ “giang” trong tiếng Hán。 颜洽茂,
            邓风平(译)。浙江大学学报(人文社会科学版)。Journal of Zhejiang
            University( Humanities and Social Sciences)。第35 卷第1 期。2005 年1
            月。72- 81 。(本文全名为 Chinese Etyma for River, 原载 Journal of
            Chinese Linguistics, Volume 26, Number 1, January 1998).{" "}
          </li>
          <li className="li1">
            Joseph <b>Morrone</b>. (1838).{" "}
            <i>A Cochinchinese and Latin Dictionnary</i>. (Tự vị Đàng Trong -
            Latin). In “
            <i>
              A Dissertation on the Nature and Character of the Chinese System
              of Writing
            </i>
            ” (by Peter Stephen Du Ponceau,) American Philosophical Society,
            Philadelphia.{" "}
          </li>
          <li className="li1">
            Nguyễn <b>Nam</b>. (1986).{" "}
            <i>
              Góp thêm ý kiến về một số trường hợp phiên âm trong “Quốc âm thi
              tập”.{" "}
            </i>
            TC Ngôn ngữ số 01/ 1986.
          </li>
          <li className="li1">
            Hoàng Trần <b>Nghịch</b>, Tòng Kim Ân. (1990).{" "}
            <i>Từ điển Thái Việt</i>. Nxb. KHXH. H.
          </li>
          <li className="li1">
            Vũ Đức <b>Nghiệu</b>. (2005).{" "}
            <i>
              Đơn tiết, đơn tiết hoá và đa tiết, đa tiết hoá trong quá trình
              phát triển của tiếng Việt (Monosyllabism, monosyllablization and
              polysyllabism, polysyllablization during Vietnamese developing
              process
            </i>
            ). Kỉ yếu hội thảo quốc tế về ngôn ngữ và ngôn ngữ học liên Á. H,
            11-2005, tr. 202 - 213.{" "}
          </li>
          <li className="li1">
            Vũ Đức <b>Nghiệu</b>. (2006).{" "}
            <i>Hư từ thế kỷ XV trong QATT và HĐQATT</i>. TC Ngôn ngữ, số
            12/2006.
          </li>
          <li className="li1">
            Vũ Đức <b>Nghiệu</b>. (2011).{" "}
            <i>Lược khảo lịch sử từ vựng tiếng Việt</i>. Nxb Giáo dục. H.{" "}
          </li>
          <li className="li1">
            Hoàng Thị <b>Ngọ</b> (1999).{" "}
            <i>
              Chữ Nôm và tiếng Việt qua bản giải âm Phật thuyết đại báo phụ mẫu
              ân trọng kinh
            </i>
            . Nxb. KHXH.H.
          </li>
          <li className="li1">
            Nguyễn Tá <b>Nhí</b>. (1984).{" "}
            <i>Trả lại cho Nguyễn Đình Chiểu nghĩa đúng của từ “thon von”</i>.
            Kỷ yếu hội nghị Nguyễn Đình Chiểu, Ty Văn hóa Bến Tre.
          </li>
          <li className="li1">
            Nguyễn Tá <b>Nhí</b>. (1985).{" "}
            <i>
              Mấy suy nghĩ về việc phiên âm, chú giải từ cổ trong văn bản Nôm
            </i>
            . TC Hán Nôm. Số 1. Tr.58-66
          </li>
          <li className="li1">
            Nguyễn Tá <b>Nhí</b>. (1988).{" "}
            <i>Tìm hiểu nghĩa của từ &quot;Mỗ&quot;</i>. TC Hán Nôm. Số 1 (4).
            Tr.88- 91.
          </li>
          <li className="li1">
            Nguyễn Tá <b>Nhí</b>, Hoàng Thị Ngọ, vcs (phiên chú). (2008).{" "}
            <i>Quốc âm thi tập</i>. trong “Tổng tập văn học Nôm Việt Nam” (T1).
            Nxb. KHXH. H.
          </li>
          <li className="li1">
            <i></i>
            <b>
              <i>Ngũ</i>
            </b>
            <i> thiên tự diễn âm</i>. Quảng Thịnh, 115 Hàng Gai. Hanoi. 1939.{" "}
          </li>
          <li className="li1">
            Bùi Văn <b>Nguyên</b>. (phiên chú). (1994). <i>Quốc âm thi tập</i>.
            NXb. Giáo dục. H.
          </li>
          <li className="li1">
            Jerry <b>Norman</b> - Mei Tsu Lin. (1976).{" "}
            <i>
              The Autroasiatic in Ancient South China: Some Lexical Evidence.{" "}
            </i>
            Monumenta Serica (Journal of Oriental Studies) 32. p. 274- 301;
            repr. In 《梅祖麟语言学论文集》。上海印書館。上海。P.459- 497.
          </li>
          <li className="li1">
            E.G. <b>Pulleyblank</b> (蒲立本) 。(1999) 。上古漢語的輔音系統 (The
            Consonantal System of Old Chinese)。 潘悟云，徐文堪譯 (據 Asia Major
            9/1962譯出) 。中華書局。北京。
          </li>
          <li className="li1">
            Lý Phương <b>Quế</b> 李方桂。 (2001)。《上古音研究》(Thượng cổ âm
            nghiên cứu)。商务印书馆。北京。
          </li>
          <li className="li1">
            Nguyễn Ngọc <b>San</b>. (2003). <i>Tiếng Việt lịch sử.</i> Nxb Đại
            học Sư phạm. H.
          </li>
          <li className="li1">
            Nguyễn Ngọc <b>San</b>. (2004). <i>Thử bàn về vấn đề phiên Nôm</i>.
            Trong “Nghiên cứu chữ Nôm”. Nxb KHXH. H.{" "}
          </li>
          <li className="li1">
            Hải Châu Tử Nguyễn Văn <b>San</b>. (1899). <i>Đại Nam quốc ngữ</i>.
            Thành Thái Ất Tị niên mạnh thu tuyên. Văn Giang Đa Ngưu Văn Sơn
            đường tàng bản.
          </li>
          <li className="li1">
            Trần Lê <b>Sáng</b> (chủ biên). (2002). <i>Ngữ văn Hán Nôm </i>(Tập
            II: Ngũ kinh). Nxb KHXH. H.
          </li>
          <li className="li1">
            Paul <b>Schneider</b>. (1979).{" "}
            <i>
              Les Idéogrammes Vietnamiens: Etude sur l’Ecriture Nôm au XVI ème
              Sièrie
            </i>
            . Nice: Approchess Asie. Cahier du C.E.R.A.C.{" "}
          </li>
          <li className="li1">
            Paul <b>Schneider</b>. (1987).{" "}
            <i>Nguyen Trai et son Receuil de Poèmesen en Langue</i>. Nationale.
            Paris: Centre National de la Rechercher Scientifique 1987).
          </li>
          <li className="li1">
            Paul <b>Schneider</b>. (1993).{" "}
            <i>Dictionnaire historique des ideogrammes Vietnamiens</i>. Domaine
            Carlone - 98. boulevard Edouard Heriot - BP 209 - 06204 NICE Cedex 3
            (France). Nice.
          </li>
          <li className="li1">
            Paul <b>Schneider</b>. (1995).{" "}
            <i>Khảo cứu bản dịch Nôm Truyền kỳ mạn lục</i>. TC Hán Nôm số 01/
            1995.
          </li>
          <li className="li1">
            Axel <b>Schuessler</b>. (1987).{" "}
            <i>A Dictionary of Early Zhou Chinese</i>. University of Hawai‘i
            Press. Honolulu.
          </li>
          <li className="li1">
            Axel <b>Schuessler</b>. (2007).{" "}
            <i>ABC Etymologycal Dictionary of Old Chinese</i>. University of
            Hawai‘i Press. Honolulu.
          </li>
          <li className="li1">
            N.V. <b>Stankevitch</b>. (1983).{" "}
            <i>Hiện tượng giao thoa từ ngữ pháp Hán sang ngữ pháp tiếng Việt</i>
            . “Những vấn đề về ngôn ngữ -các ngôn ngữ phương Đông”. Viện Đông
            Nam Á.{" "}
          </li>
          <li className="li1">
            Alexandro de <b>Rhodes</b>. (1651).{" "}
            <i>Dictionarivm Annnamiticivm Lvsitanvm et Latinvm.</i> Romae :
            typis &amp; sumptibus eiusdem Sacr. Congreg. p. 633., tb.1994. Thanh
            Lãng, Hoàng Xuân Việt và Đỗ Quang Chính phiên dịch, Nxb. KHXH. H.
          </li>
          <li className="li1">
            Nguyễn Văn <b>Tài</b>. (1976).{" "}
            <i>
              Thử bàn về vị trí của tiếng Chứt, tiếng Cuối trong nhóm Việt Mường
            </i>
            . TC Dân tộc học. số 02/ 1976.
          </li>
          <li className="li1">
            Nguyễn Văn <b>Tài</b>. (1993). <i>Nguồn</i>:{" "}
            <i>a Dialect of Vietnamese or a Dialect of Mường</i> (
            <i>Base on Local Data</i>). Mon - Khmer Studies 22/ 1993. p.231-
            264.
          </li>
          <li className="li1">
            Nguyễn Văn <b>Tài</b>. (2006).{" "}
            <i>Ngữ âm tiếng Mường qua các phương ngôn</i>. Nxb Từ điển Bách
            Khoa. H.
          </li>
          <li className="li1">
            L.J. <b>Taberd</b>. (1838). <i>Dictionarium Anamitico - Latinum</i>{" "}
            (南越洋合字彙 Nam Việt Dương hiệp tự vị). Frederrichnagori Vulgo
            Serampore.
          </li>
          <li className="li1">
            Yonosuke <b>Takeuchi</b>竹內與之助. (1988). 字喃字典{" "}
            <i>Tự điển chữ Nôm </i>. 東京大學書林 DAIGAKUSYORIN. 東京.
          </li>
          <li className="li1">
            Nhiếp <b>Tân</b> 聂槟. (2013).{" "}
            <i>
              Nghiên cứu chữ Nôm tự tạo trong văn bản giải âm Truyền kỳ mạn lục
            </i>{" "}
            (《传奇漫录》喃譯本中的自造喃字研究). Nxb. ĐH Quốc gia Hà Nội. H.
          </li>
          <li className="li1">
            Phạm Văn <b>Thắm</b>. (2008).{" "}
            <i>Tìm hiểu ý nghĩa hai mã chữ quốc gia thời Trần Thái Tông</i>. TC
            Hán Nôm. Số 107/ 2011. tr.71- 76.
          </li>
          <li className="li1">
            (Hán) Hứa <b>Thận</b> 許慎. (58- 147). <i>Thuyết văn giải tự chú</i>
            (說文解字注). (Thanh) Đoàn Ngọc Tài chú. Thượng Hải cổ tịch xuất bản
            xã. Thượng Hải. tb.1981.
          </li>
          <li className="li1">
            Trần Uyên <b>Thi </b>- Nguyễn Hữu Vinh. (2007).{" "}
            <i>
              Ai vẽ được, ai xóa được? Dấu vết âm Việt cổ: từ song tiết và phụ
              âm kép
            </i>
            . Tham luận Hội nghị Quốc tế về tiếng Việt. Viện Việt học.
            California. USA.
          </li>
          <li className="li1">
            Huệ <b>Thiên</b> (An Chi). 2004.{" "}
            <i>Những tiếng trống qua cửa các nhà sấm</i>. Nxb Trẻ. Tp. HCM.
          </li>
          <li className="li1">
            Huệ <b>Thiên</b> (An Chi). 1998.{" "}
            <i>Về từ nguyên của cặp từ giết- chết</i>. Thông tin Khoa học và
            Công nghệ Thừa Thiên Huế. Số 3 (21)/1998; tb. 2004.{" "}
            <i>Những tiếng trống qua cửa các nhà sấm</i>. Nxb Trẻ. Tp. HCM.
            Tr.233- 236.
          </li>
          <li className="li1">
            Ngô Đức <b>Thọ</b>. (1997).{" "}
            <i>Nghiên cứu chữ húy Việt Nam qua các triều đại</i> (Les caractères
            interdits au Vietnam à travers l&apos;Histoire). Nxb. Văn hóa. H.
          </li>
          <li className="li1">
            Đinh Thanh <b>Thụ</b>丁聲樹 （編錄）Lý Vinh 李榮（參訂）。(1958)。
            古音字音對照手冊。 科學出版社。{" "}
          </li>
          <li className="li1">
            Trần Hữu <b>Thung</b> &amp; Thái Kim Đỉnh. (1997).{" "}
            <i>Từ điển tiếng Nghệ</i>. Nxb Nghệ An.{" "}
          </li>
          <li className="li1">
            Trương Ngọc <b>Thư</b>張玉書。 (2006) 。《康熙字典》 (Khang Hy tự
            điển)。 上海书店出版社出版。 上海。
          </li>
          <li className="li1">
            Pháp <b>Tính</b>. XVII.{" "}
            <i>Trùng thuyên chỉ nam phẩm vựng dã đàm tịnh bổ di đại toàn</i>.
            Khắc năm Cảnh Hưng 13 (1752). Diên Ứng tự tàng bản. Ký hiệu: AB.
            372.
          </li>
          <li className="li1">
            Tuệ <b>Tĩnh</b>. XIV. <i>Nam dược quốc ngữ phú</i>. Trong “Hồng
            Nghĩa Giác Tư y thư”. Bản in năm (1717). Thị nội phủ. Ký hiệu: A.
            162.
          </li>
          <li className="li1">
            Mineya <b>Toru</b>三根谷徹。 (1993) 。 中古漢語と越南漢字音。
            汲古書院。{" "}
          </li>
          <li className="li1">
            Trần Thái <b>Tông</b>. (2009). <i>Thiền tông khóa hư ngữ lục.</i>{" "}
            Tuệ Tĩnh giải nghĩa, Trần Trọng Dương khảo cứu, dịch và phiên chú.
            Nxb Văn học &amp; TT NC Quốc Học.{" "}
          </li>
          <li className="li1">
            Võ Xuân <b>Trang</b>. (1997). <i>Phương ngữ Bình Trị Thiên</i>. Nxb
            KHXH. H.
          </li>
          <li className="li1">
            Mai Viên Đoàn <b>Triển</b>. (1854-1919).{" "}
            <i>An Nam phong tục sách</i>. (A.45 VNCHN). tb.2008. Nguyễn Tô Lan
            khảo cứu - dịch chú. Alpha Book- Nxb. Hà Nội. H.{" "}
          </li>
          <li className="li1">
            Lê Ngọc <b>Trụ</b>. (1959). <i>Việt ngữ chánh tả tự vị</i>. Thanh
            Tân. Sài Gòn.
          </li>
          <li className="li1">
            Dương Bá <b>Tuấn</b>楊伯峻。 (2000)。 古漢語虛詞 。 中华書局 。
            北京(弟三印 )。
          </li>
          <li className="li1">
            Đinh Văn <b>Tuấn</b>. (2012). “<i>Quốc Tân La</i>” <i>hay</i> “
            <i>Nước Tân La</i>”?. TC Ngôn ngữ. 1/2012.
          </li>
          <li className="li1">
            Đinh Văn <b>Tuấn</b>. (2011).{" "}
            <i>
              Giải mã bí ẩn SONG VIẾT: SONG VIẾT chính là chiết tự của chữ XƯƠNG
            </i>
            . TC Ngôn ngữ, số 3/2011. tr.58- 71.
          </li>
          <li className="li1">
            Đỗ Thị Bích <b>Tuyển</b>. (2001).{" "}
            <i>Về sự tích “Lộ Đố”, “Lộ Đá” thờ ở Tòng Củ</i>. Trong “Thông báo
            Hán Nôm học – năm 2000”. Viện NC Hán Nôm xb. H.{" "}
          </li>
          <li className="li1">
            Đàm Chí <b>Từ</b>. (2004).{" "}
            <i>
              Tìm hiểu những cống hiến của người Việt và văn hóa Việt Nam đối
              với văn hóa Hán qua tư liệu Hán Nôm và sử liệu Trung Quốc
            </i>
            . Tc Hán Nôm 01/ 2004.
          </li>
          <li className="li1">
            Léon <b>Wieger</b>. (1915). <i>Chinese Characters.</i> Paragon Book
            Reprint Corp. New York. Dover Publications. Inc., New York.
          </li>
          <li className="li1">
            Trần Lê <b>Văn</b>. (1989).{" "}
            <i>Về một vài trường hợp hiệu đính và phiên âm thơ Nôm</i>. TC Hán
            Nôm. Số 2 (7). Tr.28- 30.
          </li>
          <li className="li1">
            Nguyễn Hùng <b>Vĩ</b>. (2005).{" "}
            <i>Hai chữ NHÀ CẢ trong bài thơ “Tùng” của Nguyễn Trãi</i>. Thông
            tin Đại học Quốc Gia. số 2 /2005. tr.34.
          </li>
          <li className="li1">
            Nguyễn Hùng <b>Vĩ</b>. (2010).{" "}
            <i>
              Những ghi chép chữ nghĩa khi đọc Quốc âm thi tập của Nguyễn Trãi
            </i>
            . Trong <i>Thông báo Hán Nôm học 2009</i>. Nxb. KHXH. H.
          </li>
          <li className="li1">
            Nguyễn Hùng <b>Vĩ</b>, Trần Trọng Dương. (2010).{" "}
            <i>
              Những ghi chép chữ nghĩa khi đọc <b>Quốc âm thi tập</b> của Nguyễn
              Trãi
            </i>
            (bài bị cắt 1/2). Trong “Văn học, Phật giáo với 1000 năm Thăng Long
            - Hà Nội”. Nxb. VHTT. Tp HCM. tr.653- 664. tb.2011b. (bản đầy đủ).
            Trong &quot;Người đọc &amp; Công chúng nghệ thuật đương đại&quot;.
            Nxb. Đại học Quốc gia Hà Nội. H. tr.320- 342.
          </li>
          <li className="li1">
            Nguyễn Hùng <b>Vĩ</b>. (1998).{" "}
            <i>Về bài thơ “Cây chuối” của Nguyễn Trãi</i>. TC Văn học. 4/1998.
          </li>
          <li className="li1">
            Nguyễn Hùng <b>Vĩ</b>. (2009). <i>Nguyễn Trãi và Sex</i>. TC. Văn
            hóa Nghệ An.
          </li>
          <li className="li1">
            Nguyễn Hùng <b>Vĩ</b>. (2011a).{" "}
            <i>Giới hạn của người đọc qua trường hợp cụ thể.</i> Trong “Người
            đọc &amp; Công chúng nghệ thuật đương đại”. Nxb. Đại học Quốc gia Hà
            Nội. H. tr.343- 350.
          </li>
          <li className="li1">
            Nguyễn Đại Cồ <b>Việt</b>. (2009).{" "}
            <i>
              Từ thí dụ cụ thể <b>thị</b>-<b>chợ</b> bàn về âm Hán Nôm hóa
            </i>
            . TC Ngôn ngữ, số 10/2009.
          </li>
          <li className="li1">
            Nguyễn Đại Cồ <b>Việt</b>. (2010).{" "}
            <i>Vài suy nghĩ về phân tầng lịch sử âm Hán Nôm hóa.</i> TC Ngôn
            ngữ, số 05/2010. tr.69-77.
          </li>
          <li className="li1">
            Nguyễn Đại Cồ <b>Việt</b> (阮大瞿越)。 (2011).
            十七世纪越南汉字音(A类) 研究 。 (LATS). Đại học Bắc Kinh。
          </li>
          <li className="li1">
            Nguyễn Đại Cồ <b>Việt</b>. (2011).{" "}
            <i>Về sự đối ứng ung- uông trong âm Hán Việt và âm Hán Nôm hóa</i>.
            TC Ngôn ngữ. số 4/ 2011. tr. 10 - 18.
          </li>
          <li className="li1">(1999) 。《辭源》。 商務印書館。上海。</li>
          <li className="li1">(2001) 。《 辭海》。 商務印書館。上海。</li>
          <li className="li1">
            {" "}
            (2004- 2006)。<b>Hán điển</b> 漢典 www.zdic.net
            。商务代理：索宝国际有限公司 (Sopro International Company Limited)
            。
          </li>
          <li className="li1">
            Từ Trung Thư 徐中舒。 (1995) 。《漢語大字典》(Hán ngữ đại tự
            điển)。四川辞书出版社 - 湖北辞书出版社。
          </li>
        </ol>
      </div>
    </div>
  );
}
