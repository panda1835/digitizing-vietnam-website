"use client";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingIndicator from "@/components/LoadingIndicator";

const OnlineResources = ({ params: { locale } }) => {
  const [onlineResources, setOnlineResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState({});

  const t = useTranslations();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const queryParams = {
          "pagination[withCount]": "false",
          fields: "*",
          populate: "*",
          locale: locale,
        };

        const queryString = new URLSearchParams(queryParams).toString();
        const response = await fetch(`/api/online-resources?${queryString}`);
        const data = await response.json();
        setOnlineResources(data["data"]);
      } catch (error) {
        console.error("Error fetching online resources:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locale]);

  // Open modal for a specific category
  const openModal = (categoryName) => {
    setModalIsOpen({ ...modalIsOpen, [categoryName]: true });
  };

  // Close modal for a specific category
  const closeModal = (categoryName) => {
    setModalIsOpen({ ...modalIsOpen, [categoryName]: false });
  };

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{t("Header.home")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>{t("OnlineResource.title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <section className="flex flex-col items-center justify-center mt-8">
          <h1 className="">{t("OnlineResource.title")}</h1>
          <p className="text-gray-500 mb-5 text-center">
            {t("OnlineResource.subtitle")}
          </p>
        </section>

        {/* Loading indicator */}
        {loading ? (
          <div className="mt-20">
            <LoadingIndicator />
          </div>
        ) : (
          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {onlineResources.map((category) => (
              <div
                className="flex flex-col items-left justify-items-start"
                key={category.category_name}
              >
                <Image
                  unoptimized
                  src={category.image_url}
                  alt={`Icon for ${category.category_name}`}
                  width={80}
                  height={80}
                />

                <Dialog>
                  <DialogTrigger>
                    <h2 className="text-left cursor-pointer">
                      {category.category_name}
                    </h2>
                  </DialogTrigger>
                  <DialogContent className="bg-white ">
                    <DialogHeader>
                      <DialogTitle>
                        <h2 className="mr-6">{category.category_name}</h2>
                      </DialogTitle>
                      <DialogDescription className="text-left">
                        <ScrollArea className="h-[500px] w-full p-4">
                          {category.resources.length === 0 && (
                            <p>{t("OnlineResource.no-resource-message")}</p>
                          )}
                          {category.resources.map((resource) => (
                            <div key={resource.title} className="">
                              <Link
                                href={resource.url}
                                passHref
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-blue-500"
                              >
                                <h3>{resource.title}</h3>
                              </Link>
                              <p className="text-black mb-5">
                                {resource.description}
                              </p>
                            </div>
                          ))}
                        </ScrollArea>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>

                <p className="text-left">{category.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineResources;
