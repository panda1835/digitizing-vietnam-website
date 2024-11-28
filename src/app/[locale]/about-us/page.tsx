import { getTranslations } from "next-intl/server";

import Image from "next/image";

import { renderHtml } from "@/utils/renderHtml";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getImageByKey } from "@/utils/image";

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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/about-us?${queryString}`
    );
    const data = await response.json();
    aboutUsData = data["data"];
  } catch (error) {
    console.error("Error fetching online resources:", error);
  }

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 mx-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{t("Header.home")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("AboutUs.title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="flex justify-center mt-8">{t("AboutUs.title")}</h1>
        <h2 className="mt-5">{locale === "en" ? "Our Mission" : "Sứ mệnh"}</h2>
        <div dangerouslySetInnerHTML={renderHtml(aboutUsData["mission"])} />

        <h2 className="mt-5">
          {locale === "en" ? "Core Team" : "Nhóm vận hành chính"}
        </h2>
        <div className="flex flex-wrap justify-start items-start md:flex-row flex-col">
          {aboutUsData["core_team"] &&
            aboutUsData["core_team"].map((teamMember) => (
              <div
                key={teamMember.name}
                className="w-full md:w-1/3 flex flex-col items-center mb-5"
              >
                <Image
                  unoptimized
                  className="w-48 h-48 rounded-full mb-4 object-cover"
                  width={192}
                  height={192}
                  src={
                    teamMember.avatar
                      ? getImageByKey(teamMember.avatar.formats, "small")!.url
                      : "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png"
                  }
                  alt={
                    teamMember.avatar
                      ? teamMember.avatar.alternativeText
                      : `Avatar of ${teamMember.name}`
                  }
                />
                <h3 className="text-xl">{teamMember.name}</h3>
                <p className="px-5 font-bold">{teamMember.title}</p>
                <p className="px-5 text-center">{teamMember.description}</p>
              </div>
            ))}
        </div>

        <h2 className="mt-5">{locale === "en" ? "Advisors" : "Cố vấn"}</h2>
        <div className="flex flex-wrap justify-start items-start md:flex-row flex-col">
          {aboutUsData["advisor"] &&
            aboutUsData["advisor"].map((teamMember) => (
              <div
                key={teamMember.name}
                className="w-full md:w-1/3 flex flex-col items-center mb-5"
              >
                <Image
                  unoptimized
                  className="w-48 h-48 rounded-full mb-4 object-cover"
                  width={192}
                  height={192}
                  src={
                    teamMember.avatar
                      ? getImageByKey(teamMember.avatar.formats, "small")!.url
                      : "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png"
                  }
                  alt={
                    teamMember.avatar
                      ? teamMember.avatar.alternativeText
                      : `Avatar of ${teamMember.name}`
                  }
                />
                <h3 className="text-xl">{teamMember.name}</h3>
                <p className="px-5 font-bold text-center">{teamMember.title}</p>
                <p className="px-5 text-center">{teamMember.description}</p>
              </div>
            ))}
        </div>
        <h2 className="mt-5">
          {locale === "en" ? "Institutional Support" : "Đơn vị hỗ trợ"}
        </h2>
        <div
          className="pl-5"
          dangerouslySetInnerHTML={renderHtml(
            aboutUsData["institutional_support"]
          )}
        />

        <h2 className="mt-5">
          {locale === "en" ? "Funding" : "Nguồn tài trợ"}
        </h2>
        <div dangerouslySetInnerHTML={renderHtml(aboutUsData["funding"])} />

        <h2 className="mt-5">
          {locale === "en" ? "Our Collections" : "Bộ sưu tập"}
        </h2>
        <div
          dangerouslySetInnerHTML={renderHtml(aboutUsData["our_collections"])}
        />
      </div>
    </div>
  );
};

export default AboutUs;
