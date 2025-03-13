import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Merriweather } from "next/font/google";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const NotFound = async () => {
  const t = await getTranslations();

  return (
    <div className="flex flex-col items-center max-width">
      <div
        className={`${merriweather.className} text-branding-black text-4xl mt-20`}
      >
        {t("ErrorPage.not-found")}
      </div>
      <div className="mt-10 text-muted-foreground">
        {t("ErrorPage.not-found-message")}
      </div>
      <Link href={`/`}>
        <div className="mt-10 text-branding-white border bg-branding-black px-4 py-2 rounded-md cursor-pointer">
          {t("ErrorPage.back-to-home")}
        </div>
      </Link>
    </div>
  );
};

export default NotFound;
