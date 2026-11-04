import React from "react";
import { Instagram, Mail, Facebook } from "lucide-react";
const Footer = ({ locale }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-branding-white">
      <div className="bg-branding-white shadow-[0px_-4px_55px_0px_rgba(0,0,0,0.10)]">
        <div className="px-[20px] md:px-[50px]">
          <div className="max-w-7xl mx-auto py-8">
            <div className="flex flex-col gap-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Email Section */}
                <div className="flex-col justify-center items-start gap-1 col-span-1 lg:col-span-2">
                  <div className="text-branding-black   font-light font-['Helvetica Neue']">
                    {locale === "en"
                      ? "Have a collection, an article or a research project that you want to share? E-mail us at"
                      : "Bạn muốn chia sẻ với chúng tôi một bộ sưu tập, một bài viết hoặc một dự án nghiên cứu? Hãy liên hệ với chúng tôi tại"}{" "}
                  </div>
                  <div className="text-justify flex gap-2 items-center mt-2">
                    <Mail className="size-5" />
                    <a
                      href="mailto:info@digitizingvietnam.com"
                      className="text-branding-black   font-light font-['Helvetica Neue'] underline hover:text-gray-600 transition-colors"
                    >
                      info@digitizingvietnam.com
                    </a>
                  </div>
                </div>

                {/* Follow Us Section */}
                <div className="flex-col justify-center items-start gap-1 mt-6 md:mt-0">
                  <div className="text-branding-black   font-light font-['Helvetica Neue']">
                    {locale === "en" ? "Follow Us" : "Theo dõi chúng tôi"}
                  </div>
                  <div className="flex gap-4 mt-2">
                    <a
                      href="https://www.instagram.com/digitizing.vietnam/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block hover:text-gray-600 transition-colors"
                    >
                      <Instagram className="size-5" />
                    </a>

                    <a
                      href="https://www.facebook.com/digitizingvietnam/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block hover:text-gray-600 transition-colors"
                    >
                      <Facebook className="size-5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Copyright */}

              <p className="max-w-4xl text-sm text-branding-black font-light font-['Helvetica Neue']">
                {locale === "vi"
                  ? "Tư liệu trên Digitizing Việt Nam được cung cấp cho mục đích giáo dục và nghiên cứu, không sử dụng vì mục đích thương mại. Quyền tác giả thuộc về tác giả và chủ sở hữu quyền. Xem "
                  : "Materials on Digitizing Việt Nam are provided for educational and research purposes, not for commercial use. Copyright belongs to the authors and rights holders. See "}
                <a
                  href={`/${locale}/terms-of-use`}
                  className="underline hover:text-gray-600 transition-colors"
                >
                  {locale === "vi" ? "Điều kiện sử dụng" : "Terms of Use"}
                </a>
                .
              </p>

              <div className="text-branding-black font-light font-['Helvetica Neue']">
                © {currentYear} Digitizing Việt Nam
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
