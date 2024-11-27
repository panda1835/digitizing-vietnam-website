import { getTranslations } from "next-intl/server";

import { BlogCategory } from "@/types/blog";

import Item from "@/components/Item";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { formatDate } from "@/utils/datetime";

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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/blogs?${queryString}`
    );
    const data = await response.json();
    blogData = data["data"];
  } catch (error) {
    console.error("Error fetching blogs:", error);
  }

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
              <BreadcrumbPage>{t("Header.blogs")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* Header */}
        <section className="flex-col text-center my-8">
          <h1>{t("Blog.title")}</h1>
          <p className="text-gray-500">{t("Blog.subtitle")}</p>
        </section>

        {blogData.map((category) => (
          <section className="mb-10" key={category.category_name}>
            <h1>{category.category_name}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10">
              {category.blogs.map((item) => (
                <Item
                  title={item.title}
                  description={`${item.author} - ${formatDate(
                    item.date,
                    locale
                  )}`}
                  imageUrl={item.thumbnail}
                  link={`/blogs/${item.slug}`}
                  key={`/blogs/${item.slug}`}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default Blogs;
