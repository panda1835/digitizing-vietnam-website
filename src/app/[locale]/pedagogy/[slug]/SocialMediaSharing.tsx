"use client";
import { Instagram, Facebook, Mail } from "lucide-react";
import Link from "next/link";
export default function SocialMediaSharing({ title }) {
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
        href={`mailto:?subject=${encodeURIComponent(
          title
        )}&body=${encodeURIComponent(window.location.href)}`}
        aria-label="Share via Email"
      >
        <Mail className="text-branding-black w-6 h-6" />
      </Link>
    </div>
  );
}
