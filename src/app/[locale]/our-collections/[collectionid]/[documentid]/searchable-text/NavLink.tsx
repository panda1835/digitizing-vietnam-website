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
      className={`py-3 px-6 border-b border-gray-100 hover:bg-gray-50 hover:border-l-branding-brown hover:border-l-4 transition-colors relative group ${
        topic == currentTopic
          ? "bg-gray-50 border-l-branding-brown border-l-4"
          : ""
      }`}
    >
      <span className="text-gray-800">{children}</span>
    </Link>
  );
}
