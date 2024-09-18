import { getTranslations } from "next-intl/server";

import Item from "../../../components/Item";

import config from "../../config";
import { fetchData } from "../../../lib/fetch";

const Blogs = async () => {
  const t = await getTranslations("Blog");

  const newData = await fetchData(`${config["api"]["blogs"]}/news`);
  const news = newData["data"];

  const highlightData = await fetchData(`${config["api"]["blogs"]}/highlights`);
  const highlights = highlightData["data"];

  const initiativeData = await fetchData(
    `${config["api"]["blogs"]}/initiatives`
  );
  const initiatives = initiativeData["data"];

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        {/* Header */}
        <section className="flex-col text-center mb-10">
          <h1>{t("title")}</h1>
          <p className="text-gray-500">{t("subtitle")}</p>
        </section>

        {/* News */}
        <section className="mb-10">
          <h1>{t("news")}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {news &&
              news.map((item) => (
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

        {/* Highlights */}
        <section className="mb-10">
          <h1>{t("highlights")}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {highlights &&
              highlights.map((item) => (
                <Item
                  title={item.title}
                  description={`${item.author} - ${item.date_created}`}
                  imageUrl={item.image_url}
                  link={`/blogs/${item.blog_id}`}
                  key={`/blogs/${item.blog_id}`}
                />
              ))}
          </div>
        </section>

        {/* Initiatives */}
        <section className="mb-10">
          <h1>{t("initiatives")}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {initiatives &&
              initiatives.map((item) => (
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

export default Blogs;
