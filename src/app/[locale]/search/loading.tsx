import LoadingIndicator from "@/components/layout/LoadingIndicator";
const Loading = () => {
  return (
    <div className="flex flex-col max-width ">
      <div className="mt-20">
        <LoadingIndicator />
      </div>
    </div>
  );
};

export default Loading;
