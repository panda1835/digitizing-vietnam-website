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
        setPost(data);
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
      <div className="flex-col mb-20 mx-10">
        <div dangerouslySetInnerHTML={sanitizeHTML(inlined)} />
      </div>
    </div>
  );
};

export default BlogArticle;
