import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const Header = () => {
  return (
    <header className="bg-primary-gray">
      <nav className="flex py-3 mb-10 max-width">
        <div className="ml-5">
          <Link to="/">
            <img src={logo} alt="Logo" />
          </Link>
        </div>
        <div className="w-28"></div> {/* Empty box */}
        <div className="flex flex-grow items-center">
          <ul className="flex flex-grow justify-evenly">
            <li className="text-primary-blue font-bold">
              <Link to="/">Home</Link>
            </li>
            <li className="text-primary-blue font-bold">
              <Link to="/about-us">About Us</Link>
            </li>
            <li className="text-primary-blue font-bold">
              <Link to="/our-collections">Our Collections</Link>
            </li>
            <li className="text-primary-blue font-bold">
              <Link to="/blogs">Blogs</Link>
            </li>
            <li className="text-primary-blue font-bold">
              <Link to="/contact-us">Contact Us</Link>
            </li>
            <li className="text-white bg-primary-blue pl-2 pr-2 p-1 rounded">
              <Link to="/">EN/VI</Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
