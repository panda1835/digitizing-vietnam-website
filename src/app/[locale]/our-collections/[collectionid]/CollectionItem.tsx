import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import LearnMoreButton from "@/components/LearnMoreButton";

import { Merriweather } from "next/font/google";
import { getImageByKey } from "@/utils/image";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export const CollectionItem = ({ collectionItem, collectionSlug }) => {
  const thumbnail = getImageByKey(collectionItem.thumbnail.formats, "medium");
  const t = useTranslations();
  return (
    <div className="">
      <Link href={`/our-collections/${collectionSlug}/${collectionItem.slug}`}>
        <Image
          unoptimized
          src={thumbnail!.url}
          alt={collectionItem.title}
          width={thumbnail!.width}
          height={thumbnail!.height}
          className="object-cover rounded w-full h-40"
        />
      </Link>
      <Link href={`/our-collections/${collectionSlug}/${collectionItem.slug}`}>
        <div
          className={`${merriweather.className} text-branding-black text-2xl mt-6`}
        >
          {collectionItem.title}
        </div>
      </Link>
      <div className="line-clamp-3 mt-3">{collectionItem.abstract}</div>
      <div className="mt-3">
        <LearnMoreButton
          url={`/our-collections/${collectionSlug}/${collectionItem.slug}`}
          text={t("Button.learn-more")}
        />
      </div>
    </div>
  );
};
