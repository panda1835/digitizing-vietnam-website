"use client";

import clsx from "clsx";
import { ChangeEvent, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { routing } from "@/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "next-intl";

export default function LocaleSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const params = useParams();
  const defaultLocale = useLocale();

  function onSelectChange(nextLocale: "en" | "vi") {
    startTransition(() => {
      // router.replace(pathname, { locale: nextLocale });
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        { pathname, params },
        { locale: nextLocale }
      );
      // router.push(pathname, { locale: nextLocale });
    });
  }

  return (
    <div
      className={clsx(
        " text-gray-400 py-2 rounded-lg",
        isPending && "transition-opacity [&:disabled]:opacity-30"
      )}
    >
      <Select defaultValue={defaultLocale} onValueChange={onSelectChange}>
        <SelectTrigger className="bg-branding-black text-branding-white">
          <SelectValue placeholder={defaultLocale} />
        </SelectTrigger>
        <SelectContent>
          {routing.locales.map((cur) => (
            <SelectItem key={cur} value={cur}>
              {cur.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
