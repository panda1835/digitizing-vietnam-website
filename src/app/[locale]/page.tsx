import { getTranslations } from "next-intl/server";
import Image from "next/image";

import { Merriweather } from "next/font/google";

import { Separator } from "@/components/ui/separator";
import SearchBar from "@/components/search/SearchBar";
import LearnMoreButton from "@/components/LearnMoreButton";
import { InfoCard } from "@/components/common/InfoCard";
import ImageSlideshow from "@/components/ImageSlideshow";
import ArticleCard from "@/components/ArticleCard";

import { fetcher } from "@/lib/api";
import { generateHomePageCarouselItems } from "@/utils/home-slides";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

import { formatDate } from "@/utils/datetime";
import { getImageByKey } from "@/utils/image";
const Home = async ({ params: { locale } }) => {
  const t = await getTranslations();

  const queryParams = {
    fields: "*",
    "populate[0]": "thumbnail",
    // "populate[1]": "blogs.blog_authors",
    locale: locale,
    sort: "publishedAt:desc",
  };

  const queryString = new URLSearchParams(queryParams).toString();

  const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/blogs?${queryString}`;

  const data = await fetcher(url);
  const highlights = data.data.slice(0, 3);

  const outlines = [
    {
      name: t("NavigationBar.our-collections"),
      description: t("Collection.subtitle"),
      url: "/our-collections",
    },
    {
      name: t("NavigationBar.tools"),
      description: t("Tools.subtitle"),
      url: "/tools",
    },
    {
      name: t("Outreach.title"),
      description: t("Outreach.subtitle"),
      url: "/pedagogy",
    },
  ];

  const slides = await generateHomePageCarouselItems(locale);

  return (
    <div className="flex flex-col items-center max-width w-full">
      <div className="flex-col mb-20 w-full">
        <SearchBar locale={locale} />
        {/* Header */}
        <section className="max-w-7xl justify-center items-center inline-flex mb-10 mt-10">
          <div className="max-w-6xl">
            <span
              className={`text-branding-black text-[52px] font-light ${merriweather.className}`}
            >
              {locale === "en"
                ? "A digital hub to study"
                : "Không gian số hỗ trợ nghiên cứu Việt Nam"}{" "}
            </span>
            <span
              className={`text-branding-brown text-[52px] font-light ${merriweather.className}`}
            >
              {locale === "en"
                ? "pre-modern and modern"
                : "cận đại và hiện đại."}
            </span>
            <span
              className={`text-branding-black text-[52px] font-light ${merriweather.className}`}
            >
              {" "}
              {locale === "en" ? "Vietnam" : ""}
            </span>
          </div>
        </section>

        {/* Slideshow */}
        <section className="w-full mb-20">
          <ImageSlideshow slides={slides} />
        </section>

        {/* Content */}
        <div className="mt-40 mb-10">
          <Separator />
        </div>
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            className={`text-3xl font-medium mb-6 text-branding-black ${merriweather.className}`}
          >
            {t("NavigationBar.about-us")}
          </div>
          <div className=" mb-8 lg:col-span-2 md:col-span-1 font-['Helvetica Neue'] font-light text-lg">
            <p className=" ">
              {locale === "en"
                ? '"Digitizing Việt Nam" marks a digital leap forward in Vietnam Studies with the Columbia-Fulbright collaboration. This joint venture started with a memorandum of understanding between two universities in 2022. Weatherhead East Asian Institute of Columbia and Vietnam Studies Center of Fulbright will accelerate research in the field of Vietnam studies and explore many collaborative endeavors to come in the future.'
                : '"Số hóa Việt Nam" (Digitizing Việt Nam) đánh dấu một bước tiến số quan trọng trong ngành Việt Nam học với sự hợp tác giữa Đại học Columbia và Đại học Fulbright. Sáng kiến chung này bắt đầu từ biên bản ghi nhớ giữa hai trường vào năm 2022. Trong tương lai, Viện Nghiên cứu Đông Á Weatherhead thuộc Đại học Columbia và Trung tâm Nghiên cứu Việt Nam thuộc Đại học Fulbright sẽ cùng nhau thúc đẩy nghiên cứu trong lĩnh vực Việt Nam học, đồng thời khám phá thêm nhiều định hướng hợp tác mới.'}
            </p>
            <div className="mt-4 mb-10">
              <LearnMoreButton text={t("Button.learn-more")} url="/about-us" />
            </div>

            {/* Partner Logos */}
            <div className="flex flex-wrap items-center justify-between md:justify-center gap-16 mb-16">
              <Image
                unoptimized
                src="/images/vsc-logo.png"
                alt="Fulbright University Vietnam - Vietnam Studies Center"
                width={200}
                height={80}
                className="object-contain"
              />
              <Image
                unoptimized
                src="/images/weatherhead-logo.png"
                alt="Columbia University WeatherHead East Asian Institute"
                width={200}
                height={80}
                className="object-contain"
              />
              <Image
                unoptimized
                src="/images/henry-luce-foundation-logo.png"
                alt="Henry Luce Foundation"
                width={200}
                height={80}
                className="object-contain"
              />
            </div>
          </div>
        </section>
        <Separator className="mb-10" />
        {/* Study Vietnam Section */}
        <section className="mb-24">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              className={`text-3xl font-medium mb-6 text-branding-black ${merriweather.className}`}
            >
              {t("Home.studying-vietnam")}
            </div>
            <div className=" mb-8 lg:col-span-2 md:col-span-1 font-['Helvetica Neue'] font-light text-lg">
              <p className=" ">
                {locale === "en"
                  ? "Delve into Vietnam's history, culture, and society through cutting-edge tools and curated resources tailored for scholars, students, and educators."
                  : "Khám phá lịch sử, văn hóa và xã hội Việt Nam thông qua các công cụ tiên tiến và nguồn tư liệu được tinh chọn cho học giả, sinh viên và giáo viên."}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {outlines.map((item) => (
              <InfoCard
                name={item.name}
                description={item.description}
                url={item.url}
                key={item.url}
              />
            ))}
          </div>
        </section>

        {/* Highlights */}
        <Separator className="mb-10" />
        <section className="mb-24">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              className={`text-3xl font-medium mb-6 text-branding-black ${merriweather.className}`}
            >
              {t("NavigationBar.highlights")}
            </div>
            <div className=" mb-8 lg:col-span-2 md:col-span-1 font-['Helvetica Neue'] font-light text-lg">
              <p className=" ">{t("Highlight.subtitle")}</p>
              <div className="mt-4">
                <LearnMoreButton
                  text={t("Button.learn-more")}
                  url="/highlights"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {highlights.map((item) => (
              <ArticleCard
                title={item.title}
                description={item.content}
                date={formatDate(item.publishedAt, locale)}
                imageUrl={getImageByKey(item.thumbnail[0].formats, "medium")}
                link={`/highlights/${item.slug}`}
                key={`/highlights/${item.slug}`}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
