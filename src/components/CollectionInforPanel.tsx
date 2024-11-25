"use client";
import { useState } from "react";

const CollectionInfoPanel = ({ manifest, mediaType, currentPageOCR }) => {
  const [isDocumentMetadataVisible, setIsDocumentMetadataVisible] =
    useState(true);
  const [isOCRVisible, setIsOCRVisible] = useState(false);
  return (
    <div className="w-80">
      {/* Tab */}
      <div className="flex flex-row justify-between w-80">
        <button
          className={`${
            isDocumentMetadataVisible ? "font-bold" : "text-gray-500"
          }  cursor-pointer bg-transparent text-black`}
          onClick={() => {
            setIsDocumentMetadataVisible(true);
            setIsOCRVisible(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              setIsDocumentMetadataVisible(true);
              setIsOCRVisible(false);
            }
          }}
          tabIndex={0}
        >
          General Information
        </button>
        {mediaType === "document" && (
          <button
            className={`${
              isOCRVisible ? "font-bold" : "text-gray-500"
            } cursor-pointer bg-transparent text-black`}
            onClick={() => {
              setIsDocumentMetadataVisible(false);
              setIsOCRVisible(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setIsDocumentMetadataVisible(false);
                setIsOCRVisible(true);
              }
            }}
            tabIndex={0}
          >
            Text OCR
          </button>
        )}
      </div>

      {/* Info display */}
      <div className="flex flex-row h-full mirador justify-between border-solid border-2 p-2 rounded-lg">
        <div className="flex flex-col overflow-auto">
          {/* Document metadata */}
          {isDocumentMetadataVisible &&
            manifest &&
            manifest["metadata"] &&
            manifest["metadata"].map((item, index) => (
              <div key={index}>
                <div className="font-bold">
                  {Object.keys(item["label"]).includes("en")
                    ? item["label"]["en"][0]
                    : item["label"]}
                </div>
                <div>
                  {Object.keys(item["value"]).includes("en")
                    ? item["value"]["en"][0]
                    : item["value"]}
                </div>
              </div>
            ))}
          {/* OCR */}
          {isOCRVisible &&
            currentPageOCR.split("\n").map((line, index) => {
              return (
                <div key={index}>
                  <p>{line}</p>
                  <br></br>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default CollectionInfoPanel;
