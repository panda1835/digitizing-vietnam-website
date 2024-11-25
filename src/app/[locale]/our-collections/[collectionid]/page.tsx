import { getTranslations } from "next-intl/server";

import CollectionItemGallery from "../../../../components/CollectionItemGallery";
import Item from "../../../../components/Item";
import ScrollButtons from "../../../../components/ScrollButtons";

import { fetchEachCollection } from "../../../../utils/data";
const EachCollection = async ({
  params,
}: {
  params: { collectionid: string; locale: string };
}) => {
  const locale = params.locale;
  const collectionId = params.collectionid;

  const t = await getTranslations("Collection");

  // Fetch data
  const { collectionData, featuredArticles } = await fetchEachCollection(
    collectionId,
    locale
  );

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 mx-5">
        {/* Banner */}
        <section
          className="bg-no-repeat bg-cover bg-center w-full h-80 flex flex-col items-center justify-center rounded-lg relative text-center"
          style={{
            backgroundImage: `url(${collectionData.Banner.url})`,
          }}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <h1 className="text-white relative z-10">{collectionData.Title}</h1>

          {/* Navigation buttons */}
          <div>
            <ScrollButtons />
            {/* Other server-side logic */}
          </div>
        </section>

        {/* Collection information */}
        <div className="my-10">{collectionData.Description}</div>

        {/* Item gallery */}
        <CollectionItemGallery
          collectionData={collectionData["collection_items"]}
          collectionId={collectionId}
        />
        <div className="mb-10"></div>

        {/* Featured articles */}
        <section>
          <h1 id="feature-articles">{t("featured-articles")}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {featuredArticles &&
              featuredArticles &&
              featuredArticles.map((item) => (
                <Item
                  title={item.title}
                  description={""}
                  imageUrl={item.image_url}
                  link={`/blogs/${item.blog_id}`}
                  key={`/blogs/${item.blog_id}`}
                />
              ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EachCollection;
