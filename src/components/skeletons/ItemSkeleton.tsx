"use client";

const ItemSkeleton = () => {
  return (
    <div className="mb-5 animate-pulse">
      <div className="bg-gray-300 rounded w-full h-40"></div>{" "}
      {/* Image Skeleton */}
      <div className="mt-2 bg-gray-300 h-6 rounded w-3/4"></div>{" "}
      {/* Title Skeleton */}
      <div className="mt-2 space-y-2">
        <div className="bg-gray-300 h-4 rounded w-full"></div>{" "}
        {/* Description Line 1 */}
        <div className="bg-gray-300 h-4 rounded w-5/6"></div>{" "}
        {/* Description Line 2 */}
      </div>
    </div>
  );
};

export default ItemSkeleton;
