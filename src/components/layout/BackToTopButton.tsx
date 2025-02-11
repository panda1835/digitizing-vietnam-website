"use client";

import React, { useState, useEffect } from "react";

import { ArrowUpToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
const BackToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled upto given distance
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Set up event listener
  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-20 right-10 z-50 p-3 py-6 w-12 bg-transparent hover:bg-white hover:scale-110 text-[#6d6d6d] rounded-full border border-gray-300 transition duration-300 ease-in-out"
          aria-label="Go to top"
        >
          <ArrowUpToLine />
        </Button>
      )}
    </>
  );
};

export default BackToTopButton;
