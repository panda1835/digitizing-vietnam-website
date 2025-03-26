import { getTranslations } from "next-intl/server";

import Image from "next/image";

import { renderHtml } from "@/utils/renderHtml";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { Separator } from "@/components/ui/separator";
import { fetcher } from "@/lib/api";
import Avatars from "./Avatars";
import LearnMoreButton from "@/components/LearnMoreButton";
import { Merriweather } from "next/font/google";
import { Metadata } from "next";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("AboutUs.title")} | Digitizing Việt Nam`,
  };
}

const AboutUs = async ({ params: { locale } }) => {
  let aboutUsData = [];

  const t = await getTranslations();

  try {
    const queryParams = {
      fields: "*",
      "populate[0]": "core_team.avatar",
      "populate[1]": "advisor.avatar",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/about-us?${queryString}`;

    const data = await fetcher(url);
    aboutUsData = data.data;
  } catch (error) {
    console.error("Error fetching online resources:", error);
  }

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[{ label: t("AboutUs.title") }]}
        />
        <div
          className={`${merriweather.className} text-branding-black text-4xl`}
        >
          {t("AboutUs.title")}
        </div>
        <div
          className="md:col-span-2 font-['Helvetica Neue'] text-branding-black max-w-5xl mt-6"
          dangerouslySetInnerHTML={renderHtml(aboutUsData["subheadline"])}
        />

        <div className="mt-28">
          <Separator />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-10">
          <div className={`${merriweather.className}  text-4xl`}>
            {locale === "en" ? "Our Mission" : "Sứ mệnh"}
          </div>
          <div
            className="md:col-span-2 font-['Helvetica Neue'] text-branding-black"
            dangerouslySetInnerHTML={renderHtml(aboutUsData["mission"])}
          />
        </div>

        <div className="mt-20">
          <Separator />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-10">
          <div className={`${merriweather.className}  text-4xl`}>
            {locale === "en" ? "Our Collections" : "Bộ sưu tập"}
          </div>
          <div className="md:col-span-2 font-['Helvetica Neue']">
            <div
              className="  text-branding-black"
              dangerouslySetInnerHTML={renderHtml(
                aboutUsData["our_collections"]
              )}
            />
            <LearnMoreButton url={"/our-collections"} />
          </div>
        </div>

        <div className="mt-20">
          <Separator />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-10">
          <div className={`${merriweather.className}  text-4xl`}>
            {locale === "en" ? "Core Team" : "Nhóm vận hành chính"}{" "}
          </div>
          <Avatars teamMember={aboutUsData["core_team"]} />
        </div>
        <div className="mt-20">
          <Separator />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          <div className={`${merriweather.className}  text-4xl`}>
            {locale === "en" ? "Advisors" : "Cố vấn"}
          </div>
          <Avatars teamMember={aboutUsData["advisor"]} />
        </div>
        <div className="mt-20">
          <Separator />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          <div className={`${merriweather.className}  text-4xl`}>
            {locale === "en" ? "Institutional Support" : "Đơn vị hỗ trợ"}
          </div>
          <div className="md:col-span-2">
            <div className={`${merriweather.className}  text-2xl`}>
              {locale === "en" ? "Core Institutions" : "Core Institutions"}
            </div>
            <div
              className="font-['Helvetica Neue'] text-branding-black"
              dangerouslySetInnerHTML={renderHtml(
                aboutUsData["institutional_support_core_institutions"]
              )}
            />
            <div className="flex flex-wrap justify-between items-center gap-8 mb-16 mt-8">
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
            <div className={`${merriweather.className}  text-2xl`}>
              {locale === "en" ? "Partners" : "Partners"}
            </div>
            <div
              className="font-['Helvetica Neue'] text-branding-black"
              dangerouslySetInnerHTML={renderHtml(
                aboutUsData["institutional_support_partners"]
              )}
            />
            <div className="flex justify-between items-center gap-8 mb-16 mt-8">
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
          <div className={`${merriweather.className}  text-4xl`}>
            {locale === "en" ? "Funding" : "Nguồn tài trợ"}
          </div>
          <div
            className="md:col-span-2 font-['Helvetica Neue'] text-branding-black"
            dangerouslySetInnerHTML={renderHtml(aboutUsData["funding"])}
          />
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
