"use client";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Files } from "lucide-react";

const CollectionPermalink = () => {
  const t = useTranslations();
  const copyToClipboard = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href).then(
        () => {
          toast.success(t("Toast.copied"));
        },
        (err) => {
          toast.error(t("Toast.failed-to-copy"));
        }
      );
    }
  };
  return (
    <div className="mt-4 mb-10">
      <div className="flex justify-left items-center">
        <button
          onClick={copyToClipboard}
          className="mr-5 text-blue-500 flex justify-center items-center gap-2"
        >
          <Files className="" />
          <p className="">{t("Button.copy-url")}</p>
        </button>
      </div>
    </div>
  );
};

export default CollectionPermalink;
