import Image from "next/image";
import { useTranslations } from "next-intl";
import { Collection } from "@/types/collection";
import LearnMoreButton from "@/components/LearnMoreButton";

import { Merriweather } from "next/font/google";
import { getImageByKey } from "@/utils/image";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export const CollectionItem = ({ collection }: { collection: Collection }) => {
  const thumbnail = getImageByKey(collection.thumbnail.formats, "medium");
  const t = useTranslations();
  return (
    <div className="">
      <Image
        unoptimized
        src={thumbnail!.url}
        alt={collection.title}
        width={thumbnail!.width}
        height={thumbnail!.height}
        className="object-cover rounded w-full h-40"
      />
      <div
        className={`${merriweather.className} text-branding-black text-2xl mt-6`}
      >
        {collection.title}
      </div>
      <div className="line-clamp-3 mt-3">{collection.abstract}</div>
      <div className="mt-3">
        <LearnMoreButton
          url={`/our-collections/${collection.slug}`}
          text={t("Button.learn-more")}
        />
      </div>
    </div>
  );
};
