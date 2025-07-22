import { renderHtml } from "@/utils/renderHtml";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Blog } from "@/types/blog";
import { fetcher } from "@/lib/api";
import { formatDate } from "@/utils/datetime";
import { Merriweather } from "next/font/google";
import SocialMediaSharing from "../../../../components/common/SocialMediaSharing";
import { Metadata } from "next";
import { getImageByKey } from "@/utils/image";
import algoliasearch from "algoliasearch";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";

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
      title: `${t("NavigationBar.highlights")} | Digitizing Việt Nam`,
    };
  }
}

const BlogArticle = async ({ params: { slug, locale } }) => {
  let post: Blog = {
    title: "",
    author: "",
    date: "",
    thumbnail: {
      url: "",
      width: 0,
      height: 0,
    },
    content: "",
    slug: "",
  };
  const t = await getTranslations();
  try {
    const queryParams = {
      fields: "*",
      "filters[slug][$eq]": slug,
      "populate[0]": "thumbnail",
      "populate[1]": "blog_authors",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/blogs?${queryString}`;
    const data = await fetcher(url);
    const blogPost = data.data[0];
    post = {
      title: blogPost.title,
      author: (blogPost.blog_authors[0] && blogPost.blog_authors[0].name) || "",
      date: blogPost.publishedAt,
      thumbnail: {
        url: getImageByKey(blogPost.thumbnail[0].formats, "large")!.url,
        width: getImageByKey(blogPost.thumbnail[0].formats, "large")!.width,
        height: getImageByKey(blogPost.thumbnail[0].formats, "large")!.height,
      },
      content: blogPost.content,
      slug: blogPost.slug,
    };
  } catch (error) {
    console.error("Error fetching blog:", error);
  }

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 max-w-5xl">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[
            {
              label: t("NavigationBar.highlights"),
              href: `highlights`,
            },
            { label: post.title },
          ]}
        />
        <p className={`${merriweather.className} text-branding-black text-4xl`}>
          {post.title}
        </p>
        <div className="h-[26px] flex-col justify-start items-start gap-5 inline-flex mt-8 mb-16">
          <div className="self-stretch">
            {post.author && (
              <span>
                <span className="text-branding-brown text-lg font-normal font-['Helvetica Neue'] leading-relaxed">
                  {post.author}
                </span>{" "}
                ·{" "}
              </span>
            )}

            <span className="text-branding-black text-lg font-light font-['Helvetica Neue'] leading-relaxed">
              {formatDate(post.date, locale)}
            </span>
          </div>
        </div>

        <Image
          unoptimized
          src={post.thumbnail.url}
          alt={post.title}
          width={post.thumbnail.width}
          height={post.thumbnail.height}
          className="w-full max-h-[500px] object-cover rounded-lg"
        />
        <div
          dangerouslySetInnerHTML={renderHtml(post.content)}
          className="mt-10 text-branding-black text-lg font-light font-['Helvetica Neue'] leading-[30px]"
        />
        <div className="flex justify-end mt-12">
          <SocialMediaSharing title={post.title} />
        </div>

        {/* <div>Related Highlights</div> */}
      </div>
    </div>
  );
};

export default BlogArticle;
