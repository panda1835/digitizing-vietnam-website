import LoadingSpinner from "@/components/layout/LoadingSpinner";
const Loading = () => {
  return (
    <div className="flex flex-col max-width justify-center items-center">
      <div className="mt-20">
        <LoadingSpinner />
      </div>
    </div>
  );
};

export default Loading;
