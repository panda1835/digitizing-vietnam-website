import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { renderHtml } from "@/utils/renderHtml";
import { Merriweather, Inter } from "next/font/google";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });
const inter = Inter({ weight: "400", subsets: ["vietnamese"] });

const ArticleCard = ({ title, description, date, imageUrl, link }) => {
  const t = useTranslations("Button");
  return (
    <div className="mb-5">
      <Image
        unoptimized
        src={imageUrl.url}
        alt={title}
        width={imageUrl.width}
        height={imageUrl.height}
        className="object-cover rounded w-full h-40"
      />

      <p className="">
        {/* Date */}
        <div className="text-muted-foreground mt-6">{date}</div>

        {/* Title */}
        <Link href={link} className="">
          <div
            className={`text-branding-black text-xl font-normal ${merriweather.className} mt-2 line-clamp-2`}
            title={title}
          >
            {title}
          </div>
        </Link>
        {/* Tag */}
        <div className="flex justify-start items-center gap-[3px] mt-2">
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
        </div>

        {/* Abstract */}
        <div
          className="text-branding-black text-base font-light font-['Helvetica Neue'] leading-[23px] mt-4 line-clamp-4"
          dangerouslySetInnerHTML={renderHtml(description)}
        ></div>
      </p>
    </div>
  );
};

export default ArticleCard;
