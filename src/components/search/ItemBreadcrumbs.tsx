"use client";

import { useTranslations } from "next-intl";

const ItemBreadcrumbs = ({ hit }) => {
  const t = useTranslations();
  return (
    <div className=" text-[#626262] text-base font-light font-['Helvetica_Neue']">
      {hit.online_resource_types && (
        <>
          {t("NavigationBar.online-resources")}
          {/* 
            This is for handling cases where the online resources
            was edited and became a Draft, which resulted in the
            online_resource_types being an empty array.
          */}{" "}
          {hit.online_resource_types.length > 0 && (
            <>
              &gt;{" "}
              {hit.online_resource_types[0].name ||
                hit.online_resource_types[0]}
            </>
          )}
        </>
      )}
      {hit.collection_location && (
        <>
          {t("NavigationBar.our-collections")} &gt; {hit.title || hit.name}
        </>
      )}
      {hit.collections && (
        <>
          {t("NavigationBar.our-collections")} &gt;{" "}
          {hit.collections[0].title || hit.collections[0]} &gt;{" "}
          {hit.title || hit.name}
        </>
      )}
    </div>
  );
};

export default ItemBreadcrumbs;
