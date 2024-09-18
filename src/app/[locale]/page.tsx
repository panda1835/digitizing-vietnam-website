import { useTranslations } from "next-intl";
import { Link } from "../../i18n/routing";

import ImageSlideshow from "../../components/ImageSlideshow";
const Home = ({ params: { locale } }) => {
  const t = useTranslations();

  // Define your slides data
  const slides = [
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Cuon_thu_Chua_Thang_Nghiem_(1).jpeg",
      caption: {
        vi: "Cuốn thư ở Chùa Thắng Nghiêm, bộ sưu tập Hán-Nôm",
        en: "A wooden strolled placard at the Thang Nghiem Temple, Han-Nom Collection",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Muong_s_house,_Vietnamese_Studies_Journal,_Vol_32,_Ethnography.png",
      caption: {
        vi: "Mô hình nhà người Mường, Chuyên Đề Nghiên Cứu Việt Nam - Dân Tộc Học, số 32 ",
        en: "A map of Mường's house in Vietnamese Studies Journal, Ethnography, vol. 32",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Nữ_Giới_Chung_-_Header.png",
      caption: {
        vi: "Đề báo Nữ Giới Chung, số 1",
        en: "A snapshot of the first page of Nữ Giới Chung newspaper, vol.1",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Nữ_Giới_Chung_-_Quảng_Cáo_1.png",
      caption: {
        vi: "Quảng cáo nữ trang, báo Nữ Giới Chung, số 5",
        en: "An advertisement of a jewelery shop in Nữ Giới Chung newspaper, vol. 5",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Nữ_Giới_Chung_-_Quảng_Cáo_2.png",
      caption: {
        vi: "Quảng cáo thuốc lá, báo Nữ Giới Chung, số 1",
        en: "An advertisement of a cigarette shop in Nữ Giới Chung newspaper, vol.1",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Nữ_Giới_Chung_-_Quảng_Cáo_3.png",
      caption: {
        vi: "Quảng cáo xe đạp, báo Nữ Giới Chung, số 1",
        en: "An advertisement of a bicycle shop in Nữ Giới Chung newspaper, vol.1",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Saigon_Chronicles_-_Negotiating_Modernity.png",
      caption: {
        vi: "Chợ Tân Mỹ, bộ sưu tập phim ngắn Chuyện Sài Gòn ",
        en: "Tân Mỹ market, Saigon Chronicles",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Saigon_Chronicles_-_Wild_Style_Graffiti_in_Saigon_(4).png",
      caption: {
        vi: "Nghệ sĩ graffiti đường phố hoạt động trong hẻm Sài Gòn, bộ sưu tập phim ngắn Chuyện Sài Gòn",
        en: "Graffiti artist working in Sài Gòn's alley, Saigon Chronicles",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Thu_Kinh_Dai_Toan.jpeg",
      caption: {
        vi: 'Một trang trong "Thư Kinh Đại Toàn", bộ sưu tập Hán-Nôm',
        en: 'A page in "Thu Kinh Dai Toan", Han-Nom Collection',
      },
    },
  ];

  return (
    <div className="flex flex-col items-center max-width w-full">
      <div className="flex-col mb-20 px-5 w-full">
        {/* Header */}
        <section className="flex-col text-center mb-10">
          <h1>Digitizing Việt Nam</h1>
          <p className="text-gray-500">{t("Home.welcome-subtitle")}</p>
        </section>

        {/* Slideshow */}
        <section className="w-full mb-20 bg-gradient-to-b from-white to-primary-blue">
          <ImageSlideshow slides={slides} locale={locale} />
        </section>

        {/* Content */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 my-5 md:my-10">
          <div className="">
            <img
              className="object-cover rounded-lg w-full h-40"
              src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Home+Page+1.png"
              alt="About Digitizing Vietnam"
            ></img>
            <div className=" flex flex-col items-center md:items-start">
              <Link href="/about-us" className="mt-5">
                <h2>{t("Home.about-digitizing-vietnam")}</h2>
              </Link>
              <p className="mb-5">
                {t("Home.about-digitizing-vietnam-content")}
              </p>
              <Link href="/about-us" className="button">
                {t("Button.learn-more")}
              </Link>
            </div>
          </div>

          <div className="">
            <img
              className="object-cover rounded-lg w-full h-40"
              src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Home+Page+2.jpg"
              alt="Our Collections"
            ></img>
            <div className=" flex flex-col items-center md:items-start">
              <Link href="/our-collections" className="mt-5">
                <h2>{t("Home.our-collections")}</h2>
              </Link>
              <p className="mb-5">{t("Home.our-collections-content")}</p>
              <Link href="/our-collections" className="button">
                {t("Button.learn-more")}
              </Link>
            </div>
          </div>

          <div className="">
            <img
              className="object-cover rounded-lg w-full h-40"
              src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Home+Page+3.png"
              alt="Our Blog"
            ></img>
            <div className=" flex flex-col items-center md:items-start">
              <Link href="/blogs" className="mt-5">
                <h2>{t("Home.our-blog")}</h2>
              </Link>
              <p className="mb-5">{t("Home.our-blog-content")}</p>
              <Link href="/blogs" className="button">
                {t("Button.learn-more")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
