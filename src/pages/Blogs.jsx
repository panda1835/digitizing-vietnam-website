import React, { useState, useEffect } from "react";

import SearchBar from "../components/SearchBar";
import Item from "../components/Item";

import config from "../config";

const Blogs = () => {
  const [news, setNews] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  useEffect(() => {
    fetch(`${config["api"]["blogs"]}/news`)
      .then((response) => response.json())
      .then((data) => {
        setNews(data["data"]);
        setLoadingBlogs(false);
      })
      .catch((e) => {
        console.error(e);
        setLoadingBlogs(false);
      });
  }, []);

  useEffect(() => {
    fetch(`${config["api"]["blogs"]}/highlights`)
      .then((response) => response.json())
      .then((data) => {
        setHighlights(data["data"]);
        setLoadingBlogs(false);
      })
      .catch((e) => {
        console.error(e);
        setLoadingBlogs(false);
      });
  }, []);

  useEffect(() => {
    fetch(`${config["api"]["blogs"]}/initiatives`)
      .then((response) => response.json())
      .then((data) => {
        setInitiatives(data["data"]);
        setLoadingBlogs(false);
      })
      .catch((e) => {
        console.error(e);
        setLoadingBlogs(false);
      });
  }, []);

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        {/* Header */}
        <section className="flex-col text-center mb-10">
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
            {news &&
              news.map((item) => (
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
            {highlights &&
              highlights.map((item) => (
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
            {initiatives &&
              initiatives.map((item) => (
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
