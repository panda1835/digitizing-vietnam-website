import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";

import Item from "../components/Item";
import SearchBar from "../components/SearchBar";

import config from "../config";
const EachCollection = () => {
  const { collectionId } = useParams();
  const [collectionData, setCollectionData] = useState({});
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loadingCollectionData, setLoadingCollectionData] = useState(true);
  const [loadingFeaturedArticles, setLoadingFeaturedArticles] = useState(true);

  useEffect(() => {
    fetch(config["api"]["collection_by_id"])
      .then((response) => response.json())
      .then((data) => {
        setCollectionData(data);
        setLoadingCollectionData(false);
      })
      .catch(() => {
        setCollectionData({
          title: "Vietnamese Studies Journal Collections",
          description:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.",
          imageUrl: "https://via.placeholder.com/500",
          items: [
            {
              id: "volume-1",
              title: "Volume 1",
              imageUrl: "https://via.placeholder.com/500",
            },
            {
              id: "volume-2",
              title: "Volume 2",
              imageUrl: "https://via.placeholder.com/500",
            },
            {
              id: "volume-3",
              title: "Volume 3",
              imageUrl: "https://via.placeholder.com/500",
            },
            {
              id: "volume-4",
              title: "Volume 4",
              imageUrl: "https://via.placeholder.com/500",
            },
            {
              id: "volume-5",
              title: "Volume 5",
              imageUrl: "https://via.placeholder.com/500",
            },
            {
              id: "volume-6",
              title: "Volume 6",
              imageUrl: "https://via.placeholder.com/500",
            },
            {
              id: "volume-7",
              title: "Volume 7",
              imageUrl: "https://via.placeholder.com/500",
            },
          ],
        });
        setLoadingCollectionData(false);
      });
  }, [collectionId]);

  useEffect(() => {
    fetch(config["api"]["blog_by_collection"])
      .then((response) => response.json())
      .then((data) => {
        setFeaturedArticles(data);
        setLoadingFeaturedArticles(false);
      })
      .catch(() => {
        setFeaturedArticles([
          {
            id: "article-1",
            title: "Article 1",
            imageUrl: "https://via.placeholder.com/500",
          },
          {
            id: "article-2",
            title: "Article 2",
            imageUrl: "https://via.placeholder.com/500",
          },
          {
            id: "article-3",
            title: "Article 3",
            imageUrl: "https://via.placeholder.com/500",
          },
        ]);
        setLoadingFeaturedArticles(false);
      });
  }, [collectionId]);

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 mx-5">
        {/* Banner */}
        <section
          className="bg-no-repeat bg-cover bg-center w-full h-80 flex flex-col items-center justify-center rounded-lg"
          style={{ "background-image": `url(${collectionData.imageUrl})` }}
        >
          <h1>{collectionData.title}</h1>
          <p className="text-white mx-10">{collectionData.description}</p>
        </section>

        {/* Search bar */}
        <SearchBar />

        {/* Loading indicator */}
        <div className="flex items-center justify-center">
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
          <h1>Our Volumes</h1>
          <div className="grid grid-cols-3 gap-8 mt-10">
            {collectionData &&
              collectionData.items &&
              collectionData.items.map((item) => (
                <Item
                  title={item.title}
                  description={""}
                  imageUrl={item.imageUrl}
                  link={`/our-collections/${collectionId}/${item.id}`}
                  key={`/our-collections/${collectionId}/${item.id}`}
                />
              ))}
          </div>

          {/* Learn more button */}
          <div className="flex flex-row justify-center my-5">
            <button className="">Learn More</button>
          </div>
        </div>

        {/* Featured articles */}
        <div>
          <h1>Featured Articles</h1>
          <div className="grid grid-cols-3 gap-8 mt-10">
            {featuredArticles &&
              featuredArticles &&
              featuredArticles.map((item) => (
                <Item
                  title={item.title}
                  description={""}
                  imageUrl={item.imageUrl}
                  link={`/blogs/${item.id}`}
                  key={`/blogs/${item.id}`}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EachCollection;
