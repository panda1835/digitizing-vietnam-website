import Image from "next/image";
import { Link } from "@/i18n/routing";
import ItemBreadcrumbs from "./ItemBreadcrumbs";

const SearchBarResultItem = ({ hit }) => {
  return (
    <div className="bg-white hover:bg-gray-100 hover:rounded-lg p-3 px-6">
      <div key={hit} className="mt-1 overflow-hidden flex">
        <Link
          href={
            hit.collection_location
              ? `/our-collections/${hit.slug}`
              : hit.online_resource_types
              ? "/online-resources"
              : hit.collections
              ? `/our-collections/${
                  hit.collection_slugs
                    ? hit.collection_slugs[0]
                    : hit.collections[0].slug
                }/${hit.slug}`
              : "/"
          }
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-2"
        >
          {hit.thumbnail && (
            <Image
              unoptimized
              src={
                Array.isArray(hit.thumbnail)
                  ? hit.thumbnail[0]?.url
                  : hit.thumbnail.url
              }
              alt={hit.title}
              width={96}
              height={96}
              className="object-cover p-2 "
            />
          )}
          <div className="flex-grow">
            <div className="mb-1">
              <ItemBreadcrumbs hit={hit} />
            </div>
            <div className="text-lg font-normal font-['Helvetica_Neue'] mb-1">
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    hit._highlightResult?.title?.value ||
                    hit._highlightResult?.name?.value ||
                    hit.title ||
                    hit.name,
                }}
              />
            </div>
            <div className="text-base font-light font-['Helvetica_Neue'] mb-2 line-clamp-2">
              <div
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const highlightedText =
                      hit._highlightResult?.description?.value ||
                      hit._highlightResult?.abstract?.value ||
                      hit.description ||
                      hit.abstract;

                    if (!highlightedText) return "";

                    const regex =
                      /(?:\b(?:\w+\b\W*){0,10})<mark>.*?<\/mark>.*/i;
                    const match = highlightedText.match(regex);

                    if (match && !highlightedText.startsWith(match[0])) {
                      return `...${match[0]}`;
                    }
                    return match ? match[0] : highlightedText;
                  })(),
                }}
              />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default SearchBarResultItem;
