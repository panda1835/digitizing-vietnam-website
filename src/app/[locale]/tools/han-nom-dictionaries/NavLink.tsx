"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";

export default function NavLink({
  href,
  newTab = false,
  children,
}: {
  href: string;
  newTab?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname.split("/").pop() === href.split("/").pop();
  return (
    <Link
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className={`py-3 px-6 border-b border-gray-100 hover:bg-gray-50 hover:border-l-branding-brown hover:border-l-4 transition-colors relative group ${
        isActive ? "bg-gray-50 border-l-branding-brown border-l-4" : ""
      }`}
    >
      <span className="text-gray-800">{children}</span>
    </Link>
  );
}
