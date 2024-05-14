import React, { useEffect, useState } from "react";

import Item from "../components/Item";
import SearchBar from "../components/SearchBar";

import config from "../config";
const OurCollections = () => {
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(true);

  useEffect(() => {
    fetch(config["api"]["collections"])
      .then((response) => response.json())
      .then((data) => {
        setCollections(data);
        setLoadingCollections(false);
      })
      .catch(() => {
        setCollections([
          {
            id: "han-nom",
            title: "Hán-Nôm",
            description:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.",
            imageUrl: "https://via.placeholder.com/500",
          },
          {
            id: "vietnam-studies-journal",
            title: "Vietnamese Studies Journal",
            description:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Duis auctor lacinia mauris, id volutpat quam. Ut viverra, odio id finibus convallis, elit elit consequat purus, vitae viverra quam neque sed turpis. Orci varius natoque penatibus.",
            imageUrl: "https://via.placeholder.com/500",
          },
          {
            id: "nu-gioi-chung",
            title: "Nữ Giới Chung",
            description:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.",
            imageUrl: "https://via.placeholder.com/500",
          },
          {
            id: "trinh-cong-son",
            title: "Trịnh Công Sơn",
            description:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Duis auctor lacinia mauris, id volutpat quam. Ut viverra, odio id finibus convallis, elit elit consequat purus, vitae viverra quam neque sed turpis. Orci varius natoque penatibus.",
            imageUrl: "https://via.placeholder.com/500",
          },
        ]);

        setLoadingCollections(false);
      });
  }, []);

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 mx-5">
        {/* Title and description */}
        <h1 className="flex justify-center">Our Collections</h1>
        <p className="text-gray-500">
          Explore our digital archive dedicated to the preservation and academic
          exploration of Vietnam&apos;s historical and intellectual heritage.
        </p>
        {/* Search bar */}
        <SearchBar />

        {/* Loading indicator */}
        <div className="flex items-center justify-center">
          <div
            className={`loader ${loadingCollections ? "visible" : "hidden"} `}
          ></div>
        </div>

        {/* Collection gallery */}
        <div className="grid grid-cols-3 gap-8 mt-10">
          {collections.map((collection) => (
            <Item
              title={collection.title}
              description={collection.description}
              imageUrl={collection.imageUrl}
              link={`/our-collections/${collection.id}`}
              key={`/our-collections/${collection.id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OurCollections;
