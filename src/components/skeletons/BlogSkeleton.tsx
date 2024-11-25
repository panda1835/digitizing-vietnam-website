import { useTranslations } from "next-intl";

import ItemSleleton from "./ItemSkeleton";

const BlogSkeleton = () => {
  const t = useTranslations("Blog");
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
            {[1, 2, 3].map((item) => (
              <ItemSleleton key={item} />
            ))}
          </div>
        </section>

        {/* Highlights */}
        <section className="mb-10">
          <h1>{t("highlights")}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {[1, 2, 3].map((item) => (
              <ItemSleleton key={item} />
            ))}
          </div>
        </section>

        {/* Initiatives */}
        <section className="mb-10">
          <h1>{t("initiatives")}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {[1, 2, 3].map((item) => (
              <ItemSleleton key={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BlogSkeleton;
