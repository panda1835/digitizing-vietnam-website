"use client";

import React, { useState, useEffect } from "react";

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
          className="fixed bottom-5 right-5 z-50 p-3 py-6 w-12 bg-primary-blue text-white rounded hover:bg-primary-yellow transition duration-300 ease-in-out"
          aria-label="Go to top"
        >
          ↑
        </Button>
      )}
    </>
  );
};

export default BackToTopButton;
