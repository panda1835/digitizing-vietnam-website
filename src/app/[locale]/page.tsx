import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Merriweather } from "next/font/google";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

import ImageSlideshow from "@/components/ImageSlideshow";
const Home = ({ params: { locale } }) => {
  const t = useTranslations();

  // Define your slides data
  const slides = [
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Cuon_thu_Chua_Thang_Nghiem_(1).jpeg",
      caption: {
        vi: "Cuốn thư ở Chùa Thắng Nghiêm, bộ sưu tập Hán-Nôm",
        en: "A wooden strolled placard at the Thang Nghiem Temple, Han-Nom Collection",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Muong_s_house,_Vietnamese_Studies_Journal,_Vol_32,_Ethnography.png",
      caption: {
        vi: "Mô hình nhà người Mường, Chuyên Đề Nghiên Cứu Việt Nam - Dân Tộc Học, số 32 ",
        en: "A map of Mường's house in Vietnamese Studies Journal, Ethnography, vol. 32",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Nữ_Giới_Chung_-_Header.png",
      caption: {
        vi: "Đề báo Nữ Giới Chung, số 1",
        en: "A snapshot of the first page of Nữ Giới Chung newspaper, vol.1",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Nữ_Giới_Chung_-_Quảng_Cáo_1.png",
      caption: {
        vi: "Quảng cáo nữ trang, báo Nữ Giới Chung, số 5",
        en: "An advertisement of a jewelery shop in Nữ Giới Chung newspaper, vol. 5",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Nữ_Giới_Chung_-_Quảng_Cáo_2.png",
      caption: {
        vi: "Quảng cáo thuốc lá, báo Nữ Giới Chung, số 1",
        en: "An advertisement of a cigarette shop in Nữ Giới Chung newspaper, vol.1",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Nữ_Giới_Chung_-_Quảng_Cáo_3.png",
      caption: {
        vi: "Quảng cáo xe đạp, báo Nữ Giới Chung, số 1",
        en: "An advertisement of a bicycle shop in Nữ Giới Chung newspaper, vol.1",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Saigon_Chronicles_-_Negotiating_Modernity.png",
      caption: {
        vi: "Chợ Tân Mỹ, bộ sưu tập phim ngắn Chuyện Sài Gòn ",
        en: "Tân Mỹ market, Saigon Chronicles",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Saigon_Chronicles_-_Wild_Style_Graffiti_in_Saigon_(4).png",
      caption: {
        vi: "Nghệ sĩ graffiti đường phố hoạt động trong hẻm Sài Gòn, bộ sưu tập phim ngắn Chuyện Sài Gòn",
        en: "Graffiti artist working in Sài Gòn's alley, Saigon Chronicles",
      },
    },
    {
      img: "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/assets/home_slideshow/Thu_Kinh_Dai_Toan.jpeg",
      caption: {
        vi: 'Một trang trong "Thư Kinh Đại Toàn", bộ sưu tập Hán-Nôm',
        en: 'A page in "Thu Kinh Dai Toan", Han-Nom Collection',
      },
    },
  ];

  const categories = [
    {
      name: "Collections",
      href: "/collections",
      description:
        "Explore our digital archive dedicated to the preservation and academic exploration of Vietnam's historical and intellectual heritage.",
    },
    {
      name: "Việt Nam for Educators ",
      href: "/vietnam-for-educators",
      description:
        "Through Việt Nam for Educators, we provide a comprehensive suite of resources to support teaching about Vietnam across all educational levels.",
    },
    {
      name: "Understanding Việt Nam",
      href: "/understanding-vietnam",
      description:
        "Understanding Việt Nam offers dynamic resources for the general public, including podcasts, digital humanities tools, and videos.",
    },
  ];

  return (
    <div className="flex flex-col items-center max-width w-full">
      <div className="flex-col mb-20 px-5 w-full">
        {/* Header */}
        <section className="max-w-7xl justify-center items-center inline-flex mb-10">
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
          <div className="max-w-3xl mb-8 lg:col-span-2 md:col-span-1 font-['Helvetica Neue']">
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
            <Link
              href="/about-us"
              className="text-branding-brown inline-flex items-center gap-2 my-4 hover:underline"
            >
              Learn more <ArrowRight className="h-4 w-4" />
            </Link>
            {/* Partner Logos */}
            <div className="flex flex-wrap items-center gap-8 mb-16">
              <Image
                src="/images/vsc-logo.png"
                alt="Fulbright University Vietnam - Vietnam Studies Center"
                width={200}
                height={80}
                className="object-contain"
              />
              <Image
                src="/images/weatherhead-logo.png"
                alt="Columbia University WeatherHead East Asian Institute"
                width={200}
                height={80}
                className="object-contain"
              />
              <Image
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
            <div className="max-w-3xl mb-8 lg:col-span-2 md:col-span-1 font-['Helvetica Neue']">
              <p className="text-muted-foreground ">
                Delve into Vietnam&apos;s history, culture, and society through
                cutting-edge tools and curated resources tailored for scholars,
                students, and educators.
              </p>
              <Link
                href="/about-us"
                className="text-branding-brown inline-flex items-center gap-2 my-4 hover:underline"
              >
                Learn more <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {categories.map((category, index) => (
              <Card key={index} className="bg-branding-gray">
                <CardHeader>
                  <CardTitle
                    className={`text-4xl font-light h-48 ${merriweather.className} text-branding-brown`}
                  >
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {category.description}
                  </p>
                </CardContent>
                <CardFooter>
                  <Link
                    href={`${category.href}`}
                    className="text-branding-brown inline-flex items-center gap-2 hover:underline"
                  >
                    Learn more <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardFooter>
              </Card>
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
              Highlights
            </div>
            <div className="max-w-3xl mb-8 lg:col-span-2 md:col-span-1 font-['Helvetica Neue']">
              <p className="text-muted-foreground ">
                Latest news and discoveries from the digital front of Vietnamese
                heritage.
              </p>
              <Link
                href="/blogs"
                className="text-branding-brown inline-flex items-center gap-2 my-4 hover:underline"
              >
                Learn more <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
