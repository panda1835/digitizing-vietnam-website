import { getTranslations } from "next-intl/server";

import { fetcher } from "@/lib/api";
import { Blog, BlogCategory } from "@/types/blog";
import { getImageByKey } from "@/utils/image";

import ArticleCard from "@/components/ArticleCard";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/utils/datetime";
import { Merriweather } from "next/font/google";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });
const Blogs = async ({ params: { locale } }) => {
  const t = await getTranslations();

  let blogData: BlogCategory[] = [];

  try {
    const queryParams = {
      fields: "*",
      "populate[0]": "blogs.thumbnail",
      "populate[1]": "blogs.blog_authors",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/blog-categories?${queryString}`;

    const data = await fetcher(url);
    const allCategories = data.data;
    const blogCategories: BlogCategory[] = [];

    allCategories.forEach((category) => {
      blogCategories.push({
        category_name: category.name,
        description: category.description,
        blogs: category.blogs.map((post) => {
          const thumbnail = getImageByKey(post.thumbnail[0].formats, "medium");
          return {
            title: post.title,
            author: post.blog_authors[0].name,
            date: post.publishedAt,
            slug: post.slug,
            content: post.content,
            thumbnail: {
              url: thumbnail!.url,
              width: thumbnail!.width,
              height: thumbnail!.height,
            },
          } as Blog;
        }),
      });
    });

    blogData = blogCategories;
  } catch (error) {
    console.error("Error fetching blogs:", error);
  }

  return (
    <div className="flex flex-col max-width items-center">
      <div className="flex-col mb-20 w-full">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[{ label: t("NavigationBar.highlights") }]}
        />

        {/* Headline */}
        <div
          className={`${merriweather.className} text-branding-black text-4xl`}
        >
          {t("NavigationBar.highlights")}
        </div>

        {/* Subheadline */}
        <div className={`${merriweather.className} mt-6`}>
          {locale === "en"
            ? "Latest news and discoveries from the digital front of Vietnamese heritage."
            : "Những tin tức và phát hiện mới nhất từ mặt trận kỹ thuật số của di sản Việt."}
        </div>

        {/* Tab */}
        <Tabs
          defaultValue={blogData[1].category_name
            .replace(/\s/g, "")
            .toLowerCase()}
          className="w-full mt-10"
        >
          <TabsList className="h-auto p-0 bg-transparent gap-8">
            {blogData.map((category) => (
              <TabsTrigger
                key={category.category_name}
                value={category.category_name.replace(/\s/g, "").toLowerCase()}
                className={[
                  "px-4 py-2 h-auto",
                  "data-[state=active]:bg-branding-white data-[state=active]:shadow-none",
                  "data-[state=active]:border-gray-200 data-[state=active]:text-foreground",
                  "data-[state=active]:border-b-branding-brown",
                  "rounded-t-lg rounded-b-none border border-b-2 border-transparent text-base font-normal",
                ].join(" ")}
              >
                {category.category_name}
              </TabsTrigger>
            ))}
          </TabsList>

          {blogData.map((category) => (
            <TabsContent
              value={category.category_name.replace(/\s/g, "").toLowerCase()}
              className="mt-6 space-y-4"
              key={category.category_name}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10">
                {category.blogs.map((item) => (
                  <ArticleCard
                    title={item.title}
                    description={item.content}
                    date={formatDate(item.date, locale)}
                    imageUrl={item.thumbnail}
                    link={`/highlights/${item.slug}`}
                    key={`/highlights/${item.slug}`}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Blogs;
