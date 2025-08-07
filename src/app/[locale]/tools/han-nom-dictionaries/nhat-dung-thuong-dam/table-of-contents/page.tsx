import { Merriweather } from "next/font/google";
import { Link } from "@/i18n/routing";
import { toc } from "../toc";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export default function TOC({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div>
      <div className={`${merriweather.className} text-branding-black text-4xl`}>
        {locale === "en" ? "Table of contents" : "Mục lục Tự điển"}
      </div>
      <div className="mt-10">
        <ul>
          {toc.map((item) => (
            <li key={item.id} className="mb-2">
              <Link
                href={`/tools/han-nom-dictionaries/nhat-dung-thuong-dam/${item.id}`}
                className="text-lg hover:underline font-['Helvetica Neue'] font-light text-branding-black hover:text-branding-brown"
              >
                {item.id}. {item.mon_loai} - {item.han_nom} -{" "}
                {locale === "en" ? item.en : item.vi}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
