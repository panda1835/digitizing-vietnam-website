"use client"; // Ensure this runs as a client component

import { useTranslations } from "next-intl";

export default function ScrollButtons() {
  const t = useTranslations("Collection");

  const scrollToElement = (elementId) => {
    document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex relative z-10">
      <div className="m-5">
        <button className="" onClick={() => scrollToElement("our-volumes")}>
          {t("our-volumes")}
        </button>
      </div>
      <div className="m-5">
        <button
          className=""
          onClick={() => scrollToElement("feature-articles")}
        >
          {t("featured-articles")}
        </button>
      </div>
    </div>
  );
}
