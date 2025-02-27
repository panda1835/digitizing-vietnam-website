"use client";

import clsx from "clsx";
import { ChangeEvent, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/routing";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LocaleSwitcherSelect({ children, defaultValue }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  function onSelectChange(nextLocale: "en" | "vi") {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div
      className={clsx(
        " text-gray-400 py-2 rounded-lg",
        isPending && "transition-opacity [&:disabled]:opacity-30"
      )}
    >
      <Select defaultValue={defaultValue} onValueChange={onSelectChange}>
        <SelectTrigger className="bg-branding-black text-branding-white">
          <SelectValue placeholder={defaultValue} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="vi">VI</SelectItem>
          <SelectItem value="en">EN</SelectItem>
        </SelectContent>
      </Select>
      {/* <select
        className="text-branding-white border-none bg-transparent"
        defaultValue={defaultValue}
        onChange={onSelectChange}
      >
        {children}
      </select> */}
    </div>
  );
}
