"use client";

import { useTranslations } from "next-intl";

const ItemBreadcrumbs = ({ hit }) => {
  const t = useTranslations();
  return (
    <div className=" text-[#626262] text-base font-light font-['Helvetica_Neue']">
      {hit.online_resource_types && (
        <>
          {t("NavigationBar.online-resources")} &gt;{" "}
          {hit.online_resource_types[0].name}
        </>
      )}
      {hit.collection_location && (
        <>
          {t("NavigationBar.our-collections")} &gt; {hit.title || hit.name}
        </>
      )}
      {hit.collections && (
        <>
          {t("NavigationBar.our-collections")} &gt; {hit.collections[0].title}{" "}
          &gt; {hit.title || hit.name}
        </>
      )}
    </div>
  );
};

export default ItemBreadcrumbs;
