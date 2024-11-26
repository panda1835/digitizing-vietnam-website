import juice from "juice";
import DOMPurify from "isomorphic-dompurify";

const sanitizeHTML = (html) => {
  // Function to sanitize HTML content using DOMPurify to prevent Cross-Site Scripting (XSS) attacks
  return { __html: DOMPurify.sanitize(html) };
};
export const renderHtml = (html) => {
  // Use juice to convert the CSS in <style> tags to inline styles
  const inlined = html ? juice(html) : "";
  return sanitizeHTML(inlined);
};
