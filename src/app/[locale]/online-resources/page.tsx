import { getTranslations } from "next-intl/server";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OnlineResource, ResourceCategory } from "@/types/online-resource";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { MoveRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { fetcher } from "@/lib/api";

import { Merriweather } from "next/font/google";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });
const OnlineResources = async ({ params: { locale } }) => {
  const t = await getTranslations();

  let onlineResources: ResourceCategory[] = [];
  try {
    const queryParams = {
      "pagination[withCount]": "false",
      fields: "*",
      populate: "*",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/online-resource-types?${queryString}`;

    const data = await fetcher(url);
    const allCategories = data.data;
    const resourceCategories: ResourceCategory[] = [];
    // Iterate through each online resource type
    // add the online resources to the array
    allCategories.forEach((category) => {
      resourceCategories.push({
        category_name: category.name,
        description: category.description,
        image_url: category.thumbnail.url,
        resources: category.online_resources.map((resource) => {
          return {
            title: resource.name,
            description: resource.description,
            url: resource.url,
          } as OnlineResource;
        }),
      });
    });
    onlineResources = resourceCategories;
  } catch (error) {
    console.error("Error fetching online resources:", error);
  } finally {
  }

  return (
    <div className="flex flex-col max-width items-center">
      <div className="flex-col mb-20 w-full">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[{ label: t("NavigationBar.online-resources") }]}
        />

        {/* Headline */}
        <div
          className={`${merriweather.className} text-branding-black text-4xl`}
        >
          {t("NavigationBar.online-resources")}
        </div>

        {/* Subheadline */}
        <div className={`${merriweather.className} mt-6`}>
          {locale === "en"
            ? "Are you looking for a launchpad for your research on Vietnam? Check out some resources below and find the best fit."
            : "Bạn đang tìm kiếm một nơi để bắt đầu nghiên cứu về Việt Nam? Hãy xem qua các nguồn tài nguyên dưới đây của chúng tôi."}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {onlineResources.map((category) => (
            <div
              className="flex flex-col items-left justify-items-start border bg-branding-gray rounded-lg p-5 h-[400px] justify-between"
              key={category.category_name}
            >
              <div
                className={`${merriweather.className} text-branding-brown text-3xl`}
              >
                {category.category_name}
              </div>
              <div>
                <p className="text-base font-light font-['Helvetica Neue'] leading-relaxed text-branding-black text-left">
                  {category.description}
                </p>
                <Dialog>
                  <DialogTrigger>
                    <div className="mt-5 justify-start items-center gap-2 inline-flex text-branding-brown text-base font-normal">
                      <div className="font-['Helvetica Neue']">
                        {t("Button.learn-more")}
                      </div>
                      <MoveRight size={16} />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="bg-white max-w-none">
                    <DialogHeader>
                      <DialogTitle>
                        <div
                          className={`${merriweather.className} text-branding-brown text-3xl`}
                        >
                          {category.category_name}
                        </div>
                        <p className="mt-6 mb-6 text-base font-light font-['Helvetica Neue'] leading-relaxed text-branding-black text-left">
                          {category.description}
                        </p>
                        <Separator />
                      </DialogTitle>
                      <DialogDescription className="text-left">
                        <ScrollArea className="h-[500px] w-full">
                          {category.resources.length === 0 && (
                            <p>{t("OnlineResource.no-resource-message")}</p>
                          )}
                          {category.resources.map((resource) => (
                            <div key={resource.title} className="mb-7">
                              <span className="text-branding-black text-xl font-normal font-['Helvetica Neue'] leading-relaxed">
                                <Link
                                  href={resource.url}
                                  passHref
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:text-branding-brown"
                                >
                                  <div>{resource.title}</div>
                                </Link>
                              </span>
                              <span className="text-branding-black text-base font-light font-['Helvetica Neue'] leading-relaxed">
                                {resource.description}
                              </span>
                            </div>
                          ))}
                        </ScrollArea>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnlineResources;
