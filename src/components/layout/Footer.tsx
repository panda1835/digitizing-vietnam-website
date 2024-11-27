import React from "react";
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-gray">
      <div className="ml-5 py-2 max-width flex justify-end">
        <p className="mr-5">© {currentYear} Digitizing Vietnam Project</p>
      </div>
    </footer>
  );
};

export default Footer;
