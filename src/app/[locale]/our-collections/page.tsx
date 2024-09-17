import { getTranslations, getLocale } from "next-intl/server";

import Item from "../../../components/Item";

import config from "../../config";
import { fetchData } from "@/lib/fetch";

const OurCollections = async () => {
  const locale = await getLocale();

  const t = await getTranslations("Collection");

  const data = await fetchData(`${config.api.collections}?lang=${locale}`);
  const collections = data["data"];

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        {/* Header */}
        <section className="flex flex-col items-center justify-center">
          <h1 className="">{t("title")}</h1>
          <p className="text-gray-500 mb-5 text-center">{t("subtitle")}</p>
        </section>

        {/* Collection gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {collections.map((collection) => (
            <Item
              title={collection.title}
              description={collection.description}
              max_trim_word={50}
              imageUrl={collection.image_url}
              link={`/our-collections/${collection.collection_id}`}
              key={`/our-collections/${collection.collection_id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OurCollections;
