import { useParams, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";

import Mirador from "../components/Mirador";
import MiradorURLSyncPlugin from "../mirador-plugins/MiradorURLSyncPlugin";

import config from "../config";

const DocumentViewer = () => {
  const { documentId } = useParams();
  const location = useLocation();
  const originalCanvasId = new URLSearchParams(location.search).get("canvasId");

  const [documentData, setDocumentData] = useState({});
  const [currentCanvasId, setCurrentCanvasId] = useState("");
  const [currentPageOCR, setCurrentPageOCR] = useState("");

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
        const response = await fetch(config["api"]["manifest"]);
        // `https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/${collectionId}/${documentId}/manifest.json`
        const data = await response.json();
        setDocumentData(data);
      } catch (error) {
        setDocumentData({});
      }
    };
    fetchData();
  }, [documentId]);

  // Fetch page OCR text
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          config["api"]["ocr"].format(documentId, currentCanvasId)
        );
        const data = await response.json();
        setCurrentPageOCR(data);
      } catch (error) {
        setCurrentPageOCR(currentCanvasId.toLowerCase());
      }
    };
    fetchData();
  }, [documentId, currentCanvasId]);

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5 ">
        <h1>{documentData["label"]}</h1>

        {/* Content */}
        <div className="flex flex-row">
          {/* General Info and Text OCR section */}
          <div className="w-96">
            {/* Tab */}
            <div className="flex flex-row justify-between">
              <div className="font-bold">General Information</div>
              <div className="text-gray-500">Text OCR</div>
            </div>

            {/* Info display */}
            <div className="flex flex-row h-full mirador justify-between border-solid border-2 p-2 rounded-lg">
              <div className="flex flex-col">
                {documentData["metadata"] &&
                  documentData["metadata"].map((item, index) => (
                    <div key={index}>
                      <div className="font-bold">{item["label"]}: </div>
                      <div>{item["value"]}</div>
                    </div>
                  ))}
                <p>{currentPageOCR}</p>
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
                      loadedManifest: config["api"]["manifest"],
                      canvasId: originalCanvasId,
                      thumbnailNavigationPosition: "far-right",
                    },
                  ],
                }}
                plugins={[MiradorURLSyncPlugin]}
              />
            </div>
            {/*  */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
