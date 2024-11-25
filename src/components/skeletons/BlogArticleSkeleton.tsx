const BlogArticleSkeleton = () => {
  return (
    <div className="flex flex-col max-width animate-pulse">
      <div className="flex-col mb-20 mx-5">
        <section className="bg-gray-300 mb-10 w-full h-80 flex flex-col items-center justify-center rounded-lg relative">
          {/* Background Skeleton */}
          <div className="absolute inset-0 bg-gray-400 opacity-50 rounded-lg"></div>{" "}
          {/* Title Skeleton */}
          <div className="bg-gray-500 h-10 w-3/4 rounded mb-5 z-10"></div>{" "}
          {/* Author Skeleton */}
          <div className="bg-gray-500 h-6 w-1/3 rounded mb-2 z-10"></div>{" "}
          {/* Date Skeleton */}
          <div className="bg-gray-500 h-6 w-1/4 rounded z-10"></div>{" "}
        </section>
        {/* "Blog post" text placeholder */}
        <div className="bg-gray-300 h-10 w-3/4 rounded mb-5 z-10"></div>{" "}
        <div className="bg-gray-300 h-6 w-full rounded mb-2 z-10"></div>{" "}
        <div className="bg-gray-300 h-6 w-full rounded mb-2 z-10"></div>{" "}
        <div className="bg-gray-300 h-6 w-full rounded z-10"></div>{" "}
      </div>
    </div>
  );
};

export default BlogArticleSkeleton;
