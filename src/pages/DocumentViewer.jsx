import { useParams, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";

import { ClipboardDocumentIcon } from "@heroicons/react/16/solid";

import Mirador from "../components/Mirador";
import MiradorURLSyncPlugin from "../mirador-plugins/MiradorURLSyncPlugin";

import config from "../config";

const DocumentViewer = () => {
  const { collectionId, documentId } = useParams();
  const location = useLocation();
  const originalCanvasId = new URLSearchParams(location.search).get("canvasId");

  const [documentData, setDocumentData] = useState({});
  const [currentCanvasId, setCurrentCanvasId] = useState("");
  const [currentPageOCR, setCurrentPageOCR] = useState("");
  const [isDocumentMetadataVisible, setIsDocumentMetadataVisible] =
    useState(true);
  const [isOCRVisible, setIsOCRVisible] = useState(false);

  const [copySuccess, setCopySuccess] = useState("Copy");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        setCopySuccess("Copied!");
      },
      () => {
        setCopySuccess("Copy");
      }
    );
  };

  // Event listener for popstate event to update the currentCanvasId when
  // there is changes in the url query parameter
  window.addEventListener("popstate", () => {
    const urlParams = new URLSearchParams(window.location.search);
    setCurrentCanvasId(urlParams.get("canvasId"));
  });

  // Fetch manifest data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${config["api"]["manifest"]}/${collectionId}/${documentId}`
        );
        const data = await response.json();
        setDocumentData(data);
      } catch (error) {
        setDocumentData({});
      }
    };
    fetchData();
  }, [collectionId, documentId]);

  // Fetch page OCR text
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${config["api"]["ocr"]}/${collectionId}/${documentId}?canvasId=${currentCanvasId}`
        );
        const data = await response.json();
        setCurrentPageOCR(data["text"]);
      } catch (error) {
        setCurrentPageOCR("Error while loading OCR text for this page.");
      }
    };
    fetchData();
  }, [collectionId, documentId, currentCanvasId]);

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5 ">
        <h1>
          {documentData
            ? documentData["label"] &&
              Object.keys(documentData["label"]).includes("en")
              ? documentData["label"]["en"][0]
              : documentData["label"]
            : null}
        </h1>

        {/* Share links */}
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
            {window.location.href}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-row">
          {/* General Info and Text OCR section */}
          <div className="w-80">
            {/* Tab */}
            <div className="flex flex-row justify-between w-80">
              <div
                className={`${
                  isDocumentMetadataVisible ? "font-bold" : "text-gray-500"
                }  cursor-pointer`}
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
              </div>
              <div
                className={`${
                  isOCRVisible ? "font-bold" : "text-gray-500"
                } cursor-pointer`}
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
              </div>
            </div>

            {/* Info display */}
            <div className="flex flex-row h-full mirador justify-between border-solid border-2 p-2 rounded-lg">
              <div className="flex flex-col overflow-auto">
                {/* Document metadata */}
                {isDocumentMetadataVisible &&
                  documentData &&
                  documentData["metadata"] &&
                  documentData["metadata"].map((item, index) => (
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

          {/* Document viewer */}
          <div className="w-full relative ml-5">
            <div className="mirador ">
              {/* Mirador */}
              <Mirador
                className=""
                config={{
                  id: "mirador",
                  window: {
                    allowWindowSideBar: true,
                    allowTopMenuButton: true,
                    allowMaximize: false,
                    allowClose: false,
                    allowFullscreen: true,
                    defaultView: "single",
                    views: [
                      { key: "single", behaviors: ["individuals"] },
                      { key: "book", behaviors: ["paged"] },
                      { key: "scroll", behaviors: ["continuous"] },
                      { key: "gallery" },
                    ],
                  },
                  workspaceControlPanel: {
                    enabled: false, // Configure if the control panel should be rendered.  Useful if you want to lock the viewer down to only the configured manifests
                  },
                  windows: [
                    {
                      loadedManifest: `${config["api"]["manifest"]}/${collectionId}/${documentId}`,
                      canvasId: originalCanvasId,
                      thumbnailNavigationPosition: "far-right",
                    },
                  ],
                }}
                plugins={[MiradorURLSyncPlugin]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
