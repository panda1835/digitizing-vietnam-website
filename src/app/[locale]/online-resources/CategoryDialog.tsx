"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoveRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Merriweather } from "next/font/google";
import { useTranslations } from "next-intl";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });
export default function CategoryDialog({
  category,
  defaultOpen = false,
}: {
  category: any;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = searchParams.get("category") === category.category_name;
  const t = useTranslations();
  const handleOpenChange = (open: boolean) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (open) {
      newParams.set("category", category.category_name);
    } else {
      newParams.delete("category");
    }
    const newUrl = `?${newParams.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  return (
    <Dialog open={isOpen || defaultOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="mt-5 justify-start items-center gap-2 inline-flex text-branding-brown text-base font-normal cursor-pointer">
          <div className="font-['Helvetica Neue'] hover:underline">
            {t("Button.learn-more")}
          </div>
          <MoveRight size={16} />
        </div>
      </DialogTrigger>
      <DialogContent className="bg-white max-w-none ">
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
            <ScrollArea className="h-[250px] sm:h-[500px] w-full">
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
  );
}
