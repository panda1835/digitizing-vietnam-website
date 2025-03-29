import { Link } from "@/i18n/routing";

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { getTranslations } from "next-intl/server";

import { Merriweather } from "next/font/google";
import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LearnMoreButton from "@/components/LearnMoreButton";
import { Separator } from "@/components/ui/separator";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("NavigationBar.tools")} | Digitizing Việt Nam`,
  };
}

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const Tools = async ({ params: { locale } }) => {
  const t = await getTranslations();
  const tools = [
    {
      href: "https://ocr.digitizingvietnam.com",
      target: "_blank",
      rel: "noopener noreferrer",
      name: t("Tools.image-ocr-platform.name"),
      description: t("Tools.image-ocr-platform.description"),
    },
    {
      href: "/tools/han-nom-dictionaries",
      name: t("Tools.han-nom-dictionaries.name"),
      description: t("Tools.han-nom-dictionaries.description"),
    },
    {
      href: "/tools/kieu-tools",
      name: t("Tools.kieu-tools.name"),
      description: t("Tools.kieu-tools.description"),
    },
  ];
  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[{ label: t("NavigationBar.tools") }]}
        />
        <div
          className={`${merriweather.className} text-branding-black text-4xl`}
        >
          {t("NavigationBar.tools")}
        </div>
        <div className="mt-28">
          <Separator />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          <Card className="bg-branding-gray flex flex-col">
            <CardHeader>
              <CardTitle
                className={`text-4xl font-light h-12 ${merriweather.className} text-branding-brown`}
              >
                {t("Tools.image-ocr-platform.name")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <p className="text-muted-foreground">
                {t("Tools.image-ocr-platform.description")}
              </p>
            </CardContent>
            <CardFooter>
              <div>
                <LearnMoreButton url="https://ocr.digitizingvietnam.com" />
              </div>
            </CardFooter>
          </Card>

          <Card className="bg-branding-gray flex flex-col">
            <CardHeader>
              <CardTitle
                className={`text-4xl font-light h-12 ${merriweather.className} text-branding-brown`}
              >
                {t("Tools.han-nom-dictionaries.name")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <p className="text-muted-foreground">
                {t("Tools.han-nom-dictionaries.description")}{" "}
              </p>
            </CardContent>
            <CardFooter>
              <div>
                <LearnMoreButton url="/tools/han-nom-dictionaries" />
              </div>
            </CardFooter>
          </Card>

          <Card className="bg-branding-gray flex flex-col">
            <CardHeader>
              <CardTitle
                className={`text-4xl font-light h-12 ${merriweather.className} text-branding-brown`}
              >
                {t("Tools.kieu-tools.name")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <p className="text-muted-foreground">
                {t("Tools.kieu-tools.description")}{" "}
              </p>
            </CardContent>
            <CardFooter>
              <div>
                <LearnMoreButton url="/tools/kieu-tools" />
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Tools;
