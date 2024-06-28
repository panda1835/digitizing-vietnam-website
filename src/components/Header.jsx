// import React from "react";
// import { Link } from "react-router-dom";
// import logo3 from "../assets/logo3.png";

// const Header = () => {
//   return (
//     <header className="bg-primary-gray mb-10">
//       <nav className="flex py-3 mb-10 max-width">
//         <div className="ml-5 w-40">
//           <Link to="/">
//             <img src={logo3} alt="Logo" />
//           </Link>
//         </div>
//         <div className="w-28"></div> {/* Empty box */}
//         <div className="flex flex-grow items-center">
//           <ul className="flex flex-grow justify-evenly">
//             <li className="text-primary-blue font-bold text-xl">
//               <Link to="/">Home</Link>
//             </li>
//             <li className="text-primary-blue font-bold text-xl">
//               <Link to="/about-us">About Us</Link>
//             </li>
//             <li className="text-primary-blue font-bold text-xl">
//               <Link to="/our-collections">Collections</Link>
//             </li>
//             <li className="text-primary-blue font-bold text-xl">
//               <Link to="/blogs">Blogs</Link>
//             </li>
//             <li className="text-primary-blue font-bold text-xl">
//               <Link to="/online-resources">Online Resources</Link>
//             </li>
//             <li className="text-white bg-primary-blue pl-2 pr-2 p-1 rounded">
//               <Link to="/">EN/VI</Link>
//             </li>
//           </ul>
//         </div>
//       </nav>
//     </header>
//   );
// };

// export default Header;

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import logo3 from "../assets/logo3.png";

import LanguageSelector from "./LanguageSelector";

const Header = () => {
  const { t } = useTranslation();
  const [openNav, setOpenNav] = useState(false); // State for mobile navigation

  const toggleNav = () => {
    setOpenNav(!openNav);
  };

  return (
    <header className="bg-primary-gray mb-10">
      <nav className="flex py-3 mb-10 max-w-screen-lg mx-auto">
        <div className="ml-5 w-40">
          <Link to="/">
            <img src={logo3} alt="Logo" />
          </Link>
        </div>
        <div className="w-28"></div> {/* Empty box */}
        <div className="flex items-center justify-between flex-grow md:block hidden">
          <ul className="flex justify-evenly">
            <li className="text-primary-blue font-bold text-xl">
              <Link to="/">{t("home")}</Link>
            </li>
            <li className="text-primary-blue font-bold text-xl">
              <Link to="/about-us">{t("about-us")}</Link>
            </li>
            <li className="text-primary-blue font-bold text-xl">
              <Link to="/our-collections">{t("collections")}</Link>
            </li>
            <li className="text-primary-blue font-bold text-xl">
              <Link to="/blogs">{t("blogs")}</Link>
            </li>
            <li className="text-primary-blue font-bold text-xl">
              <Link to="/online-resources">{t("online-resources")}</Link>
            </li>
            <li className="text-white bg-primary-blue pl-2 pr-2 p-1 rounded">
              <LanguageSelector />
            </li>
          </ul>
        </div>
        <button
          className="md:hidden block text-primary-blue bg-primary-gray p-2 rounded"
          onClick={toggleNav}
        >
          {openNav ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </nav>
      {/* Mobile Navigation */}
      {openNav && (
        <div className="lg:hidden flex flex-col items-center">
          <ul className="mt-4 flex flex-col items-center gap-2">
            <li className="text-primary-blue font-bold text-xl">
              <Link to="/">Home</Link>
            </li>
            <li className="text-primary-blue font-bold text-xl">
              <Link to="/about-us">About Us</Link>
            </li>
            <li className="text-primary-blue font-bold text-xl">
              <Link to="/our-collections">Collections</Link>
            </li>
            <li className="text-primary-blue font-bold text-xl">
              <Link to="/blogs">Blogs</Link>
            </li>
            <li className="text-primary-blue font-bold text-xl">
              <Link to="/online-resources">Online Resources</Link>
            </li>
            <li className="text-white bg-primary-blue pl-2 pr-2 p-1 rounded mb-5">
              <LanguageSelector />
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Header;
