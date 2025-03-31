"use client";

import Image from "next/image";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useState } from "react";
import { Merriweather } from "next/font/google";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const ImageSlideshow = ({ slides, locale }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

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
    customPaging: (i) => (
      <div className="h-3 w-3 bg-[#CCCCCC] hover:bg-branding-brown rounded-full transition-colors duration-300"></div>
    ),
    appendDots: (dots) => (
      <div style={{ width: "100%" }}>
        <ul style={{ margin: "-10px" }}>{dots}</ul>
      </div>
    ),
  };

  return (
    <div className="relative">
      <Slider {...settings}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className="relative h-[600px]"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <Image
              unoptimized
              src={slide.img || "/placeholder.svg"}
              alt={slide.caption[locale]}
              className="object-cover h-[600px] w-full"
              width={1920}
              height={1080}
              style={{ maxHeight: "100%", maxWidth: "100%" }}
            />
            {hoveredIndex === index && (
              <div className="absolute bottom-0 w-full bg-black bg-opacity-50 flex items-center transition-opacity duration-500">
                <p
                  className={`text-white text-lg p-8 text-left ${merriweather.className}`}
                >
                  {slide.caption[locale]}
                </p>
              </div>
            )}
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ImageSlideshow;
