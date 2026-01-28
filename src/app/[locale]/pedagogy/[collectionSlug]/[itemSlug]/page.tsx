import { renderHtml } from "@/utils/renderHtml";
import { getTranslations } from "next-intl/server";
import { fetcher } from "@/lib/api";
import { Merriweather } from "next/font/google";
import SocialMediaSharing from "@/components/common/SocialMediaSharing";
import { PedagogyMetadata } from "./Metadata";
import { Metadata } from "next";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export async function generateMetadata({
  params,
}: {
  params: { locale: string; collectionSlug: string; itemSlug: string };
}): Promise<Metadata> {
  const t = await getTranslations();

  try {
    const queryParams = {
      fields: "title",
      "filters[slug][$eq]": params.itemSlug,
      locale: params.locale,
    };
    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/pedagogies?${queryString}`;
    const data = await fetcher(url);

    if (data.data && data.data.length > 0) {
      return {
        title: `${data.data[0].title} | Digitizing Việt Nam`,
      };
    }
  } catch (error) {
    console.error("Error fetching pedagogy item metadata:", error);
  }

  return {
    title: `${t("NavigationBar.outreach")} | Digitizing Việt Nam`,
  };
}

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { Pedagogy } from "../../page";

interface PedagogyWithCollection extends Pedagogy {
  pedagogy_collection?: {
    slug: string;
    title: string;
  };
}

const PedagogicalResource = async ({
  params,
}: {
  params: { locale: string; collectionSlug: string; itemSlug: string };
}) => {
  const { locale, collectionSlug, itemSlug } = params;
  const t = await getTranslations();

  let post: PedagogyWithCollection = {
    title: "",
    description: "",
    contributors: [""],
    content: "",
    slug: "",
    metadata: {},
  };

  try {
    const queryParams = {
      fields: "*",
      "filters[slug][$eq]": itemSlug,
      "populate[0]": "thumbnail",
      "populate[1]": "contributors",
      "populate[2]": "languages",
      "populate[3]": "keywords",
      "populate[4]": "categories",
      "populate[5]": "metadata",
      "populate[6]": "metadata.affiliation",
      "populate[7]": "metadata.supported_languages",
      "populate[8]": "pedagogy_collections",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/pedagogies?${queryString}`;
    const data = await fetcher(url);
    const blogPost = data.data[0];
    post = {
      title: blogPost.title,
      description: blogPost.description,
      contributors: (blogPost.contributors &&
        blogPost.contributors.map((contributor) => contributor.name)) || [
        "Anonymous",
      ],
      content: blogPost.content,
      slug: blogPost.slug,
      metadata: blogPost.metadata?.[0],
      pedagogy_collection: blogPost.pedagogy_collection
        ? {
            slug: blogPost.pedagogy_collection.slug,
            title: blogPost.pedagogy_collection.title,
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error fetching pedagogy item:", error);
  }

  // Build breadcrumb items
  const breadcrumbItems = [
    {
      label: t("NavigationBar.outreach"),
      href: `pedagogy`,
    },
  ];

  if (post.pedagogy_collection) {
    breadcrumbItems.push({
      label: post.pedagogy_collection.title,
      href: `pedagogy/${post.pedagogy_collection.slug}`,
    });
  }

  breadcrumbItems.push({ label: post.title, href: "" });

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5 max-w-5xl">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={breadcrumbItems}
        />
        <p className={`${merriweather.className} text-branding-black text-4xl`}>
          {post.title}
        </p>
        <div className="h-[26px] flex-col justify-start items-start gap-5 inline-flex mt-8 mb-16">
          <div className="self-stretch font-['Helvetica_Neue'] text-lg">
            <span className="">{t("Outreach.contributed-by")}</span>{" "}
            <span className="text-branding-brown font-normal leading-relaxed">
              {post.contributors.join(", ")}
            </span>
          </div>
        </div>

        <PedagogyMetadata metadata={post.metadata} locale={locale} />

        <div
          dangerouslySetInnerHTML={renderHtml(post.content)}
          className=" text-branding-black text-base font-light font-['Helvetica Neue'] leading-[30px]"
        />
        <div className="flex justify-end mt-12">
          <SocialMediaSharing title={post.title} />
        </div>
      </div>
    </div>
  );
};

export default PedagogicalResource;
