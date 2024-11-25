const CollectionItemViewerSkeleton = () => {
  return (
    <div className="animate-pulse flex flex-col max-width">
      {/* Title Skeleton */}
      <div className="bg-gray-300 h-8 w-2/3 rounded mb-4"></div>{" "}
      {/* Document Reader Skeleton */}
      <div className="bg-gray-200 h-96 w-full rounded-lg"></div>{" "}
    </div>
  );
};

export default CollectionItemViewerSkeleton;
