"use client";
import { useTranslations } from "next-intl";

import CollectionItemGallerySkeleton from "./CollectionItemGallerySkeleton";
import ItemSkeleton from "@/components/skeletons/ItemSkeleton";

const EachCollectionSkeleton = () => {
  const t = useTranslations("Collection");

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        {/* Banner */}
        <section className="bg-gray-300 w-full h-80 flex flex-col items-center justify-center rounded-lg relative text-center animate-pulse">
          <div className="absolute inset-0 bg-gray-400 opacity-50 rounded-lg"></div>{" "}
          {/* Background Skeleton */}
        </section>
        {/* Heading */}
        <div className="bg-gray-300 h-8 rounded w-1/3 mt-8"></div>{" "}
        {/* Collection information skeleton */}
        <div className="my-10 animate-pulse space-y-3">
          <div className="bg-gray-300 h-4 rounded w-full"></div>{" "}
          <div className="bg-gray-300 h-4 rounded w-full"></div>{" "}
          <div className="bg-gray-300 h-4 rounded w-full"></div>{" "}
          {/* Description Line 1 */}
          <div className="bg-gray-300 h-4 rounded w-5/6"></div>{" "}
          {/* Description Line 2 */}
          <div className="bg-gray-300 h-4 rounded w-4/6"></div>{" "}
          {/* Description Line 3 */}
        </div>
      </div>
    </div>
  );
};

export default EachCollectionSkeleton;
