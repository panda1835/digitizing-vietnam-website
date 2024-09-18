"use client";

import clsx from "clsx";
import { ChangeEvent, useTransition } from "react";
import { usePathname, useRouter } from "../i18n/routing";

export default function LocaleSwitcherSelect({ children, defaultValue }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  function onSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div
      className={clsx(
        "relative text-gray-400",
        isPending && "transition-opacity [&:disabled]:opacity-30"
      )}
    >
      <select
        className="text-primary-yellow border-none bg-transparent"
        defaultValue={defaultValue}
        onChange={onSelectChange}
      >
        {children}
      </select>
    </div>
  );
}
