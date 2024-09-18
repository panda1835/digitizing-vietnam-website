const BookItemSkeleton = () => {
  return (
    <div className="border-solid border-2 flex flex-col items-center justify-center rounded-lg py-2 w-64 animate-pulse">
      <div className="bg-gray-300 rounded-lg w-56 h-40"></div>{" "}
      {/* Image Skeleton */}
      <div className="mt-2 bg-gray-300 h-6 rounded w-3/4"></div>{" "}
      {/* Title Skeleton */}
    </div>
  );
};

export default BookItemSkeleton;
