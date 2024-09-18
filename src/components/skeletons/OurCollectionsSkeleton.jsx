"use client";
import { useTranslations } from "next-intl";

import ItemSkeleton from "./ItemSkeleton";

const OurCollectionsSkeleton = () => {
  const t = useTranslations("Collection");

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        {/* Header */}
        <section className="flex flex-col items-center justify-center">
          <h1 className="">{t("title")}</h1>
          <p className="text-gray-500 mb-5 text-center">{t("subtitle")}</p>
        </section>

        {/* Collection gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-5">
          {[1, 2, 3].map((item) => (
            <ItemSkeleton key={item.key} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OurCollectionsSkeleton;
