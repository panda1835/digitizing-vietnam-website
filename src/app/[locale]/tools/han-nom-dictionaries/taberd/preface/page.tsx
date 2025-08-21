import { Merriweather } from "next/font/google";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export default function Introduction({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div>
      {locale === "vi" ? (
        <div>
          <div
            className={`${merriweather.className} text-branding-black text-4xl`}
          >
            Lời dẫn
          </div>
          <div className="font-['Helvetica_Neue'] font-light text-lg mt-6">
            <p className="pt-5">
              Dictionarium Anamitico Latinum (Từ điển Taberd) được xuất bản lần
              đầu tiên vào năm 1838 tại nhà in của J.Marshnam ở Serampore Ấn Độ.
              Và lần tái bản gần đây nhất năm 2004, do Trung tâm nghiên cứu Quốc
              học và Nhà xuất bản Văn học hợp tác xuất bản. Đây là cuốn từ điển
              cổ, quý hiếm ghi lại chữ Nôm, tiếng Việt cách ngày nay khoảng 200
              năm, điều đặc biệt là do một Giám mục người Pháp AJ.L Taberd biên
              soạn. Từ điền Taberd có một vị trí và giá trị to lớn trong việc
              tìm hiểu, nghiên cứu, bảo tồn kho tàng tiếng Việt, chữ Nôm, đặt
              biệt trong đó có nhiều từ ngữ cổ mà ngày nay tiếng Việt không còn
              sử dụng nữa. Do vậy, việc tái hiện, số hoá xây dựng thành tài liệu
              điện tử theo nguyên bản là rất cần thiết, nhằm lưu trữ, bảo tồn,
              quảng bá rộng rãi.
            </p>
            <p className="pt-5">
              Từ điển Taberd trực tuyến được xây dựng dựa theo bản in lại năm
              2004, với phương pháp số hoá ở dạng ảnh, mục đích nhằm tái hiện
              nguyên bản. Có thể nói đây là một công cụ tra cứu rất hữu ích đối
              với những người nghiên cứu khoa học xã hội nhân văn nói chung và
              những người nghiên cứu ngôn ngữ văn tự đặc biệt là chữ Nôm nói
              riêng. Từ điển Taberd được thực hiện với mục đích tra cứu trực
              tuyến theo nguyên bản dạng ảnh. Ngoài phần dẫn nhập và chỉ dẫn,
              chúng tôi tập trung xây dựng công cụ tra cứu cho hai mục chính:
            </p>
            <ol className="pt-5 list-decimal list-inside">
              <li>Phần tra theo bộ thủ</li>
              <li>Phần tra theo âm quốc ngữ</li>
            </ol>
            <p className="pt-5">
              Phần tra theo bộ thủ người sử dụng chỉ cần tra theo bộ thủ và số
              nét còn lại thì chương trình sẽ tự động tìm đúng chữ đó theo
              trang, cột; phần tra theo vần abc có khác một chút, người dùng chỉ
              việc nhập từ quốc ngữ cần tìm kiếm. Đặc biệt ở phần sau cuốn từ
              điển liệt kê tên các vị thuốc đông y xuất hiện ở vùng An Nam thời
              kì đó và một số mục khác như danh mục bộ thủ, bản đồ… Điều đáng
              lưu ý, từ điển Taberd ghi lại tiếng Việt, chữ Nôm cuối thế kỉ 18
              đầu thế kỉ 19, do vậy có nhiều chữ quốc ngữ được ghi khá cổ như:
              ym, yả, luựt, khuia, khuiếch, huiên…Hi vọng, cuốn e-book sẽ giúp
              các độc giả dễ dàng hơn trong việc tra cứu, tìm kiếm thông tin và
              đây sẽ là công cụ thiết thực với những người đã và đang học tập,
              nghiên cứu ngôn ngữ, văn tự Việt Nam. Từ điển Taberd trực tuyến sẽ
              không tránh khỏi những sai sót. Chúng tôi rất mong nhận được những
              ý kiến đóng góp quý báu từ các bạn độc giả trong và ngoài nước để
              chương trình được hoàn thiện hơn.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div
            className={`${merriweather.className} text-branding-black text-4xl`}
          >
            Preface
          </div>
          <div className="font-['Helvetica_Neue'] font-light text-lg mt-6">
            <p className="pt-5">
              The first fascicle or installment of the Dictionarium Anamitico
              Latinum was published by the J.Marshnam printing house in 1884
              (Serampore, India). And, the most recent edition was 2004 with the
              publishing support by Center for National Culture Studies and
              Literature Publishing House. This is an old and precious
              dictionary which recorded Nom script or Quoc Ngu script existed
              200 years ago. One special thing is that this dictionary was
              composed by a French bishop named AJ.L Taberd. Taberd dictionary
              has come to be regarded as authoritative and in order to learn,
              research and preserve the treasure of Quoc Ngu and Nom scripts.
              Furthermore, this dictionary contains a considerable amount of old
              words which may not be found in Vietnamese language nowadays.
              Thus, the purpose of digitizing and building e book for original
              Taberd dictionary is very essential to store, preserve and
              broadcast extensively. Online Taberd dictionary has been built
              relying on the reprint version in the year of 2004 with the method
              of digitizing image pages of Taberd dictionary on the basis of
              origin. Again, it should be noted that this is very useful lookup
              tool for scholars, researchers in the sphere of social science in
              general and researchers in the field of special language like Nom
              script in particular.
            </p>
            <p className="pt-5">
              Online Taberd dictionary is formed with an aim to searching
              through directly glyphs in accordance with original images. Apart
              from the plague and instruction parts, we focus on structuring
              lookup tool with two main parts:
            </p>
            <ol className="pt-5 list-decimal list-inside">
              <li>Radical-stroke search</li>
              <li>Quoc Ngu search</li>
            </ol>
            <p className="pt-5">
              As for radical stroke lookup, the users just need to set the
              parameters for a radical-stroke search of the on-line Taberd
              dictionary’ database, the remaining strokes will be automatically
              located following the number of pages, columns by the program. In
              term of Quoc Ngu lookup, there exists a little bit differences,
              the readers just have to type Quoc ngu glyphs that they want to
              search.
            </p>
            <p className="pt-5">
              Notably, in the later parts of the dictionary, we add further
              lookup tool for names of medicinal herbs, plants appeared in An
              Nam at that period or other articles such as radical stroke
              catalogue, maps…One thing to note is that Taberd dictionary
              illustrates Quoc Ngu and Nom scripts from the late eighteenth
              century and early nineteenth century. Thus, many old Vietnamese
              characters are also identified (e.g. ym, yả, luựt, khuia, khuiếch,
              huiên). Hoping that this e book will provide the readers with much
              more easier access in the work of searching information. This also
              will be a practical, user-friendly tool for people who have
              passion for learning, researching language or Vietnamese writing.
            </p>
            <p className="pt-5">
              However, in the process of building online Taberd dictionary,
              errors are inevitable and we look forward with deep-felt thanks to
              absorbing valuable contributions from all the readers inside and
              outside the country in further improving this e-dictionary.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
