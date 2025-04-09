import Link from "next/link";
import { unstable_setRequestLocale } from "next-intl/server";
import { Merriweather } from "next/font/google";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const NotFound = () => {
  unstable_setRequestLocale("en");
  return (
    <div className="flex flex-col items-center max-width">
      <div
        className={`${merriweather.className} text-branding-black text-4xl mt-20`}
      >
        Page Not Found
      </div>
      <div className="mt-10 text-muted-foreground">
        The page you are looking for does not exist.
      </div>
      <Link href={`/`}>
        <div className="mt-10 text-branding-white border bg-branding-black px-4 py-2 rounded-md cursor-pointer">
          Back to Home
        </div>
      </Link>
    </div>
  );
};

export default NotFound;
