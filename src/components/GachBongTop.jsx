import React from "react";
import gach_bong from "../assets/gach-bong.png";
import SearchBar from "./SearchBar";

const GachBongTop = () => {
  // Inline style for background image
  const style = {
    backgroundImage: `url(${gach_bong})`,
    backgroundSize: "auto 80px", // Assuming you want the "height" of the repeating image to be 80px
  };

  return (
    <div className="w-full h-20 bg-repeat" style={style}>
      {/* Flex container to center SearchBar */}
      <div className="flex justify-center items-center h-full">
        <SearchBar />
      </div>
    </div>
  );
};

export default GachBongTop;
