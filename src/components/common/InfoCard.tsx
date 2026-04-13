import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LearnMoreButton from "../LearnMoreButton";

import { Merriweather } from "next/font/google";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

interface InfoCardProps {
  name: string;
  description: string;
  url: string;
  newTab?: boolean;
  ctaText?: string;
  ctaIsLink?: boolean;
}

export async function InfoCard({
  name,
  description,
  url,
  newTab = false,
  ctaText,
  ctaIsLink = true,
}: InfoCardProps) {
  const t = await getTranslations();
  return (
    <div className="h-full">
      <Card className="bg-branding-gray flex flex-col h-full">
        <CardHeader>
          <CardTitle
            className={`text-[32px] font-light h-12 ${merriweather.className} text-branding-brown hover:underline`}
          >
            <Link
              href={url}
              target={newTab ? "_blank" : undefined}
              rel={newTab ? "noopener noreferrer" : undefined}
            >
              {name}
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-start mt-5">
          <p className="font-['Helvetica Neue'] font-light text-muted-foreground text-[16px]">
            {description}
          </p>
        </CardContent>
        <CardFooter>
          <div>
            {ctaIsLink ? (
              <LearnMoreButton
                url={url}
                newTab={newTab}
                text={ctaText ?? t("Button.learn-more")}
              />
            ) : (
              <div className="h-[22px] inline-flex items-center text-branding-brown text-base font-normal">
                <div className="font-['Helvetica Neue'] font-light">
                  {ctaText ?? t("Button.learn-more")}
                </div>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
