"use client";
import BookItem from "./BookItem";
import { useState } from "react";
import { useTranslations } from "next-intl";

const CollectionItemGallery = ({ collectionData, collectionId }) => {
  const [itemsToShow, setItemsToShow] = useState(6);

  const t = useTranslations();

  const handleLoadMoreClick = () => {
    if (itemsToShow <= 6) {
      setItemsToShow(collectionData.documents.length); // Show all items
    } else {
      setItemsToShow(6); // Only show 6 items
    }
  };

  return (
    <div>
      <h1 id="our-volumes">{t("Collection.our-volumes")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
        {collectionData &&
          collectionData.documents &&
          collectionData.documents
            .slice(0, itemsToShow)
            .map((item) => (
              <BookItem
                title={item.title}
                description={""}
                imageUrl={item.image_url}
                link={`/our-collections/${collectionId}/${item.document_id}`}
                key={`/our-collections/${collectionId}/${item.document_id}`}
              />
            ))}
      </div>

      {collectionData.documents && collectionData.documents.length === 0 && (
        <div className="flex">
          <p>{t("Collection.no-volume-found")}</p>
        </div>
      )}

      {collectionData.documents && collectionData.documents.length > 6 && (
        <div className="flex flex-row justify-center mt-10">
          <button className="" onClick={handleLoadMoreClick}>
            {itemsToShow <= 6 ? t("Button.load-more") : t("Button.load-less")}
          </button>
        </div>
      )}
    </div>
  );
};

export default CollectionItemGallery;
