"use client";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const ImageSlideshow = ({ slides, locale }) => {
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
    autoplay: true,
    autoplaySpeed: 5000,
    cssEase: "linear",
  };

  return (
    <div>
      <Slider {...settings}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className="text-center h-72 flex flex-col justify-center items-center"
          >
            {/* Ensure the image is centered within its container */}
            <img
              src={slide.img}
              alt={slide.caption[locale]}
              className="mx-auto object-cover h-72 w-full"
              style={{ maxHeight: "100%", maxWidth: "100%" }}
            />
            <p className="text-white">{slide.caption[locale]}</p>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ImageSlideshow;
