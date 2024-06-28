import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 px-5 w-full">
        {/* Header */}
        <section className="flex-col text-center mb-10">
          <h1>Digitizing Vietnam</h1>
          <p className="text-gray-500">{t("home-welcome-subtitle")}</p>
        </section>

        <section className="flex flex-col md:flex-row justify-evenly items-center my-5 md:my-10">
          <div className="md:w-96">
            <img
              className="my-5"
              src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Home+Page+1.png"
              alt="About Digitizing Vietnam"
            ></img>
          </div>
          <div className="md:w-96 flex flex-col items-center md:items-start">
            <h2>{t("home-about-digitizing-vietnam")}</h2>
            <p className="mb-5">{t("home-about-digitizing-vietnam-content")}</p>
            <Link to="/about-us" className="button">
              {t("btn-learn-more")}
            </Link>
          </div>
        </section>

        <section className="flex flex-col md:flex-row justify-evenly items-center my-5 md:my-10">
          <div className="md:w-96 order-1 md:order-2">
            <img
              className="my-5"
              src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Home+Page+2.jpg"
              alt="Our Collections"
            ></img>
          </div>
          <div className="md:w-96 flex flex-col items-center md:items-start order-2 md:order-1">
            <h2>{t("home-our-collections")}</h2>
            <p className="mb-5">{t("home-our-collections-content")}</p>
            <Link to="/our-collections" className="button">
              {t("btn-learn-more")}
            </Link>
          </div>
        </section>

        <section className="flex flex-col md:flex-row justify-evenly items-center my-5 md:my-10">
          <div className="md:w-96">
            <img
              className="my-5"
              src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Home+Page+3.png"
              alt="Our Blog"
            ></img>
          </div>
          <div className="md:w-96 flex flex-col items-center md:items-start">
            <h2>{t("home-our-blog")}</h2>
            <p className="mb-5">{t("home-our-blog-content")}</p>
            <Link to="/blogs" className="button">
              {t("btn-learn-more")}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
