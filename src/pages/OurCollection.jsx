import React, { useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { Link } from "react-router-dom";

const OurCollection = () => {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    fetch("http://your-api-url.com/collections")
      .then((response) => response.json())
      .then((data) => setCollections(data))
      .catch(() =>
        setCollections([
          {
            id: "han-nom",
            title: "Hán-Nôm",
            description:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.",
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
            id: "vietnam-studies-journal",
            title: "Vietnamese Studies Journal",
            description:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Duis auctor lacinia mauris, id volutpat quam. Ut viverra, odio id finibus convallis, elit elit consequat purus, vitae viverra quam neque sed turpis. Orci varius natoque penatibus.",
            imageUrl: "https://via.placeholder.com/500",
          },
          {
            id: "trinh-cong-son",
            title: "Trịnh Công Sơn",
            description:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Duis auctor lacinia mauris, id volutpat quam. Ut viverra, odio id finibus convallis, elit elit consequat purus, vitae viverra quam neque sed turpis. Orci varius natoque penatibus.",
            imageUrl: "https://via.placeholder.com/500",
          },
        ])
      );
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
        <form className="flex my-5">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              name="search-query"
              placeholder="Search"
              className="rounded border pl-8"
            />
          </div>
          <input
            type="submit"
            value="Search"
            className="border rounded px-2 mx-2 bg-primary-blue text-white"
          />
        </form>

        {/* Collection gallery */}
        <div className="grid grid-cols-3 gap-8 mt-10">
          {collections.map((collection) => (
            <Link to={`/our-collections/${collection.id}`} key={collection.id}>
              <div className="">
                <img
                  src={collection.imageUrl}
                  alt={collection.title}
                  className="object-cover rounded-lg w-full h-40"
                />
                <div className="text-xl text-primary-blue mt-2">
                  {collection.title}
                </div>
                <p className="text-gray-500">{collection.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OurCollection;
