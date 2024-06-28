import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Item from "../components/Item";
import SearchBar from "../components/SearchBar";

import config from "../config";
const OurCollections = () => {
  const { t } = useTranslation();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(config["api"]["collections"])
      .then((response) => response.json())
      .then((data) => {
        setCollections(data["data"]);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        {/* Header */}
        <section className="flex flex-col items-center justify-center">
          <h1 className="">{t("collections-title")}</h1>
          <p className="text-gray-500 mb-5 text-center">
            {t("collections-subtitle")}
          </p>
        </section>
        {/* Search bar */}
        <SearchBar />

        {/* Loading indicator */}
        <div className="flex items-center justify-center mt-10">
          <div className={`loader ${loading ? "visible" : "hidden"} `}></div>
        </div>

        {/* Collection gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {collections.map((collection) => (
            <Item
              title={collection.title}
              description={collection.description}
              imageUrl={collection.image_url}
              link={`/our-collections/${collection.collection_id}`}
              key={`/our-collections/${collection.collection_id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OurCollections;
