import React, { useState, useEffect } from "react";

import SearchBar from "../components/SearchBar";
import Item from "../components/Item";

import config from "../config";

const Blogs = () => {
  const [blogs, setBlogs] = useState({});
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  useEffect(() => {
    fetch(config["api"]["blogs"])
      .then((response) => response.json())
      .then((data) => {
        setBlogs(data);
        setLoadingBlogs(false);
      })
      .catch(() => {
        setBlogs({
          news: [
            {
              id: "news-1",
              title: "News 1",
              imageUrl: "https://via.placeholder.com/500",
            },
            {
              id: "news-2",
              title: "News 2",
              imageUrl: "https://via.placeholder.com/500",
            },
            {
              id: "news-3",
              title: "News 3",
              imageUrl: "https://via.placeholder.com/500",
            },
          ],
          highlights: [
            {
              id: "highlight-1",
              title: "Highlight 1",
              imageUrl: "https://via.placeholder.com/500",
            },
            {
              id: "highlight-2",
              title: "Highlight 2",
              imageUrl: "https://via.placeholder.com/500",
            },
            {
              id: "highlight-3",
              title: "Highlight 3",
              imageUrl: "https://via.placeholder.com/500",
            },
          ],
          initiatives: [
            {
              id: "initiative-1",
              title: "Initiative 1",
              imageUrl: "https://via.placeholder.com/500",
            },
            {
              id: "initiative-2",
              title: "Initiative 2",
              imageUrl: "https://via.placeholder.com/500",
            },
            {
              id: "initiative-3",
              title: "Initiative 3",
              imageUrl: "https://via.placeholder.com/500",
            },
          ],
        });
        setLoadingBlogs(false);
      });
  });
  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        {/* Header */}
        <section className="flex-col text-center">
          <h1>Vietnam Digitized: A Blog</h1>
          <p className="text-gray-500">
            News, insights and initiatives on the digital front of Vietnamese
            heritage
          </p>
        </section>

        {/* Search bar */}
        <SearchBar />

        {/* Loading indicator */}
        <div className="flex items-center justify-center">
          <div
            className={`loader ${loadingBlogs ? "visible" : "hidden"} `}
          ></div>
        </div>

        {/* News */}
        <section className="mb-10">
          <h1>News</h1>
          <div className="grid grid-cols-3 gap-8 mt-10">
            {blogs &&
              blogs["news"] &&
              blogs["news"].map((item) => (
                <Item
                  title={item.title}
                  description={""}
                  imageUrl={item.imageUrl}
                  link={`/blogs/${item.id}`}
                  key={`/blogs/${item.id}`}
                />
              ))}
          </div>
        </section>

        {/* Highlights */}
        <section className="mb-10">
          <h1>Highlights</h1>
          <div className="grid grid-cols-3 gap-8 mt-10">
            {blogs &&
              blogs["highlights"] &&
              blogs["highlights"].map((item) => (
                <Item
                  title={item.title}
                  description={""}
                  imageUrl={item.imageUrl}
                  link={`/blogs/${item.id}`}
                  key={`/blogs/${item.id}`}
                />
              ))}
          </div>
        </section>

        {/* Initiatives */}
        <section className="mb-10">
          <h1>Initiatives</h1>
          <div className="grid grid-cols-3 gap-8 mt-10">
            {blogs &&
              blogs["initiatives"] &&
              blogs["initiatives"].map((item) => (
                <Item
                  title={item.title}
                  description={""}
                  imageUrl={item.imageUrl}
                  link={`/blogs/${item.id}`}
                  key={`/blogs/${item.id}`}
                />
              ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Blogs;
