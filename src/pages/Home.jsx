import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Home = () => {
  const { t } = useTranslation();

  // Define your slides data
  const slides = [
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Cuon+thu+Chua+Thang+Nghiem+(1).jpeg",
      description: "Image 1 Description",
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Muong's+house%2C+Vietnamese+Studies+Journal%2C+Vol+32%2C+Ethnography.png",
      description: "Image 2 Description",
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Nu%CC%9B%CC%83+Gio%CC%9B%CC%81i+Chung+-+Header.png",
      description: "Image 3 Description",
    },
  ];

  // Slider settings
  const settings = {
    dots: true,
    infinite: true,
    adaptiveHeight: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: "0px",
  };

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 px-5 w-full">
        {/* Header */}
        <section className="flex-col text-center mb-10">
          <h1>Digitizing Việt Nam</h1>
          <p className="text-gray-500">{t("home-welcome-subtitle")}</p>
        </section>

        {/* Slideshow */}
        <section className="w-full">
          <Slider {...settings}>
            {slides.map((slide, index) => (
              <div
                key={index}
                className="text-center h-72 flex flex-col justify-center items-center"
              >
                {/* Ensure the image is centered within its container */}
                <img
                  src={slide.img}
                  alt={`Slide ${index + 1}`}
                  className="mx-auto object-contain"
                  style={{ maxHeight: "100%", maxWidth: "100%" }}
                />
                <p>{slide.description}</p>
              </div>
            ))}
          </Slider>
        </section>

        <section className="flex">
          <div className="flex flex-col justify-between items-center my-5 md:my-10">
            <div className="md:w-96">
              <img
                className="my-5"
                src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Home+Page+1.png"
                alt="About Digitizing Vietnam"
              ></img>
            </div>
            <div className="md:w-96 flex flex-col items-center md:items-start">
              <Link to="/about-us" className="">
                <h2>{t("home-about-digitizing-vietnam")}</h2>
              </Link>
              <p className="mb-5">
                {t("home-about-digitizing-vietnam-content")}
              </p>
              <Link to="/about-us" className="button">
                {t("btn-learn-more")}
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center my-5 md:my-10 mx-10">
            <div className="md:w-96">
              <img
                className="my-5"
                src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Home+Page+2.jpg"
                alt="Our Collections"
              ></img>
            </div>
            <div className="md:w-96 flex flex-col items-center md:items-start order-2 md:order-1">
              <Link to="/our-collections" className="">
                <h2>{t("home-our-collections")}</h2>
              </Link>
              <p className="mb-5">{t("home-our-collections-content")}</p>
              <Link to="/our-collections" className="button">
                {t("btn-learn-more")}
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center my-5 md:my-10">
            <div className="md:w-96">
              <img
                className="my-5"
                src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Home+Page+3.png"
                alt="Our Blog"
              ></img>
            </div>
            <div className="md:w-96 flex flex-col items-center md:items-start">
              <Link to="/blogs" className="">
                <h2>{t("home-our-blog")}</h2>
              </Link>
              <p className="mb-5">{t("home-our-blog-content")}</p>
              <Link to="/blogs" className="button">
                {t("btn-learn-more")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
