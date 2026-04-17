"use client";

import { Link } from "@/i18n/routing";
import LearnMoreButton from "@/components/LearnMoreButton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Merriweather } from "next/font/google";
import { PedagogyCollection } from "./page";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export const PedagogyCollectionItem = ({
  collection,
  basePath = "/pedagogy",
}: {
  collection: PedagogyCollection;
  basePath?: string;
}) => {
  const t = useTranslations();
  const url = `${basePath}/${collection.slug}`;

  return (
    <div className="h-full">
      <Card className="bg-branding-gray flex flex-col h-full">
        <CardHeader>
          <CardTitle
            className={`text-[32px] font-light h-12 ${merriweather.className} text-branding-brown hover:underline`}
          >
            <Link href={url}>{collection.title}</Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-end mt-20">
          <p className="font-['Helvetica Neue'] font-light text-muted-foreground text-[16px]">
            {collection.abstract}
          </p>
        </CardContent>
        <CardFooter>
          <LearnMoreButton url={url} text={t("Button.learn-more")} />
        </CardFooter>
      </Card>
    </div>
  );
};
