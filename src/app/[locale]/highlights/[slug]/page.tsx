import { renderHtml } from "@/utils/renderHtml";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Blog } from "@/types/blog";
import { fetcher } from "@/lib/api";
import { formatDate } from "@/utils/datetime";
import { Merriweather } from "next/font/google";
import SocialMediaSharing from "./SocialMediaSharing";

import { getImageByKey } from "@/utils/image";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
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
        url: getImageByKey(blogPost.thumbnail[0].formats, "medium")!.url,
        width: getImageByKey(blogPost.thumbnail[0].formats, "medium")!.width,
        height: getImageByKey(blogPost.thumbnail[0].formats, "medium")!.height,
      },
      content: blogPost.content,
      slug: blogPost.slug,
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
            <span className="text-branding-black text-base font-normal font-['Helvetica Neue'] leading-relaxed">
              By
            </span>
            <span className="text-branding-black text-base font-medium font-['Helvetica Neue'] leading-relaxed">
              {" "}
            </span>
            <span className="text-branding-brown text-base font-normal font-['Helvetica Neue'] leading-relaxed">
              {post.author}
            </span>
            <span className="text-branding-black text-base font-light font-['Helvetica Neue'] leading-relaxed">
              {" "}
              · {formatDate(post.date, locale)}
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
          className="mt-10 text-branding-black text-base font-light font-['Helvetica Neue'] leading-[30px]"
        />
        <div className="flex justify-end mt-12">
          <SocialMediaSharing title={post.title} />
        </div>

        <div>Related Highlights</div>
      </div>
    </div>
  );
};

export default BlogArticle;
