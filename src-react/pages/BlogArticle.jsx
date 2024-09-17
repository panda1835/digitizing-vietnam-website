import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import juice from "juice";
import DOMPurify from "dompurify";
import config from "../config";

const BlogArticle = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [post, setPost] = useState(null);

  // Function to sanitize HTML content using DOMPurify to prevent Cross-Site Scripting (XSS) attacks
  const sanitizeHTML = (html) => {
    return { __html: DOMPurify.sanitize(html) };
  };

  useEffect(() => {
    fetch(`${config.api.blogs}?blog-id=${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch");
        }
        return response.json();
      })
      .then((data) => {
        setPost(data["data"]);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center">
        <div className={`loader ${loading ? "visible" : "hidden"} `}></div>
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center">
        <div className="">
          An error has occurred in this page. Please try again later.
        </div>
      </div>
    );

  // Use juice to convert the CSS in <style> tags to inline styles
  const inlined = post ? juice(post.content) : "";

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        <section
          className="bg-no-repeat bg-cover bg-center w-full h-80 flex flex-col items-center justify-center rounded-lg relative"
          style={{ "background-image": `url(${post.image_url})` }}
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
        {/* <h1>{post.title}</h1>
        <p className="">{post.author}</p>
        <p>{post.date_created}</p> */}
        <div dangerouslySetInnerHTML={sanitizeHTML(inlined)} />
      </div>
    </div>
  );
};

export default BlogArticle;
