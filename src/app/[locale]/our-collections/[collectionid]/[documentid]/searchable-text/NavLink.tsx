"use client";

import React from "react";
import { Link } from "@/i18n/routing";

export default function NavLink({
  topic,
  currentTopic,
  children,
}: {
  topic: string;
  currentTopic: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`?topic=${topic}`}
      className={`block px-6 py-3 border-b border-gray-100 transition-colors relative group ${
        topic == currentTopic
          ? "bg-gray-50 border-l-4 border-l-branding-brown"
          : "hover:bg-gray-50 hover:border-l-4 hover:border-l-branding-brown"
      }`}
    >
      <div className="text-gray-800">{children}</div>
    </Link>
  );
}
