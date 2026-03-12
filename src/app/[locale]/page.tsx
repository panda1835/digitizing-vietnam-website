import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";

import { Merriweather } from "next/font/google";

import LearnMoreButton from "@/components/LearnMoreButton";
import ImageSlideshow from "@/components/ImageSlideshow";

import { fetcher } from "@/lib/api";
import { Link, routing } from "@/i18n/routing";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

import { formatDate } from "@/utils/datetime";
import { getImageByKey } from "@/utils/image";

// Generate static pages for all locales
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Revalidate home page every hour for ISR
export const revalidate = 3600;

const Home = async ({ params: { locale } }) => {
  // Enable static rendering for this page
  setRequestLocale(locale);

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

  const data = await fetcher(url, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  const highlights = data.data.slice(0, 5);
  const heroSlides = highlights
    .map((item) => {
      const formats = item.thumbnail?.[0]?.formats;
      const image =
        (formats && getImageByKey(formats, "large")) ||
        (formats && getImageByKey(formats, "medium")) ||
        (formats && getImageByKey(formats, "small"));

      if (!image) {
        return null;
      }

      return {
        img: image.url,
        caption: t("NavigationBar.highlights"),
        title: item.title,
        date: formatDate(item.createdAt, locale),
        href: `/highlights/${item.slug}`,
      };
    })
    .filter(Boolean);

  const studyRows = [
    {
      key: "collections",
      title: t("NavigationBar.our-collections"),
      description: t("Collection.subtitle"),
      image: "/images/image-row-collection.JPG",
      url: "/our-collections",
    },
    {
      key: "research",
      title: t("NavigationBar.tools"),
      description: t("Tools.subtitle"),
      image: "/images/image-row-research.JPG",
      url: "/research",
    },
    {
      key: "pedagogy",
      title: t("NavigationBar.pedagogy-menu"),
      description: t("Pedagogy.subtitle"),
      image: "/images/image-row-pedagogy.JPG",
      url: "/pedagogy",
    },
    {
      key: "outreach",
      title: t("NavigationBar.outreach-menu"),
      description: t("Outreach.subtitle"),
      image: "/images/image-row-outreach.JPG",
      url: "/outreach",
    },
  ];

  return (
    <div className="flex flex-col items-center max-width w-full">
      <div className="flex-col mb-20 w-full">
        {/* Header + News Carousel */}
        <section className="grid lg:grid-cols-5 gap-10 items-center mb-20 mt-10">
          <div className="lg:col-span-2 max-w-2xl">
            <div>
              {locale === "en" ? (
                <h1
                  className={`text-branding-black text-[36px] font-light leading-tight ${merriweather.className}`}
                >
                  Vietnamese Studies in the Age of{" "}
                  <span className="text-branding-brown">
                    Digital Humanities
                  </span>{" "}
                  and <span className="text-branding-brown">AI</span>:
                </h1>
              ) : (
                <h1
                  className={`text-branding-black text-[36px] font-light leading-tight ${merriweather.className}`}
                >
                  Việt Nam học trong thời đại{" "}
                  <span className="text-branding-brown">Nhân văn số</span> và{" "}
                  <span className="text-branding-brown">Trí tuệ nhân tạo</span>:
                </h1>
              )}
            </div>
            <p className="mt-6 font-['Helvetica Neue'] font-light text-[16px] text-branding-black">
              {locale === "en" ? (
                <>
                  Digitizing Vietnam is a new inter-institutional hub dedicated
                  to expanding the digital and AI frontiers of Vietnamese
                  Studies, through novel{" "}
                  <strong className="font-bold">digital collections</strong>,
                  innovative{" "}
                  <strong className="font-bold">research hubs</strong> focused
                  on digital and AI tools of analysis, a pedagogical{" "}
                  <strong className="font-bold">archive</strong> for teaching
                  Vietnam at all levels, and an{" "}
                  <strong className="font-bold">outreach portal</strong> to
                  share knowledge on all aspects of Vietnam with the general
                  public.
                </>
              ) : (
                <>
                  Digitizing Việt Nam là một không gian liên kết các
                  trường-viện, nhằm mở rộng các biên giới số và trí tuệ nhân tạo
                  của ngành Việt Nam học thông qua việc xây dựng các{" "}
                  <strong className="font-bold">bộ sưu tập số mới</strong>, phát
                  triển các{" "}
                  <strong className="font-bold">không gian nghiên cứu</strong>{" "}
                  sáng tạo tập trung vào công cụ phân tích số và trí tuệ nhân
                  tạo, hình thành một{" "}
                  <strong className="font-bold">kho tư liệu sư phạm</strong>{" "}
                  phục vụ việc giảng dạy về Việt Nam ở mọi cấp học, và thiết lập
                  một <strong className="font-bold">cổng kết nối</strong> để
                  chia sẻ hiểu biết về mọi khía cạnh của Việt Nam với công
                  chúng.
                </>
              )}
            </p>
          </div>
          <div className="lg:col-span-3">
            <ImageSlideshow slides={heroSlides} />
          </div>
        </section>

        {/* Study Vietnam Section */}
        <section className="mb-24 mt-24">
          <div className=" gap-8 lg:gap-6 items-start">
            {/* <div className=" flex items-start gap-6">
              <div
                className={`text-3xl font-medium text-branding-black ${merriweather.className}`}
              >
                {t("Home.studying-vietnam")}
              </div>
            </div> */}

            {/* <div className="mt-2 font-['Helvetica Neue'] font-light">
              <p>
                {locale === "en"
                  ? "Delve into Vietnam's history, culture, and society through cutting-edge tools and curated resources tailored for scholars, students, and educators."
                  : "Khám phá lịch sử, văn hóa và xã hội Việt Nam thông qua các công cụ tiên tiến và nguồn tư liệu được tinh chọn cho học giả, sinh viên và giáo viên."}
              </p>
            </div> */}
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 lg:gap-6">
            {studyRows.map((item) => (
              <div
                key={item.key}
                className="font-['Helvetica Neue'] text-branding-black"
              >
                <div className="mb-4">
                  <Image
                    unoptimized
                    src={item.image}
                    alt={item.title}
                    width={480}
                    height={320}
                    className="w-full aspect-[3/2] object-cover rounded-md"
                  />
                </div>
                <Link
                  href={item.url}
                  className={`text-lg font-medium text-branding-black hover:text-branding-brown hover:underline ${merriweather.className}`}
                >
                  <h3
                    className={`${merriweather.className} text-[20px] leading-tight font-medium mb-3`}
                  >
                    {item.title}
                  </h3>
                </Link>
                <p className="text-[14px] font-light">{item.description}</p>
                {/* <div className="mt-4">
                  <LearnMoreButton
                    text={t("Button.learn-more")}
                    url={item.url}
                  />
                </div> */}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10" />
        {/* About Us */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-start">
            <div className="lg:col-span-6 flex items-center gap-6">
              <div
                className={`text-3xl font-medium text-branding-black whitespace-nowrap ${merriweather.className}`}
              >
                {t("NavigationBar.about-us")}
              </div>
              <div className="h-px w-full bg-[#cfcfcf]" />
            </div>
            <div className="lg:col-span-6 font-['Helvetica Neue'] font-light">
              <p>
                {locale === "en"
                  ? "Digitizing Vietnam is an inter-institutional hub aimed at harnessing the power of digital humanities and AI for the advancement of all aspects of Vietnamese Studies. Funded by the Henry Luce Foundation and housed within Columbia University’s Vietnamese Studies Program, Digitizing Vietnam partners with Fulbright University of Vietnam to press forward the boundaries of Vietnamese Studies, through innovative new digital collections, research hubs focused on development of new digital humanities tools and bibliographic resources, a pedagogical archive for the teaching of Vietnam, and an outreach portal for bringing knowledge of Vietnam to ever wider audiences."
                  : "Digitizing Việt Nam  là một không gian liên trường-viện nhằm khai thác sức mạnh của nhân văn số và trí tuệ nhân tạo để thúc đẩy sự phát triển của mọi lĩnh vực trong ngành Việt Nam học. Được tài trợ bởi Quỹ Henry Luce và thuộc Chương trình Việt Nam học của Đại học Columbia, Digitizing Việt Nam  hợp tác với Đại học Fulbright Việt Nam để mở rộng biên giới của Việt Nam học thông qua việc xây dựng các bộ sưu tập số mới, phát triển các không gian nghiên cứu tập trung vào việc tạo ra những công cụ nhân văn số và nguồn tư liệu thư mục mới, hình thành một kho tư liệu sư phạm phục vụ việc giảng dạy về Việt Nam, và thiết lập một cổng kết nối nhằm đưa hiểu biết về Việt Nam đến với công chúng."}
              </p>
              <div className="mt-4">
                <LearnMoreButton
                  text={t("Button.learn-more")}
                  url="/about-us"
                />
              </div>
            </div>
          </div>

          {/* Partner Logos */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6 items-center">
            <div className="flex justify-center min-w-0">
              <Image
                unoptimized
                src="/images/weatherhead-logo.png"
                alt="Columbia University WeatherHead East Asian Institute"
                width={380}
                height={90}
                className="object-contain w-full h-auto max-w-[340px] max-h-[72px]"
              />
            </div>
            <div className="flex justify-center min-w-0">
              <Image
                unoptimized
                src="/images/vsc-logo.png"
                alt="Fulbright University Vietnam - Vietnam Studies Center"
                width={190}
                height={90}
                className="object-contain w-full h-auto max-w-[220px] max-h-[72px]"
              />
            </div>
            <div className="flex justify-center min-w-0">
              <Image
                unoptimized
                src="/images/henry-luce-foundation-logo.png"
                alt="Henry Luce Foundation"
                width={280}
                height={90}
                className="object-contain w-full h-auto max-w-[280px] max-h-[72px]"
              />
            </div>
            <div className="flex items-center justify-center gap-3 w-full min-w-0">
              <Image
                unoptimized
                src="/images/logo_icon.gif"
                alt="VNPF Logo"
                width={60}
                height={72}
                className="object-contain h-auto max-h-[64px] w-auto max-w-[30%]"
              />
              <Image
                unoptimized
                src="/images/logo.gif"
                alt="VNPF Logo"
                width={140}
                height={72}
                className="object-contain h-auto max-h-[64px] w-auto max-w-[65%]"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
