import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center max-width">
      {/* Header */}
      <section className="flex-col text-center mb-20 mx-5">
        <h1>Digitizing Vietnam</h1>
        <p className="text-gray-500">{t("home-welcome-subtitle")}</p>
      </section>

      <section className="flex flex-row w-full justify-around items-center mb-10">
        <div>
          <h2>{t("home-about-digitizing-vietnam")}</h2>
          <p className="w-96 mb-5">
            {t("home-about-digitizing-vietnam-content")}
          </p>
          <Link to="/about-us" className="button">
            {t("btn-learn-more")}
          </Link>
        </div>

        <div>
          <img
            className="w-96"
            src="https://www.lrsoc.com/web/wp-content/uploads/2021/01/Placeholder-shop.jpg"
            alt="About Digitizing Vietnam"
          ></img>
        </div>
      </section>

      <section className="flex flex-row w-full justify-around items-center mb-10">
        <div>
          <img
            className="w-96"
            src="https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/Home+Page+2.jpg"
            alt="Our Collections"
          ></img>
        </div>

        <div>
          <h2>{t("home-our-collections")}</h2>
          <p className="w-96 mb-5">{t("home-our-collections-content")}</p>
          <Link to="/our-collections" className="button">
            {t("btn-learn-more")}
          </Link>
        </div>
      </section>

      <section className="flex flex-row w-full justify-around items-center mb-10">
        <div>
          <h2>{t("home-our-blog")}</h2>
          <p className="w-96 mb-5">{t("home-our-blog-content")}</p>
          <Link to="/blogs" className="button">
            {t("btn-learn-more")}
          </Link>
        </div>

        <div>
          <img
            className="w-96"
            src="https://www.lrsoc.com/web/wp-content/uploads/2021/01/Placeholder-shop.jpg"
            alt="Our Blog"
          ></img>
        </div>
      </section>
    </div>
  );
};

export default Home;
