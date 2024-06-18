import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="flex flex-col items-center max-width">
      {/* Header */}
      <section className="flex-col text-center mb-20 mx-5">
        <h1>Digitizing Vietnam</h1>
        <p className="text-gray-500">
          A digital hub to study pre-modern and modern Vietnam{" "}
        </p>
      </section>

      <section className="flex flex-row w-full justify-around items-center mb-10">
        <div>
          <h2>About Digitizing Vietnam</h2>
          <p className="w-96 mb-5">
            Digitizing Vietnam marks a digital leap forward in Vietnam Studies
            with the Columbia-Fulbright collaboration. The joint venture started
            with the memorandum of understanding between two universities in
            2022. Weatherhead East Asian Institute of Columbia and Vietnam
            Studies Center of Fulbright will be spearheading research in the
            field of Vietnam studies, and Digitizing Vietnam will be one among
            many collaborative endeavors to come in the future.
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
          <h2>Our Collections</h2>
          <p className="w-96 mb-5">
            Do you want to try reading Hán-Nôm scripts, or to see how chữ quốc
            ngữ was used in the early 20th century? Our eclectic collections
            range from pre-modern Hán-Nôm texts to the first Vietnamese
            women&apos;s magazine. While by no means comprehensive, they provide
            rarely seen snapshots of Vietnamese history.
          </p>
          <Link to="/our-collections" className="button">
            Learn more
          </Link>
        </div>
      </section>

      <section className="flex flex-row w-full justify-around items-center mb-10">
        <div>
          <h2>Our Blog</h2>
          <p className="w-96 mb-5">
            The blog is a special part in this digital hub for studies on both
            premodern and modern Vietnam. Here, you will find scholarly research
            as well as non-specialist insights related to Vietnam&apos;s
            historical and cultural evolution. We also invite you to contribute
            to the discussion on our collections, and share any insights you
            might have.
          </p>
          <Link to="/blogs" className="button">
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
      </section>
    </div>
  );
};

export default Home;
