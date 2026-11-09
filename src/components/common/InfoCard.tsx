import { ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
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

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});

interface InfoCardProps {
  name: string;
  description: string;
  url: string;
  newTab?: boolean;
  ctaText?: string;
  ctaIsLink?: boolean;
  variant?: "default" | "resource";
  /** Align title, description and action rows with sibling cards in a grid. */
  alignRows?: boolean;
  icon?: LucideIcon;
}

export async function InfoCard({
  name,
  description,
  url,
  newTab = false,
  ctaText,
  ctaIsLink = true,
  variant = "default",
  alignRows = false,
  icon: Icon,
}: InfoCardProps) {
  const t = await getTranslations();
  if (variant === "resource") {
    const resourceClass = alignRows
      ? "group row-span-3 grid grid-rows-subgrid gap-4 rounded-xl border border-branding-black/10 bg-white/90 p-5 sm:p-6 hover:border-branding-black/25 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-branding-brown"
      : "flex flex-col border bg-branding-gray rounded-lg p-5 h-full justify-between";
    const action = ctaText ?? t("Button.learn-more");
    const content = (
      <>
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="p-2 rounded-lg bg-branding-brown/10 text-branding-brown shrink-0">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
          )}
          <h3
            className={`${merriweather.className} ${
              alignRows
                ? "text-lg font-normal leading-relaxed text-branding-black"
                : "font-light text-branding-brown text-3xl"
            }`}
          >
            {name}
          </h3>
        </div>
        <div className={alignRows ? "contents" : ""}>
          <p
            className={
              alignRows
                ? "text-[15px] leading-relaxed text-branding-black/70"
                : "mt-5 text-base font-light font-['Helvetica Neue'] leading-relaxed text-branding-black text-left"
            }
          >
            {description}
          </p>
          <div className={alignRows ? "self-end" : "mt-5"}>
            {alignRows ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-[#956319] group-hover:underline underline-offset-2">
                {action}
                {ctaIsLink &&
                  (newTab ? (
                    <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
                  ) : (
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  ))}
              </span>
            ) : ctaIsLink ? (
              <LearnMoreButton url={url} newTab={newTab} text={action} />
            ) : (
              <span className="h-[22px] inline-flex items-center text-branding-brown text-base font-light font-['Helvetica Neue']">
                {action}
              </span>
            )}
          </div>
        </div>
      </>
    );

    if (alignRows && ctaIsLink) {
      return newTab ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={resourceClass}
        >
          {content}
        </a>
      ) : (
        <Link href={url} className={resourceClass}>
          {content}
        </Link>
      );
    }
    return <div className={resourceClass}>{content}</div>;
  }
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
