"use client";
import { Instagram, Facebook, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SocialMediaSharing({ title }) {
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    // Only access window after component mounts (client-side)
    setCurrentUrl(window.location.href);
  }, []);

  return (
    <div className="flex gap-4">
      <Link
        href={`https://www.instagram.com/`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Instagram"
      >
        <Instagram className="text-branding-black w-6 h-6" />
      </Link>
      <Link
        href={`https://www.facebook.com/sharer/sharer.php`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
      >
        <Facebook className="text-branding-black w-6 h-6" />
      </Link>
      <Link
        href={
          currentUrl
            ? `mailto:?subject=${encodeURIComponent(
                title
              )}&body=${encodeURIComponent(currentUrl)}`
            : "#"
        }
        aria-label="Share via Email"
      >
        <Mail className="text-branding-black w-6 h-6" />
      </Link>
    </div>
  );
}
