"use client";
import { useTranslations } from "next-intl";

import CollectionItemGallerySkeleton from "./CollectionItemGallerySkeleton";
import ItemSkeleton from "@/components/skeletons/ItemSkeleton";

const EachCollectionSkeleton = () => {
  const t = useTranslations("Collection");

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 mx-5">
        {/* Banner */}
        <section className="bg-gray-300 w-full h-80 flex flex-col items-center justify-center rounded-lg relative text-center animate-pulse">
          <div className="absolute inset-0 bg-gray-400 opacity-50 rounded-lg"></div>{" "}
          {/* Background Skeleton */}
        </section>

        {/* Collection information skeleton */}
        <div className="my-10 animate-pulse space-y-3">
          <div className="bg-gray-300 h-4 rounded w-full"></div>{" "}
          {/* Description Line 1 */}
          <div className="bg-gray-300 h-4 rounded w-5/6"></div>{" "}
          {/* Description Line 2 */}
          <div className="bg-gray-300 h-4 rounded w-4/6"></div>{" "}
          {/* Description Line 3 */}
        </div>

        {/* Item gallery */}
        <CollectionItemGallerySkeleton />
        <div className="mb-10"></div>

        {/* Featured articles */}
        <section>
          <h1 id="feature-articles">{t("featured-articles")}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {[1, 2, 3].map((item) => (
              <ItemSkeleton key={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EachCollectionSkeleton;
