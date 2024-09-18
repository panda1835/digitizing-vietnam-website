import { useTranslations } from "next-intl";
import Image from "next/image";

const AboutUs = ({ params: { locale } }) => {
  const t = useTranslations("AboutUs");

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 mx-5">
        <h1 className="flex justify-center">{t("title")}</h1>

        <h2>{locale === "en" ? "Our Mission" : "Sứ mệnh"}</h2>

        <p className="mb-5">
          {locale === "en"
            ? "Digitizing Vietnam (DV) is the first joint web platform project following the establishment of the Columbia University - Fulbright University Vietnam partnership. The DV web platform is a free and open-to-public-use digital Vietnam Studies platform that aims to be the well-integrated hub for digital humanities research."
            : "Digitizing Việt Nam (DV) là dự án nền tảng web chung đầu tiên sau khi quan hệ đối tác giữa Đại học Columbia (Hoa Kỳ )và Đại học Fulbright Việt Nam được thành lập. Nền tảng web DV là một nền tảng kĩ thuật số miễn về Nghiên cứu Việt Nam, miễn phí và mở cho công chúng sử dụng, nhằm mục đích đóng vai trò như một trung tâm tích hợp cho lĩnh vực nghiên cứu nhân văn số."}
        </p>
        <p className="mb-5">
          {locale === "en"
            ? "Functioning as a digital resources hub in the form of a virtual exhibition hall maintained by Columbia University (CU) and the Vietnam Studies Center (VSC) at Fulbright University Vietnam (FUV), DV makes available an extensive archive of digitized premodern manuscript collections and provides a selective catalog for archival and library collections of the modern era originating from Vietnam. DV also serves as a platform for developing advanced digital humanities tools for analysis, beginning with a labeling tool that facilitates the annotation and translation of the pre-modern digital repository to enhance scholarly research."
            : "Hoạt động như một trung tâm dữ liệu số dưới dạng phòng triển lãm ảo được xây dựng bởi Đại học Columbia (CU) và Trung tâm Nghiên cứu Việt Nam (VSC) tại Đại học Fulbright Việt Nam (FUV), DV cung cấp một kho lưu trữ phong phú các bộ sưu tập bản thảo tiền hiện đại được số hóa và cung cấp một danh mục chọn lọc về các bộ sưu tập lưu trữ và các bộ sưu tập thư viện của thời kỳ hiện đại có nguồn gốc từ Việt Nam. DV cũng phục vụ như một nền tảng để phát triển các công cụ nhân văn số tiên tiến để phân tích, bắt đầu bằng công cụ dán nhãn, tạo điều kiện thuận lợi cho việc chú giải và dịch nghĩa của kho tài liệu tiền hiện đại đã được số hoá, nhằm tăng cường hiệu quả các nghiên cứu học thuật liên quan."}
        </p>

        <p className="mb-5">
          {locale === "en"
            ? "With the built-in relationship between Vietnam Studies and Computer Science at FUV, DV supports the development of innovative tools to bring historical preservation in Vietnam to a new level. Founded on the value of collaboration, primarily through the joint initiatives put forward by CU-FUV, DV facilitates cooperation networks and aligns distinct “digitizing Vietnam” efforts, which will transform the field of Vietnamese Studies on a global scale."
            : "Với mối quan hệ gắn kết giữa nghiên cứu Việt Nam và Khoa học Máy tính tại FUV, DV hỗ trợ phát triển các công cụ đổi mới nhằm đưa việc bảo tồn văn hoá lịch sử ở Việt Nam lên một tầm cao mới. Được thành lập dựa trên giá trị của sự hợp tác, chủ yếu thông qua các sáng kiến ​​chung do CU-FUV đưa ra, DV tạo điều kiện cho các mạng lưới hợp tác và cân đối các sáng kiến “số hóa Việt Nam”, nhằm biến đổi lĩnh vực nghiên cứu  Việt Nam học trên quy mô toàn cầu."}
        </p>

        <p className="mb-5">
          {locale === "en"
            ? "In addition to functioning as a digital workbench and repository containing new digital resources and new digital humanities tools, DV during its second and third phases of development will succesively launch the Vietnam for Educators platform and the Understanding Vietnam platform. The former will provide the production of translations, curated images, lessons, and other resources for teaching Vietnam, while the latter will offer online mini-lectures, podcasts, and other materials designed to introduce Vietnam to mainstream audiences."
            : "Ngoài chức năng là một không gian làm việc nghiên cứu cũng như đóng vai trò như một kho lưu trữ kỹ thuật số với các tài nguyên kỹ thuật số và các công cụ nhân văn số mới, DV trong giai đoạn phát triển thứ hai và thứ ba sẽ lần lượt ra mắt nền tảng Vietnam for Educators và nền tảng Understanding Vietnam. Nền tảng Vietnam for Educators sẽ cung cấp các sản phẩm dịch thuật, hình ảnh, bài giảng và các tài nguyên khác nhằm hỗ trợ công tác  giảng dạy về Việt Nam, trong khi đó, nền tảng Understanding Vietnam sẽ cung các bài giảng nhỏ trực tuyến, podcast và các tài liệu khác được thiết kế để giới thiệu Việt Nam với đại chúng."}
        </p>

        <h2>{locale === "en" ? "Core Team" : "Nhóm vận hành chính"}</h2>

        <div className="flex flex-wrap justify-start items-start md:flex-row flex-col">
          <div className="w-full md:w-1/3 flex flex-col items-center mb-5">
            <Image
              unoptimized
              className="w-48 h-48 rounded-full mb-4 object-cover"
              src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Tram+Thi+Phuong+Nguyen.jpg"
              alt="Tram Phuong Nguyen"
            />
            <h3 className="text-xl">
              {locale === "en" ? "Tram Phuong Nguyen" : "Nguyễn Phương Trâm"}
            </h3>
            <p className="px-5">
              {locale === "en" ? "Ph.D. in Ethnology" : "Tiến sĩ Dân tộc học"}
            </p>
            <p className="px-5">
              {locale === "en"
                ? "Digital Curator, Weatherhead East Asian Institute, Columbia University"
                : "Giám tuyển số, Viện Đông Á Weatherhead, Đại học Columbia"}
            </p>
          </div>

          <div className="w-full md:w-1/3 flex flex-col items-center mb-5">
            <Image
              unoptimized
              className="w-48 h-48 rounded-full mb-4 object-cover"
              src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Van+Le.jpg"
              alt="Van Le"
            />
            <h3 className="text-xl">
              {locale === "en" ? "Van Nguyen Tuong Le" : "Lê Nguyễn Tường Vân"}
            </h3>
            <p className="px-5">
              {locale === "en"
                ? "M.A. in Digital Humanities"
                : "Thạc sĩ Nhân văn số"}
            </p>
            <p className="px-5">
              {locale === "en"
                ? "Digital Humanities Librarian, Vietnam Studies Center, Fulbright University Vietnam"
                : "Thủ thư nhân văn số, Trung tâm nghiên cứu Việt Nam, Đại học Fulbright Việt Nam"}
            </p>
          </div>
          <div className="w-full md:w-1/3 flex flex-col items-center mb-5">
            <Image
              unoptimized
              className="w-48 h-48 rounded-full mb-4 object-cover"
              src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Phuc+Le.jpg"
              alt="Phuc Le"
            />
            <h3 className="text-xl">
              {locale === "en" ? "Phuc Hoang Le" : "Lê Hoàng Phúc"}
            </h3>
            <p className="px-5">
              {locale === "en"
                ? "B.S. in Computer Science"
                : "Cử nhân Khoa học máy tính"}
            </p>
            <p className="px-5">
              {locale === "en"
                ? "Digital Architect, Columbia University"
                : "Kỹ sư giải pháp CNTT, Đại học Columbia"}
            </p>
          </div>
        </div>

        <h2>{locale === "en" ? "Advisors" : "Cố vấn"}</h2>
        <div className="flex flex-wrap justify-start items-start md:flex-row flex-col">
          <div className="w-full md:w-1/4 flex flex-col items-center mb-5">
            <Image
              unoptimized
              className="w-48 h-48 rounded-full mb-4 object-cover"
              src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Vu+Minh+Hoang.jpg"
              alt="Hoang Minh Vu"
            />
            <h3 className="text-xl">
              {locale === "en" ? "Hoang Minh Vu" : "Vũ Minh Hoàng"}
            </h3>
            <p className="px-5">
              {locale === "en" ? "Ph.D. in History" : "Tiến sĩ Lịch sử học"}
            </p>
            <p className="px-5">
              {locale === "en"
                ? "Faculty member in History and Vietnam Studies, Fulbright University Vietnam"
                : "Giảng viên Lịch sử và Việt Nam học, Đại học Fulbright Việt Nam"}
            </p>
          </div>

          <div className="w-full md:w-1/4 flex flex-col items-center mb-5">
            <Image
              unoptimized
              className="w-48 h-48 rounded-full mb-4 object-cover"
              src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/John+Phan.png"
              alt="John Phan"
            />
            <h3 className="text-xl">
              {locale === "en" ? "John Phan" : "John Phan"}
            </h3>
            <p className="px-5">
              {locale === "en"
                ? "Ph.D. in East & Southeast Asian Language History"
                : "Tiến sĩ Lịch sử ngôn ngữ Đông Á và Đông Nam Á"}
            </p>
            <p className="px-5">
              {locale === "en"
                ? "Assistant Professor, Director of Undergraduate Studies, EALAC, Columbia University"
                : "Phó Giáo sư, Chủ nhiệm Nghiên cứu Đại học, Khoa Ngôn ngữ văn hoá Đông Á, Đại học Columbia"}
            </p>
          </div>
          <div className="w-full md:w-1/4 flex flex-col items-center mb-5">
            <Image
              unoptimized
              className="w-48 h-48 rounded-full mb-4 object-cover"
              src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Lien+Hang+T.+Nguyen.png"
              alt="Lien-Hang Nguyen"
            />
            <h3 className="text-xl">
              {locale === "en" ? "Lien-Hang Nguyen" : "Lien-Hang Nguyen"}
            </h3>
            <p className="px-5">
              {locale === "en" ? "Ph.D. in History" : "Tiến sĩ Lịch sử"}
            </p>
            <p className="px-5">
              {locale === "en"
                ? "Assistant Professor, Director of the Weatherhead East Asian Institute, Columbia University"
                : "Phó giáo sư, Viện trưởng Viện Đông Á Weatherhead, Đại học Columbia"}
            </p>
          </div>

          <div className="w-full md:w-1/4 flex flex-col items-center mb-5">
            <Image
              unoptimized
              className="w-48 h-48 rounded-full mb-4 object-cover"
              src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Nguyen+Nam.jpg"
              alt="Nam Nguyen"
            />
            <h3 className="text-xl">
              {locale === "en" ? "Nam Nguyen" : "Nguyễn Nam"}
            </h3>
            <p className="px-5">
              {locale === "en"
                ? "Ph.D. in East Asian Languages and Civilizations"
                : "Tiến sĩ Ngôn ngữ và Văn minh Đông Á"}
            </p>
            <p className="px-5">
              {locale === "en"
                ? "Professor, Director of the Vietnam Studies Center, Fulbright University Vietnam"
                : "Giám đốc Trung tâm Nghiên cứu Việt Nam, Đại học Fulbright Việt Nam"}
            </p>
          </div>
        </div>

        <h2>{locale === "en" ? "Institutional Support" : "Đơn vị hỗ trợ"}</h2>

        <ul className="mb-5 list-disc ml-5">
          <li>
            {locale === "en" ? "Columbia University" : "Đại học Columbia"}
          </li>
          <li>
            {locale === "en"
              ? "Fulbright University Vietnam"
              : "Đại học Fulbright Việt Nam"}
          </li>
          <li>
            {locale === "en"
              ? "École Pratiques des Hautes Études, Paris"
              : "Trường Thực hành Nghiên cứu Nâng cao, Paris"}
          </li>
          <li>
            {locale === "en"
              ? "Institute of Sino-Nom Studies"
              : "Viện nghiên cứu Hán Nôm"}
          </li>
          <li>
            {locale === "en"
              ? "Vietnam State Archives"
              : "Cục Văn thư và Lưu trữ nhà nước (Việt Nam)"}
          </li>
          <li>
            {locale === "en"
              ? "Vietnam National University Ho Chi Minh University of Science"
              : "Đại học Khoa học Tự nhiên, Đại học Quốc gia thành phố Hồ Chí Minh"}
          </li>
        </ul>

        <h2>{locale === "en" ? "Funding" : "Nguồn tài trợ"}</h2>
        <p className="mb-5">
          {locale === "en"
            ? "In August 2023, the Weatherhead East Asia Institute at Columbia University was awarded a"
            : "Vào tháng 8 năm 2023, Viện Đông Á Weatherhead thuộc Đại học Columbia đã nhận được khoản tài trợ"}{" "}
          <a
            href="https://www.hluce.org/programs/asia/grant-categories/luce-initiative-southeast-asia/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500"
          >
            LuceSEA
          </a>{" "}
          {locale === "en" ? "grant from the" : "từ Quỹ"}{" "}
          <a
            href="https://www.hluce.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500"
          >
            Henry Luce Foundation
          </a>{" "}
          {locale === "en"
            ? "to support Digitizing Vietnam: The Virtual Future of Global Vietnam and the Vietnamese Studies Project."
            : "để hỗ trợ dự án Số hóa Việt Nam: Tương lai ảo của Việt Nam toàn cầu và Dự án Nghiên cứu Việt Nam."}{" "}
        </p>

        <h2>{locale === "en" ? "Our Collections" : "Bộ sưu tập"}</h2>
        <p className="mb-5">
          {locale === "en"
            ? "The Digitizing Vietnam Collections consist of the digitized pre-modern Han-Nom manuscript collections, modern era Vietnamese Studies collections including but not limited to history studies content, linguistics, ethnology/cultural anthropology, Vietnamese early-20th-century journals as well as collections of Vietnamese contemporary music and folk music."
            : "Bộ sưu tập Digitizing Việt Nam bao gồm các bộ sưu tập bản thảo Hán Nôm tiền hiện đại được số hóa, các bộ sưu tập Việt Nam học thời kỳ hiện đại bao gồm những nội dung nghiên cứu lịch sử, ngôn ngữ học, dân tộc học/nhân học văn hóa, các tạp chí tiếng Việt đầu thế kỷ 20 cũng như các bộ sưu tập về âm nhạc đương đại và âm nhạc dân gian Việt Nam."}
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
