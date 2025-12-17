"use client";

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
import { PedagogyCollection } from "./page";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export const PedagogyCollectionItem = ({
  collection,
}: {
  collection: PedagogyCollection;
}) => {
  const thumbnail = collection.thumbnail?.formats
    ? getImageByKey(collection.thumbnail.formats, "large")
    : collection.thumbnail;
  const t = useTranslations();

  return (
    <div className="">
      <Link href={`/pedagogy/${collection.slug}`}>
        {thumbnail && (
          <Image
            unoptimized
            src={thumbnail.url}
            alt={collection.title}
            width={thumbnail.width}
            height={thumbnail.height}
            className="object-cover rounded w-full h-40"
          />
        )}
      </Link>

      <Link href={`/pedagogy/${collection.slug}`}>
        <div
          className={`${merriweather.className} text-branding-black text-xl mt-6 hover:text-branding-brown hover:underline`}
        >
          {collection.title}
        </div>
      </Link>
      <HoverCard>
        <HoverCardTrigger>
          <div className="line-clamp-3 mt-3 font-['Helvetica Neue'] font-light">
            {collection.abstract}
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-[350px]">
          <ScrollArea className="h-[200px] p-4">
            {collection.abstract}
          </ScrollArea>
        </HoverCardContent>
      </HoverCard>
      <div className="mt-3">
        <LearnMoreButton
          url={`/pedagogy/${collection.slug}`}
          text={t("Button.learn-more")}
        />
      </div>
    </div>
  );
};
