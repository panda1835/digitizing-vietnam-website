import LoadingSpinner from "@/components/layout/LoadingSpinner";
const Loading = () => {
  return (
    <div className="flex flex-col max-width items-center justify-start pt-24 min-h-screen lg:min-h-0 lg:justify-center lg:pt-0">
      <div className="lg:mt-20">
        <LoadingSpinner />
      </div>
    </div>
  );
};

export default Loading;
