import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-primary-gray">
      <div className="ml-5 max-width">
        <Link to="/">
          <img src={logo} alt="Logo" />
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
