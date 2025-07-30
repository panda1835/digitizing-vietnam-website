"use client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
export default function PageInput({
  totalPages,
  currentPage,
}: {
  totalPages: number;
  currentPage: number;
}) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `?${params.toString()}`;
  };

  return (
    <div className="flex justify-center items-center space-x-2">
      <Button
        onClick={() => {
          const input = document.querySelector<HTMLInputElement>(
            'input[type="number"]'
          );
          const page = input ? Number(input.value) : 1;
          if (page >= 1 && page <= totalPages) {
            router.push(createPageUrl(page));
          }
        }}
        // className="bg-branding-brown text-white px-4 py-2 rounded"
      >
        {t("Button.go-to-page")}
      </Button>
      <input
        type="number"
        min="1"
        max={totalPages}
        placeholder={currentPage.toString()}
        className="border border-gray-300 rounded px-2 py-1 w-20 text-center"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const page = Number(e.currentTarget.value);
            if (page >= 1 && page <= totalPages) {
              router.push(createPageUrl(page));
            }
          }
        }}
      />
    </div>
  );
}
