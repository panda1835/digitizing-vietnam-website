import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col text-center mb-20 mx-5">
        <h1>Digitizing Vietnam</h1>
        <p className="text-gray-500">
          A digital hub to study pre-modern and modern Vietnam{" "}
        </p>
      </div>

      <div className="flex flex-row w-full justify-around items-center mb-10">
        <div>
          <h2>About Digitizing Vietnam</h2>
          <p className="w-80 mb-5">
            Digitizing Vietnam marks a digital leap forward in Vietnam Studies
            with the Columbia-Fulbright collaboration.
          </p>
          <Link to="/about-us" className="button">
            Learn more
          </Link>
        </div>

        <div>
          <img
            className="w-96"
            src="https://www.lrsoc.com/web/wp-content/uploads/2021/01/Placeholder-shop.jpg"
            alt="About Digitizing Vietnam"
          ></img>
        </div>
      </div>

      <div className="flex flex-row w-full justify-around items-center mb-10">
        <div>
          <img
            className="w-96"
            src="https://www.lrsoc.com/web/wp-content/uploads/2021/01/Placeholder-shop.jpg"
            alt="Our Collections"
          ></img>
        </div>

        <div>
          <h2>Our Collections</h2>
          <p className="w-80 mb-5">
            Explore our eclectic collections, which range from pre-modern
            Hán-Nôm texts to the first Vietnamese women&apos;s magazine.
          </p>
          <Link to="/our-collections" className="button">
            Learn more
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
