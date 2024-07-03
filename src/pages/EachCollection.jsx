import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import BookItem from "../components/BookItem";
import Item from "../components/Item";

import config from "../config";
import { t } from "i18next";
const EachCollection = () => {
  const { i18n } = useTranslation();

  const { collectionId } = useParams();
  const [collectionData, setCollectionData] = useState({});
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loadingCollectionData, setLoadingCollectionData] = useState(true);
  const [loadingFeaturedArticles, setLoadingFeaturedArticles] = useState(true);

  const handleLoadMoreClick = () => {};

  useEffect(() => {
    fetch(
      `${config["api"]["collections"]}/${collectionId}?lang=${i18n.language}`
    )
      .then((response) => response.json())
      .then((data) => {
        setCollectionData(data["data"]);
        setLoadingCollectionData(false);
      })
      .catch(() => {
        setLoadingCollectionData(false);
      });
  }, [collectionId, i18n.language]);

  useEffect(() => {
    fetch(`${config["api"]["blogs"]}?related-collection=${collectionId}`)
      .then((response) => response.json())
      .then((data) => {
        setFeaturedArticles(data["data"]);
        setLoadingFeaturedArticles(false);
      })
      .catch(() => {
        setLoadingFeaturedArticles(false);
      });
  }, [collectionId]);

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 mx-5">
        {/* Banner */}
        <section
          className="bg-no-repeat bg-cover bg-center w-full h-80 flex flex-col items-center justify-center rounded-lg relative"
          style={{
            backgroundImage: `url(${collectionData.image_url})`,
          }}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <h1 className="text-white relative z-10">{collectionData.title}</h1>

          {/* Navigation buttons */}
          <div className="flex relative z-10">
            <div className="m-5">
              <button
                className=""
                onClick={() => {
                  document
                    .getElementById("our-volumes")
                    .scrollIntoView({ behavior: "smooth" });
                }}
              >
                {t("each-collection-our-volumes")}
              </button>
            </div>

            <div className="m-5">
              <button
                className=""
                onClick={() => {
                  document
                    .getElementById("feature-articles")
                    .scrollIntoView({ behavior: "smooth" });
                }}
              >
                {t("each-collection-featured-articles")}
              </button>
            </div>
          </div>
        </section>

        {/* Collection information */}
        <div className="my-10">{collectionData.description}</div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center mt-10">
          <div
            className={`loader ${
              loadingCollectionData || loadingFeaturedArticles
                ? "visible"
                : "hidden"
            } `}
          ></div>
        </div>

        {/* Item gallery */}
        <div>
          <h1 id="our-volumes">{t("each-collection-our-volumes")}</h1>
          <div className="grid grid-cols-3 gap-8 mt-10">
            {collectionData &&
              collectionData.documents &&
              collectionData.documents.map((item) => (
                <BookItem
                  title={item.title}
                  description={""}
                  imageUrl={item.image_url}
                  link={`/our-collections/${collectionId}/${item.document_id}`}
                  key={`/our-collections/${collectionId}/${item.document_id}`}
                />
              ))}
          </div>

          {collectionData.documents && collectionData.documents.length === 0 && (
            <div className="flex mb-10">
              <p>{t("no-volume-found")}</p>
            </div>
          )}

          {collectionData.documents && collectionData.documents.length > 0 && (
            <div className="flex flex-row justify-center my-5">
              <button className="" onClick={handleLoadMoreClick}>
                {t("btn-load-more")}
              </button>
            </div>
          )}
        </div>

        {/* Featured articles */}
        <section>
          <h1 id="feature-articles">
            {t("each-collection-featured-articles")}
          </h1>
          <div className="grid grid-cols-3 gap-8 mt-10">
            {featuredArticles &&
              featuredArticles &&
              featuredArticles.map((item) => (
                <Item
                  title={item.title}
                  description={""}
                  imageUrl={item.image_url}
                  link={`/blogs/${item.blog_id}`}
                  key={`/blogs/${item.blog_id}`}
                />
              ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EachCollection;
