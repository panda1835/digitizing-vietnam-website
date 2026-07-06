import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { renderHtml } from "@/utils/renderHtml";
import { Merriweather, Inter } from "next/font/google";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });
const inter = Inter({ weight: "400", subsets: ["vietnamese"] });

const ArticleCard = ({ title, description, date, imageUrl, link }) => {
  const t = useTranslations("Button");
  const locale = useLocale();
  const isStaticRoute = link.endsWith("ca-dao-tuc-ngu");

  return (
    <div className="mb-5 w-full">
      <Image
        unoptimized
        src={imageUrl.url}
        alt={title}
        width={imageUrl.width}
        height={imageUrl.height}
        className="object-cover rounded w-full h-40"
      />

      <div className="">
        {/* Title */}
        {isStaticRoute ? (
          <a href={`/${locale}${link}`} className="">
            <div
              className={`t-['Helvetica Neue'] line-clamp-2 font-medium text-branding-black text-xl mt-[12px] hover:text-branding-brown hover:underline`}
              title={title}
            >
              {title}
            </div>
          </a>
        ) : (
          <Link href={link} className="">
            <div
              className={`t-['Helvetica Neue'] line-clamp-2 font-medium text-branding-black text-xl mt-[12px] hover:text-branding-brown hover:underline`}
              title={title}
            >
              {title}
            </div>
          </Link>
        )}
        {/* Tag */}
        {/* <div className="flex justify-start items-center gap-[3px] mt-2">
          <div className="px-2.5 py-1.5 bg-white rounded-[5px] border border-[#cdcdcd] justify-center items-center gap-1 flex">
            <div
              className={`text-branding-black text-sm font-normal ${inter.className}`}
            >
              Innovation
            </div>
          </div>
          <div className="px-2.5 py-1.5 bg-white rounded-[5px] border border-[#cdcdcd] justify-center items-center gap-1 flex">
            <div
              className={`text-branding-black text-sm font-normal ${inter.className}`}
            >
              Restoration
            </div>
          </div>
        </div> */}

        {/* Author */}
        <div className="flex flex-col lg:flex-row mt-[4px] gap-1">
          <div
            className="line-clamp-3  font-light font-['Helvetica Neue'] "
            dangerouslySetInnerHTML={renderHtml(description)}
          ></div>
          <div className="hidden lg:block">·</div>
          {/* Date */}
          <div className="text-muted-foreground">{date}</div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
