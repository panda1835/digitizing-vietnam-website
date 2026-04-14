import { getTranslations, setRequestLocale } from "next-intl/server";

import Image from "next/image";

import { renderHtml } from "@/utils/renderHtml";
import { Separator } from "@/components/ui/separator";
import { fetcher } from "@/lib/api";
import Avatars from "./Avatars";
import LearnMoreButton from "@/components/LearnMoreButton";
import { Merriweather } from "next/font/google";
import { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

// Revalidate every 6 hours for ISR (about page rarely changes)
// export const revalidate = 21600;

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("AboutUs.title")} | Digitizing Việt Nam`,
  };
}

import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const AboutUs = async ({ params: { locale } }) => {
  // Enable static rendering for this page
  setRequestLocale(locale);

  let aboutUsData = [];

  const t = await getTranslations();
  // Enable static rendering
  try {
    const queryParams = {
      fields: "*",
      "populate[0]": "core_team.avatar",
      "populate[1]": "advisor.avatar",
      "populate[2]": "executive_director.avatar",
      "populate[3]": "fulbright_director.avatar",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/about-us?${queryString}`;

    const data = await fetcher(url, { cache: "force-cache" });
    aboutUsData = data.data;
  } catch (error) {
    console.error("Error fetching online resources:", error);
  }

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20">
        <PageHeader
          title={t("AboutUs.title")}
          subtitle={
            // <span
            //   dangerouslySetInnerHTML={renderHtml(aboutUsData["subheadline"])}
            // />
            locale === "en"
              ? "Digitizing Vietnam is an inter-institutional hub aimed at harnessing the power of digital humanities and AI for the advancement of all aspects of Vietnamese Studies. Funded by the Henry Luce Foundation and housed within Columbia University’s Vietnamese Studies Program, Digitizing Vietnam partners with Fulbright University of Vietnam to press forward the boundaries of Vietnamese Studies, through innovative new digital collections, research hubs focused on development of new digital humanities tools and bibliographic resources, a pedagogical archive for the teaching of Vietnam, and an outreach portal for bringing knowledge of Vietnam to ever wider audiences."
              : "Digitizing Việt Nam  là một không gian liên trường-viện nhằm khai thác sức mạnh của nhân văn số và trí tuệ nhân tạo để thúc đẩy sự phát triển của mọi lĩnh vực trong ngành Việt Nam học. Được tài trợ bởi Quỹ Henry Luce và thuộc Chương trình Việt Nam học của Đại học Columbia, Digitizing Việt Nam  hợp tác với Đại học Fulbright Việt Nam để mở rộng biên giới của Việt Nam học thông qua việc xây dựng các bộ sưu tập số mới, phát triển các không gian nghiên cứu tập trung vào việc tạo ra những công cụ nhân văn số và nguồn tư liệu thư mục mới, hình thành một kho tư liệu sư phạm phục vụ việc giảng dạy về Việt Nam, và thiết lập một cổng kết nối nhằm đưa hiểu biết về Việt Nam đến với công chúng."
          }
          locale={locale}
          breadcrumbItems={[{ label: t("AboutUs.title") }]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-10">
          <div className={`${merriweather.className}  text-[32px]`}>
            {locale === "en" ? "Our Mission" : "Sứ mệnh"}
          </div>
          <div
            className="md:col-span-2 font-['Helvetica Neue'] font-light text-[16px] text-branding-black"
            dangerouslySetInnerHTML={renderHtml(aboutUsData["mission"])}
          />
        </div>

        <div className="mt-10">
          <Separator />
        </div>

        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-10">
          <div className={`${merriweather.className}  text-[32px]`}>
            {locale === "en" ? "Our Collections" : "Bộ sưu tập"}
          </div>
          <div className="md:col-span-2 font-['Helvetica Neue'] font-light text-[16px]">
            <div
              className="  text-branding-black"
              dangerouslySetInnerHTML={renderHtml(
                aboutUsData["our_collections"]
              )}
            />
            <LearnMoreButton
              url={"/our-collections"}
              text={t("Button.learn-more")}
              className="mt-8"
            />
          </div>
        </div>

        <div className="mt-10">
          <Separator />
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-10">
          <div className={`${merriweather.className}  text-[32px]`}>
            {locale === "en" ? "Advisors" : "Cố vấn"}{" "}
          </div>
          <Avatars teamMember={aboutUsData["advisor"]} />
        </div>
        <div className="mt-10">
          <Separator />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-10">
          <div className={`${merriweather.className}  text-[32px]`}>
            {locale === "en" ? "Executive Directors" : "Trưởng dự án"}{" "}
          </div>
          <Avatars teamMember={aboutUsData["executive_director"]} />
        </div>
        <div className="mt-10">
          <Separator />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-10">
          <div className={`${merriweather.className}  text-[32px]`}>
            {locale === "en"
              ? "Director of Fulbright Operations"
              : "Quản lý dự án tại Fulbright"}{" "}
          </div>
          <Avatars teamMember={aboutUsData["fulbright_director"]} />
        </div>
        <div className="mt-10">
          <Separator />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-10">
          <div className={`${merriweather.className}  text-[32px]`}>
            {locale === "en" ? "Core Team" : "Nhóm vận hành chính"}{" "}
          </div>
          <Avatars teamMember={aboutUsData["core_team"]} />
        </div>
        <div className="mt-10">
          <Separator />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          <div className={`${merriweather.className}  text-[32px]`}>
            {locale === "en" ? "Institutional Support" : "Đơn vị hỗ trợ"}
          </div>
          <div className="md:col-span-2">
            <div className={`${merriweather.className}  text-2xl`}>
              {locale === "en" ? " Predecessor" : "Đơn vị tiền nhiệm"}
            </div>
            <div
              className="font-['Helvetica Neue'] font-light text-[16px] text-branding-black mt-2"
              dangerouslySetInnerHTML={renderHtml(
                aboutUsData["institutional_support_predecessor"]
              )}
            />
            <div className="flex flex-wrap justify-center items-center gap-8 mb-16 mt-8">
              <Image
                unoptimized
                src="/images/logo_icon.gif"
                alt="VNPF Logo"
                width={80}
                height={80}
                className="object-contain"
              />
              <Image
                unoptimized
                src="/images/logo.gif"
                alt="VNPF Logo"
                width={200}
                height={80}
                className="object-contain"
              />
            </div>
            <div className={`${merriweather.className}  text-2xl`}>
              {locale === "en" ? "Core Institutions" : "Các đơn vị chính"}
            </div>
            <div
              className="font-['Helvetica Neue'] font-light text-[16px] text-branding-black mt-2"
              dangerouslySetInnerHTML={renderHtml(
                aboutUsData["institutional_support_core_institutions"]
              )}
            />
            <div className="flex flex-wrap justify-center items-center gap-16 mb-16 mt-8">
              <Image
                unoptimized
                src="/images/weatherhead-logo.png"
                alt="Columbia University WeatherHead East Asian Institute"
                width={250}
                height={80}
                className="object-contain"
              />
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
                src="/images/henry-luce-foundation-logo.png"
                alt="Henry Luce Foundation"
                width={200}
                height={80}
                className="object-contain"
              />
            </div>
            <div className={`${merriweather.className}  text-2xl`}>
              {locale === "en" ? "Partners" : "Đối tác"}
            </div>
            <div
              className="font-['Helvetica Neue'] font-light text-[16px] text-branding-black mt-2"
              dangerouslySetInnerHTML={renderHtml(
                aboutUsData["institutional_support_partners"]
              )}
            />
            <div className="flex justify-center flex-wrap items-center gap-8 mb-16 mt-8">
              {["1", "2", "3", "4", "5"].map((item) => (
                <Image
                  unoptimized
                  key={item}
                  src={`/images/partner-logo-${item}.png`}
                  alt="Fulbright University Vietnam - Vietnam Studies Center"
                  width={100}
                  height={80}
                  className="object-contain h-20"
                />
              ))}
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          <div className={`${merriweather.className}  text-[32px]`}>
            {locale === "en" ? "Special Acknowledgement" : "Cảm ơn đặc biệt"}
          </div>
          <div className="md:col-span-2 font-['Helvetica Neue'] font-light text-[16px] text-branding-black">
            {/* {aboutUsData["special_acknowledgement"]
              ?.split("\n")
              .map((line, index) => (
                <p key={index}>
                  {line}
                  <br />
                </p>
              ))} */}
            <div
              className="font-['Helvetica Neue'] font-light text-[16px] text-branding-black mt-2"
              dangerouslySetInnerHTML={renderHtml(
                aboutUsData["special_acknowledgement"]
              )}
            />
          </div>
        </div>

        <Separator className="mt-10" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          <div className={`${merriweather.className}  text-[32px]`}>
            {locale === "en" ? "Funding" : "Nguồn tài trợ"}
          </div>
          <div
            className="md:col-span-2 font-['Helvetica Neue'] font-light text-[16px] text-branding-black"
            dangerouslySetInnerHTML={renderHtml(aboutUsData["funding"])}
          />
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
