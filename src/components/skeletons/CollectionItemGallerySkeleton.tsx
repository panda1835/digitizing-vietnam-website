"use client";
import BookItemSkeleton from "@/components/skeletons/BookItemSkeleton";
import { useTranslations } from "next-intl";

const CollectionItemGallery = () => {
  const t = useTranslations("Collection");
  return (
    <div>
      <h1 id="our-volumes">{t("our-volumes")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
        {[1, 2, 3].map((item) => (
          <BookItemSkeleton key={item} />
        ))}
      </div>
    </div>
  );
};

export default CollectionItemGallery;
