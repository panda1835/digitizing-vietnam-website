import { Link } from "@/i18n/routing";
import { Collection } from "@/types/collection";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { getImageByKey } from "@/utils/image";
import { Merriweather } from "next/font/google";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

interface CollectionListProps {
  collections: Collection[];
}

export const CollectionList = ({ collections }: CollectionListProps) => {
  // Sort all collections alphabetically by title
  const sortedCollections = [...collections].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return (
    <div className="w-full mt-10">
      <div className="space-y-2">
        {sortedCollections.map((collection) => {
          const thumbnail = getImageByKey(
            collection.thumbnail.formats,
            "large"
          );
          return (
            <div
              key={collection.slug}
              className="py-2 border-b border-gray-100 last:border-b-0"
            >
              <HoverCard>
                <HoverCardTrigger>
                  <Link href={`/our-collections/${collection.slug}`}>
                    <div
                      className={`${merriweather.className} text-lg text-branding-black hover:text-branding-brown hover:underline cursor-pointer`}
                    >
                      {collection.title}
                    </div>
                  </Link>
                </HoverCardTrigger>
                <HoverCardContent className="w-[400px] p-4">
                  <div className="flex flex-col gap-4">
                    <Image
                      unoptimized
                      src={thumbnail!.url}
                      alt={collection.title}
                      width={thumbnail!.width}
                      height={thumbnail!.height}
                      className="object-cover rounded w-full h-48"
                    />
                    <ScrollArea className="h-[150px]">
                      <div className="font-['Helvetica Neue'] font-light text-sm">
                        {collection.abstract}
                      </div>
                    </ScrollArea>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          );
        })}
      </div>
    </div>
  );
};
