"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { useLocale } from "next-intl";
import { flattenItems } from "./utils";

export function NestedDropdownMenu({
  menuData,
}: {
  menuData: { title: string; children?: any[] }[];
}) {
  const router = useRouter();
  const locale = useLocale();
  const flatItems = useMemo(() => flattenItems(menuData), []);
  const titleToIndex = Object.fromEntries(
    flatItems.map((item) => [item.title, item.index])
  );

  console.log(flattenItems(menuData));
  console.log("Title to Index Map:", titleToIndex);

  const handleClick = (title: string) => {
    const index = titleToIndex[title];
    router.push(`?topic=${index + 1}`);
  };

  const renderMenuItems = (items: any[]) =>
    items.map((item: any) => {
      if (item.children && item.children.length > 0) {
        return (
          <DropdownMenuSub key={item.title}>
            <DropdownMenuSubTrigger>{item.title}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {renderMenuItems(item.children)}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      } else {
        return (
          <DropdownMenuItem
            key={item.title}
            onClick={() => handleClick(item.title)}
          >
            {item.title}
          </DropdownMenuItem>
        );
      }
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {locale == "vi" ? "Chọn mục sách" : "Select Book Topic"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {renderMenuItems(menuData)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
