import { renderHtml } from "@/utils/renderHtml";
import { getTranslations } from "next-intl/server";
import { fetcher } from "@/lib/api";
import { Merriweather } from "next/font/google";
import SocialMediaSharing from "@/components/common/SocialMediaSharing";
import { PedagogyMetadata } from "@/app/[locale]/pedagogy/[collectionSlug]/[itemSlug]/Metadata";
import { Metadata } from "next";
import algoliasearch from "algoliasearch";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { Pedagogy } from "../page";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID! || "",
  process.env.NEXT_PUBLIC_ALGOLIA_API_KEY! || ""
);

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const t = await getTranslations();

  const { results } = await searchClient.search([
    {
      indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME!,
      query: params.slug,
      params: {
        restrictSearchableAttributes: ["slug"], // Only search in slug field
      },
    },
  ]);

  const hits = (results[0] as any).hits.filter(
    (hit) => hit.locale === params.locale
  );
  if (hits.length > 0) {
    return {
      title: `${hits[0].title} | Digitizing Việt Nam`,
    };
  } else {
    return {
      title: `${t(
        "Tools.digital-humanities-tools.name"
      )} | Digitizing Việt Nam`,
    };
  }
}

const PedagogicalResource = async ({ params: { slug, locale } }) => {
  const t = await getTranslations();
  let post: Pedagogy = {
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
      "filters[slug][$eq]": slug,
      "populate[0]": "thumbnail",
      "populate[1]": "contributors",
      "populate[2]": "languages",
      "populate[3]": "keywords",
      "populate[4]": "categories",
      "populate[5]": "metadata",
      "populate[6]": "metadata.affiliation",
      "populate[7]": "metadata.supported_languages",

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
      metadata: blogPost.metadata[0],
    };
  } catch (error) {
    console.error("Error fetching blog:", error);
  }

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5 max-w-5xl">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[
            {
              label: t("NavigationBar.tools"),
              href: `tools`,
            },
            {
              label: t("Tools.digital-humanities-tools.name"),
              href: `tools/digital-humanities-tools`,
            },
            { label: post.title },
          ]}
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
