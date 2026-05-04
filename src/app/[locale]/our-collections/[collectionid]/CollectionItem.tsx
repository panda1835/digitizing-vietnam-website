import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import LearnMoreButton from "@/components/LearnMoreButton";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Merriweather } from "next/font/google";
import { getImageByKey } from "@/utils/image";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export const CollectionItem = ({ collectionItem, collectionSlug }) => {
  const thumbnail = getImageByKey(collectionItem.thumbnail.formats, "large");
  const abstract = collectionItem.abstract?.trim();
  const t = useTranslations();
  return (
    <div className="flex h-full min-w-0 flex-col">
      <Link href={`/our-collections/${collectionSlug}/${collectionItem.slug}`}>
        <Image
          unoptimized
          src={thumbnail!.url}
          alt={collectionItem.title}
          width={thumbnail!.width}
          height={thumbnail!.height}
          className="aspect-[5/2] h-auto w-full rounded object-cover"
        />
      </Link>
      <Link href={`/our-collections/${collectionSlug}/${collectionItem.slug}`}>
        <div
          className={`mt-[12px] line-clamp-2  min-w-0 font-['Helvetica Neue'] text-xl font-medium text-branding-black hover:text-branding-brown hover:underline`}
        >
          {collectionItem.title}
        </div>
      </Link>
      {abstract && (
        <HoverCard>
          <HoverCardTrigger asChild>
            <p className="mt-[8px] line-clamp-3 min-w-0 font-['Helvetica Neue'] font-light">
              {abstract}
            </p>
          </HoverCardTrigger>
          <HoverCardContent className="w-[350px]">
            <ScrollArea className="h-[200px] p-4">{abstract}</ScrollArea>
          </HoverCardContent>
        </HoverCard>
      )}

      {/* <div className="mt-3">
        <LearnMoreButton
          url={`/our-collections/${collectionSlug}/${collectionItem.slug}`}
          text={t("Button.learn-more")}
          newTab={false}
        />
      </div> */}
    </div>
  );
};
