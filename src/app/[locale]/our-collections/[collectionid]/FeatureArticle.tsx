import ArticleCard from "@/components/ArticleCard";

import { formatDate } from "@/utils/datetime";
import { getImageByKey } from "@/utils/image";

import { Merriweather } from "next/font/google";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const FeatureArticle = ({ highlights, locale }) => {
  return (
    <section className="mb-24 mt-10 w-full">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          className={`text-3xl font-medium mb-6 text-branding-black ${merriweather.className}`}
        >
          {locale === "en" ? "Featured Articles" : "Bài viết chuyên đề"}
        </div>
      </div>
      {highlights.length === 0 && (
        <div className="text-lg font-['Helvetica_Neue'] font-light">
          {locale === "en"
            ? "No featured articles for this collection."
            : "Chưa có bài viết chuyên đề nào cho bộ sưu tập này."}
        </div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {highlights.map((item) => (
          <ArticleCard
            title={item.title}
            description={item.content}
            date={formatDate(item.publishedAt, locale)}
            imageUrl={getImageByKey(item.thumbnail[0].formats, "medium")}
            link={`/highlights/${item.slug}`}
            key={`/highlights/${item.slug}`}
          />
        ))}
      </div>
    </section>
  );
};

export default FeatureArticle;
