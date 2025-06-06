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

export async function InfoCard({ name, description, url, newTab = false }) {
  const t = await getTranslations();
  return (
    <div className="h-full">
      <Card className="bg-branding-gray flex flex-col h-full">
        <CardHeader>
          <CardTitle
            className={`text-4xl font-light h-12 ${merriweather.className} text-branding-brown hover:underline`}
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
        <CardContent className="flex-1 flex flex-col justify-end mt-5">
          <p className="font-['Helvetica Neue'] font-light text-muted-foreground text-lg">
            {description}
          </p>
        </CardContent>
        <CardFooter>
          <div>
            <LearnMoreButton
              url={url}
              newTab={newTab}
              text={t("Button.learn-more")}
            />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
