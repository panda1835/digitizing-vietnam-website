import React from "react";
import gach_bong from "../assets/gach-bong.png";

const GachBongBottom = () => {
  // Inline style for background image
  const style = {
    backgroundImage: `url(${gach_bong})`,
    backgroundSize: "auto 80px", // Assuming you want the "height" of the repeating image to be 80px
  };

  return (
    // Apply Tailwind classes along with inline styles
    // w-full for full width, min-h-screen for minimum height of the screen, bg-repeat for repeating the background
    <div className="w-full h-20 bg-repeat" style={style}></div>
  );
};

export default GachBongBottom;
