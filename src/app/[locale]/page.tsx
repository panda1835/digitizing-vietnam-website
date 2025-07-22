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
    sort: "createdAt:desc", // Use createdAt rather than publishedAt to avoid update after modification
  };

  const queryString = new URLSearchParams(queryParams).toString();

  const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/blogs?${queryString}`;

  const data = await fetcher(url);
  const highlights = data.data.slice(0, 3);

  const outlines = [
    {
      name: t("NavigationBar.our-collections"),
      description:
        locale === "en"
          ? "Explore our digital archive dedicated to preserving and academically exploring Vietnam's historical, cultural & intellectual heritage."
          : "Khám phá kho lưu trữ số - nơi dành riêng cho việc bảo tồn và nghiên cứu học thuật về di sản lịch sử, văn hóa & tư tưởng Việt Nam.",

      url: "/our-collections",
    },
    {
      name: t("NavigationBar.tools"),
      description:
        locale === "en"
          ? "Engage creatively with Vietnam Studies — Use Digitizing Vietnam's specialized tools to approach the field with fresh perspectives and critical insight."
          : "Tiếp cận lĩnh vực Nghiên cứu Việt Nam với các công cụ chuyên biệt của Digitizing Việt Nam.",
      url: "/tools",
    },
    {
      name: t("Outreach.title"),
      description:
        locale === "en"
          ? "Discover and teach Vietnam Studies with impact — Explore curated syllabi, lesson plans, and multimedia resources designed to support innovative and inclusive learning experiences."
          : "Khám phá và giảng dạy ngành Việt Nam học một cách hiệu quả với tuyển tập giáo trình, kế hoạch bài giảng và tài nguyên đa phương tiện.",
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
              {locale === "en" ? "pre-modern and modern" : ""}
            </span>
            <span
              className={`text-branding-brown text-[52px] font-light lg:hidden ${merriweather.className}`}
            >
              {locale === "vi" ? "cận đại và hiện đại." : ""}
            </span>
            <span
              className={`text-branding-black text-[52px] font-light ${merriweather.className}`}
            >
              {" "}
              {locale === "en" ? "Vietnam" : ""}
            </span>
            <div
              className={`text-branding-brown text-[52px] font-light lg:block hidden ${merriweather.className}`}
            >
              {locale === "vi" ? "cận đại và hiện đại." : ""}
            </div>
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
                ? "Digitizing Việt Nam marks a digital leap forward in Vietnam Studies through a Columbia - Fulbright collaboration, formalized through that began with a 2022 memorandum of understanding between the Weatherhead East Asian Institute and the Vietnam Studies Center. The Digitizing Việt Nam platform began with the generous donation of the complete archive by the Vietnamese Nôm Preservation Foundation to Columbia University in 2018."
                : '"Số hóa Việt Nam" (Digitizing Việt Nam) đánh dấu một bước tiến số quan trọng trong ngành Việt Nam học với sự hợp tác giữa Đại học Columbia và Đại học Fulbright. Sáng kiến chung này bắt đầu từ biên bản ghi nhớ giữa hai trường vào năm 2022. Nền tảng Số hoá Việt Nam được khởi đầu vào năm 2018 với sự đóng góp hào phóng toàn bộ kho tư liệu của Hội Bảo tồn Chữ Nôm Việt Nam cho Đại học Columbia.'}
            </p>
            <div className="mt-4 mb-10">
              <LearnMoreButton text={t("Button.learn-more")} url="/about-us" />
            </div>

            {/* Partner Logos */}
            <div className="flex flex-wrap items-center justify-between md:justify-center gap-10 mb-16">
              <Image
                unoptimized
                src="/images/weatherhead-logo.png"
                alt="Columbia University WeatherHead East Asian Institute"
                width={190}
                height={80}
                className="object-contain"
              />
              <Image
                unoptimized
                src="/images/vsc-logo.png"
                alt="Fulbright University Vietnam - Vietnam Studies Center"
                width={160}
                height={80}
                className="object-contain"
              />
              <Image
                unoptimized
                src="/images/henry-luce-foundation-logo.png"
                alt="Henry Luce Foundation"
                width={160}
                height={80}
                className="object-contain"
              />
              <div className="flex flex-wrap gap-4">
                <Image
                  unoptimized
                  src="/images/logo_icon.gif"
                  alt="VNPF Logo"
                  width={60}
                  height={80}
                  className="object-contain"
                />
                <Image
                  unoptimized
                  src="/images/logo.gif"
                  alt="VNPF Logo"
                  width={140}
                  height={80}
                  className="object-contain"
                />
              </div>
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
                date={formatDate(item.createdAt, locale)}
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
