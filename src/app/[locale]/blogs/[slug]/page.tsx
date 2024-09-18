import juice from "juice";
import DOMPurify from "isomorphic-dompurify";

import { fetchBlogArticle } from "../../../../lib/data";

const BlogArticle = async ({ params }: { params: { slug: string } }) => {
  const blogId = params.slug;

  // Function to sanitize HTML content using DOMPurify to prevent Cross-Site Scripting (XSS) attacks
  const sanitizeHTML = (html) => {
    return { __html: DOMPurify.sanitize(html) };
  };

  const post = await fetchBlogArticle(blogId);

  // Use juice to convert the CSS in <style> tags to inline styles
  const inlined = post ? juice(post.content) : "";

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        <section
          className="bg-no-repeat bg-cover bg-center w-full h-80 flex flex-col items-center justify-center rounded-lg relative"
          style={{ backgroundImage: `url(${post.image_url})` }}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <p className="text-center text-3xl md:text-4xl text-white relative z-10 mb-5 mx-10">
            {post.title}
          </p>
          <p className="text-white relative z-10 font-bold mx-10">
            {post.author}
          </p>
          <p className="text-white relative z-10 font-bold mx-10">
            {post.date_created}
          </p>
        </section>

        <div dangerouslySetInnerHTML={sanitizeHTML(inlined)} />
      </div>
    </div>
  );
};

export default BlogArticle;
