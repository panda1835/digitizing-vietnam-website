import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Merriweather } from "next/font/google";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SearchBar from "@/components/search/SearchBar";
import LearnMoreButton from "@/components/LearnMoreButton";
import { fetcher } from "@/lib/api";

import { slides } from "@/utils/home-slides";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

import ImageSlideshow from "@/components/ImageSlideshow";
import ArticleCard from "@/components/ArticleCard";
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

  return (
    <div className="flex flex-col items-center max-width w-full">
      <div className="flex-col mb-20 px-5 w-full">
        <SearchBar locale={locale} />
        {/* Header */}
        <section className="max-w-7xl justify-center items-center inline-flex mb-10 mt-10">
          <div className="max-w-6xl">
            <span
              className={`text-branding-black text-[52px] font-light ${merriweather.className}`}
            >
              A digital hub to study{" "}
            </span>
            <span
              className={`text-branding-brown text-[52px] font-light ${merriweather.className}`}
            >
              pre-modern and modern
            </span>
            <span
              className={`text-branding-black text-[52px] font-light ${merriweather.className}`}
            >
              {" "}
              Vietnam
            </span>
          </div>
        </section>

        {/* Slideshow */}
        <section className="w-full mb-20">
          <ImageSlideshow slides={slides} locale={locale} />
        </section>

        {/* Content */}
        <div className="mt-40 mb-10">
          <Separator />
        </div>
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            className={`text-3xl font-medium mb-6 text-branding-black ${merriweather.className}`}
          >
            About Us
          </div>
          <div className="max-w-3xl mb-8 lg:col-span-2 md:col-span-1 font-['Helvetica Neue'] font-light">
            <p className="text-muted-foreground ">
              Digitizing Vietnam marks a digital leap forward in Vietnam Studies
              with the Columbia-Fulbright collaboration. This joint venture
              started with the memorandum of understanding between two
              universities in 2022. WeatherHead East Asian Institute of Columbia
              and Vietnam Studies Center of Fulbright will be accelerating
              research in the field of Vietnam studies, and exploring further
              value and serving many collaborative endeavors to come in the
              future.
            </p>
            <div className="mt-4 mb-10">
              <LearnMoreButton url="/about-us" />
            </div>

            {/* Partner Logos */}
            <div className="flex flex-wrap items-center justify-between gap-8 mb-16">
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
              Study Vietnam through the Digital Lens
            </div>
            <div className="max-w-3xl mb-8 lg:col-span-2 md:col-span-1 font-['Helvetica Neue'] font-light">
              <p className="text-muted-foreground ">
                Delve into Vietnam&apos;s history, culture, and society through
                cutting-edge tools and curated resources tailored for scholars,
                students, and educators.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            <Card className="bg-branding-gray">
              <CardHeader>
                <CardTitle
                  className={`text-4xl font-light h-12 ${merriweather.className} text-branding-brown`}
                >
                  Collections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Explore our digital archive dedicated to the preservation and
                  academic exploration of Vietnam&apos;s historical and
                  intellectual heritage.
                </p>
              </CardContent>
              <CardFooter>
                <div>
                  <LearnMoreButton url="/collections" />
                </div>
              </CardFooter>
            </Card>

            <Card className="bg-branding-gray">
              <CardHeader>
                <CardTitle
                  className={`text-4xl font-light h-12 ${merriweather.className} text-branding-brown`}
                >
                  Outreach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  The Digitizing Việt Nam Project regards outreach to be
                  fundamental. We do more than simply host collections—we bring
                  them to life and make them central to the education of
                  Vietnam&apos;s younger generations and the broader public.
                </p>
              </CardContent>
              <CardFooter>
                <div className="flex flex-col gap-4">
                  <LearnMoreButton
                    url="/vietnam-for-educators"
                    text="Việt Nam for Educators"
                    className={`text-lg ${merriweather.className} hover:text-branding-brown text-black`}
                  />
                  <LearnMoreButton
                    url="/understanding-vietnam"
                    text="Understanding Việt Nam"
                    className={`text-lg ${merriweather.className} hover:text-branding-brown text-black`}
                  />
                </div>
              </CardFooter>
            </Card>

            <Card className="bg-branding-gray">
              <CardHeader>
                <CardTitle
                  className={`text-4xl font-light h-12 ${merriweather.className} text-branding-brown`}
                >
                  Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Digitizing Vietnam marks a digital leap forward in Vietnam
                  Studies with the Columbia-Fulbright collaboration.
                </p>
              </CardContent>
              <CardFooter>
                <div>
                  <LearnMoreButton url="/tools" />
                </div>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Highlights */}
        <Separator className="mb-10" />
        <section className="mb-24">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              className={`text-3xl font-medium mb-6 text-branding-black ${merriweather.className}`}
            >
              Highlights
            </div>
            <div className="max-w-3xl mb-8 lg:col-span-2 md:col-span-1 font-['Helvetica Neue'] font-light">
              <p className="text-muted-foreground ">
                Latest news and discoveries from the digital front of Vietnamese
                heritage.
              </p>
              <div className="mt-4">
                <LearnMoreButton url="/highlights" />
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
