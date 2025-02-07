import React from "react";
import { Instagram, Mail } from "lucide-react";
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-branding-white">
      <div className="px-[20px] md:px-[50px] py-6 lg:py-10 bg-branding-white shadow-[0px_-4px_55px_0px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col gap-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Email Section */}
            <div className="flex-col justify-center items-start gap-1 col-span-1 lg:col-span-2">
              <div className="text-branding-black text-base lg:text-lg font-light font-['Helvetica Neue']">
                Have a collection, an article or a research project that you
                want to share? E-mail us at{" "}
              </div>
              <div className="text-justify flex gap-2 items-center mt-2">
                <Mail className="size-5" />
                <a
                  href="mailto:info@digitizingvietnam.com"
                  className="text-branding-black text-base lg:text-lg font-light font-['Helvetica Neue'] underline hover:text-gray-600 transition-colors"
                >
                  info@digitizingvietnam.com
                </a>
              </div>
            </div>

            {/* Follow Us Section */}
            <div className="flex-col justify-center items-start gap-1 mt-6 md:mt-0">
              <div className="text-branding-black text-base lg:text-lg font-light font-['Helvetica Neue']">
                Follow Us
              </div>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block hover:text-gray-600 transition-colors"
              >
                <Instagram className="size-5" />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-branding-black text-base lg:text-lg font-light font-['Helvetica Neue'] mt-4">
            © {currentYear} Digitizing Việt Nam
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
