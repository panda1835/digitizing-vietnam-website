"use client";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "react-modal";
import Image from "next/image";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
        <section className="flex flex-col items-center justify-center mt-10">
          <h1 className="">{t("OnlineResource.title")}</h1>
          <p className="text-gray-500 mb-5 text-center">
            {t("OnlineResource.subtitle")}
          </p>
        </section>

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center mt-20">
            <div className={`loader ${loading ? "visible" : "hidden"} `}></div>
          </div>
        )}

        {/* Online resources gallery */}
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
              {/* <button className="bg-transparent"> */}
              <h2
                className="text-left cursor-pointer"
                onClick={() => openModal(category.category_name)}
              >
                {category.category_name}
              </h2>

              <Modal
                isOpen={modalIsOpen[category.category_name]}
                onRequestClose={() => closeModal(category.category_name)}
                contentLabel={category.category_name}
                key={category.category_name}
              >
                <button
                  onClick={() => closeModal(category.category_name)}
                  className="absolute top-0 right-0 m-2 bg-white text-primary-blue"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <h2 className="mr-6">{category.category_name}</h2>
                {category.resources.length === 0 && (
                  <p>{t("OnlineResource.no-resource-message")}</p>
                )}
                {category.resources.map((resource) => (
                  <div key={resource.title} className="">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-500"
                    >
                      <h3>{resource.title}</h3>
                    </a>
                    <p className="text-black mb-5">{resource.description}</p>
                  </div>
                ))}
              </Modal>

              {/* </button> */}
              <p className="text-left">{category.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnlineResources;
