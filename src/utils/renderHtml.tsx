import juice from "juice";
import DOMPurify from "isomorphic-dompurify";

// Function to convert <oembed> to <iframe>
const transformOembed = (html) => {
  return html.replace(
    /<oembed[^>]+url="([^"]+)"[^>]*><\/oembed>/g,
    (match, url) => {
      if (url.includes("vimeo.com")) {
        const videoId = url.split("/").pop();
        return `
          <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
            <iframe 
              src="https://player.vimeo.com/video/${videoId}" 
              width="900" height="500" 
              frameborder="0" 
              allow="autoplay; fullscreen; picture-in-picture" 
              allowfullscreen>
            </iframe>
          </div>`;
      } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = url.includes("youtu.be")
          ? url.split("/").pop() // Handle short YouTube links
          : new URL(url).searchParams.get("v"); // Extract video ID from YouTube URL

        if (!videoId) return match; // If no ID found, keep original tag

        return `
          <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
            <iframe 
              src="https://www.youtube.com/embed/${videoId}" 
              width="900" height="500" 
              frameborder="0" 
              allow="autoplay; encrypted-media; fullscreen" 
              allowfullscreen>
            </iframe>
          </div>`;
      }
      return match; // Keep original if it's not a recognized video link
    }
  );
};

const sanitizeHTML = (html) => {
  // Function to sanitize HTML content using DOMPurify to prevent Cross-Site Scripting (XSS) attacks
  return {
    __html: DOMPurify.sanitize(html, {
      ADD_TAGS: ["iframe"], // Allow iframes
      ADD_ATTR: ["allow", "allowfullscreen", "frameborder"], // Allow necessary attributes
    }),
  };
};

export const renderHtml = (html) => {
  if (!html) return { __html: "" };

  // Convert <oembed> to <iframe>
  const transformedHtml = transformOembed(html);

  // Inline CSS from <style> tags
  const inlinedHtml = juice(transformedHtml);

  // Sanitize the final HTML
  return sanitizeHTML(inlinedHtml);
};
