"use client";
import { useState } from "react";

import { ClipboardDocumentIcon } from "@heroicons/react/16/solid";

const CollectionPermalink = () => {
  const [copySuccess, setCopySuccess] = useState("Copy");
  const copyToClipboard = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href).then(
        () => {
          setCopySuccess("Copied!");
        },
        () => {
          setCopySuccess("Copy");
        }
      );
    }
  };
  return (
    <div className="pb-5">
      <div className="font-bold text-primary-blue">Permalink: </div>

      <div className="flex justify-left items-center">
        <button
          onClick={copyToClipboard}
          className="mr-5 bg-white text-black flex justify-center items-center"
        >
          <div className="flex-col text-center justify-center">
            <ClipboardDocumentIcon />
            {copySuccess && (
              <div
                className={
                  copySuccess == "Copied!"
                    ? "text-green-700 font-bold w-8"
                    : "text-black font-bold w-8"
                }
              >
                {copySuccess}
              </div>
            )}
          </div>
        </button>
        {typeof window !== "undefined" && window.location.href}
      </div>
    </div>
  );
};

export default CollectionPermalink;
