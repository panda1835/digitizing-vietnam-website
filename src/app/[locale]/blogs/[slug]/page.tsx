import { renderHtml } from "@/utils/renderHtml";

import { Blog } from "@/types/blog";
import { fetcher } from "@/lib/api";
import { formatDate } from "@/utils/datetime";

const BlogArticle = async ({ params: { slug, locale } }) => {
  let post: Blog = {
    title: "",
    author: "",
    date: "",
    thumbnail: "",
    content: "",
    slug: "",
  };

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
      author: blogPost.blog_authors[0].name,
      date: blogPost.publishedAt,
      thumbnail: blogPost.thumbnail[0].formats.medium.url,
      content: blogPost.content,
      slug: blogPost.slug,
    };
  } catch (error) {
    console.error("Error fetching blog:", error);
  } finally {
  }

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        <section
          className="bg-no-repeat bg-cover bg-center w-full h-80 flex flex-col items-center justify-center rounded-lg relative"
          style={{ backgroundImage: `url(${post.thumbnail})` }}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <p className="text-center text-3xl md:text-4xl text-white relative z-10 mb-5 mx-10">
            {post.title}
          </p>
          <p className="text-white relative z-10 font-bold mx-10">
            {post.author}
          </p>
          <p className="text-white relative z-10 font-bold mx-10">
            {formatDate(post.date, locale)}
          </p>
        </section>

        <div
          dangerouslySetInnerHTML={renderHtml(post.content)}
          className="mt-10"
        />
      </div>
    </div>
  );
};

export default BlogArticle;
