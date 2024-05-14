import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";

import Mirador from "../components/Mirador";

const DocumentViewer = () => {
  const { collectionId, documentId } = useParams();

  const [documentData, setDocumentData] = useState({});

  useEffect(() => {
    fetch(
      // `https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/${collectionId}/${documentId}/manifest.json`
      `your-manifest-url`
    )
      .then((response) => response.json())
      .then((data) => setDocumentData(data))
      .catch(() =>
        setDocumentData({
          "@context": "http://iiif.io/api/presentation/2/context.json",
          "@id": "http://cf594afc-6574-44bb-820b-ea883e12e0c2",
          "@type": "sc:Manifest",
          label: "Journal of Vietnamese Studies - Pages of History (1956-1954)",
          metadata: [
            {
              label: "Director",
              value: "Nguyen Khac Vien",
            },
            {
              label: "Distributor",
              value: "Xunhabasa, 32 Hai Ba Trung, Hanoi",
            },
            {
              label: "Editorial Office",
              value: "46 Tran Hung Dao, Hanoi",
            },
            {
              label: "Volume",
              value: 7,
            },
            {
              label: "Publication Year",
              value: 1965,
            },
            {
              label: "Number of Pages",
              value: 262,
            },
          ],
          description: [
            {
              "@value": "This is the description",
              "@language": "en",
            },
          ],
          license: "https://creativecommons.org/licenses/by/3.0/",
          attribution: "This is the attribution",
          sequences: [
            {
              "@id": "http://3cab405d-8c02-4e4b-a803-177974be4b29",
              "@type": "sc:Sequence",
              label: [
                {
                  "@value": "Normal Sequence",
                  "@language": "en",
                },
              ],
              canvases: [
                {
                  "@id": "http://83974eac-c045-4e1c-af20-f074e10da901",
                  "@type": "sc:Canvas",
                  label: "1",
                  height: 1137,
                  width: 726,
                  images: [
                    {
                      "@context":
                        "http://iiif.io/api/presentation/2/context.json",
                      "@id": "http://4f7de1d0-da71-4031-aad1-45de7f321132",
                      "@type": "oa:Annotation",
                      motivation: "sc:painting",
                      resource: {
                        "@id":
                          "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0001.jpg/full/full/0/default.jpg",
                        "@type": "dctypes:Image",
                        format: "image/jpeg",
                        service: {
                          "@context": "http://iiif.io/api/image/3/context.json",
                          "@id":
                            "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0001.jpg",
                          profile: "level2",
                        },
                        height: 1137,
                        width: 726,
                      },
                      on: "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0001.jpg/full/full/0/default.jpg",
                    },
                  ],
                  related: "",
                },
                {
                  "@id": "http://75d444b3-7429-467e-b25d-8707a040e021",
                  "@type": "sc:Canvas",
                  label: "2",
                  height: 1137,
                  width: 726,
                  images: [
                    {
                      "@context":
                        "http://iiif.io/api/presentation/2/context.json",
                      "@id": "http://8ce8b06f-9d50-4b7e-9ed0-38e95f11b531",
                      "@type": "oa:Annotation",
                      motivation: "sc:painting",
                      resource: {
                        "@id":
                          "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0002.jpg/full/full/0/default.jpg",
                        "@type": "dctypes:Image",
                        format: "image/jpeg",
                        service: {
                          "@context": "http://iiif.io/api/image/3/context.json",
                          "@id":
                            "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0002.jpg",
                          profile: "level2",
                        },
                        height: 1137,
                        width: 726,
                      },
                      on: "http://75d444b3-7429-467e-b25d-8707a040e021",
                    },
                  ],
                  related: "",
                },
                {
                  "@id": "http://da7042cf-141a-4b39-ac4e-94b45385b1ee",
                  "@type": "sc:Canvas",
                  label: "3",
                  height: 1137,
                  width: 726,
                  images: [
                    {
                      "@context":
                        "http://iiif.io/api/presentation/2/context.json",
                      "@id": "http://56a36593-0911-40f1-b33a-e8b8e9be2f08",
                      "@type": "oa:Annotation",
                      motivation: "sc:painting",
                      resource: {
                        "@id":
                          "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0003.jpg/full/full/0/default.jpg",
                        "@type": "dctypes:Image",
                        format: "image/jpeg",
                        service: {
                          "@context": "http://iiif.io/api/image/3/context.json",
                          "@id":
                            "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0003.jpg",
                          profile: "level2",
                        },
                        height: 1137,
                        width: 726,
                      },
                      on: "http://da7042cf-141a-4b39-ac4e-94b45385b1ee",
                    },
                  ],
                  related: "",
                },
                {
                  "@id": "http://ec84dd4b-d17a-4f1c-a25c-36b94ddf1787",
                  "@type": "sc:Canvas",
                  label: "4",
                  height: 1137,
                  width: 726,
                  images: [
                    {
                      "@context":
                        "http://iiif.io/api/presentation/2/context.json",
                      "@id": "http://9a67a0fe-2efa-4a3b-8826-3f650fef0b79",
                      "@type": "oa:Annotation",
                      motivation: "sc:painting",
                      resource: {
                        "@id":
                          "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0004.jpg/full/full/0/default.jpg",
                        "@type": "dctypes:Image",
                        format: "image/jpeg",
                        service: {
                          "@context": "http://iiif.io/api/image/3/context.json",
                          "@id":
                            "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0004.jpg",
                          profile: "level2",
                        },
                        height: 1137,
                        width: 726,
                      },
                      on: "http://ec84dd4b-d17a-4f1c-a25c-36b94ddf1787",
                    },
                  ],
                  related: "",
                },
                {
                  "@id": "http://d8a8bc00-fe9a-4630-9768-647a7e3c7dcd",
                  "@type": "sc:Canvas",
                  label: "5",
                  height: 1137,
                  width: 726,
                  images: [
                    {
                      "@context":
                        "http://iiif.io/api/presentation/2/context.json",
                      "@id": "http://ea8808f6-78fd-4a67-9e7c-c86ecc32670d",
                      "@type": "oa:Annotation",
                      motivation: "sc:painting",
                      resource: {
                        "@id":
                          "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0005.jpg/full/full/0/default.jpg",
                        "@type": "dctypes:Image",
                        format: "image/jpeg",
                        service: {
                          "@context": "http://iiif.io/api/image/3/context.json",
                          "@id":
                            "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0005.jpg",
                          profile: "level2",
                        },
                        height: 1137,
                        width: 726,
                      },
                      on: "http://d8a8bc00-fe9a-4630-9768-647a7e3c7dcd",
                    },
                  ],
                  related: "",
                },
                {
                  "@id": "http://f2cf45b6-042a-4b08-a6de-2f49891df0d5",
                  "@type": "sc:Canvas",
                  label: "6",
                  height: 1137,
                  width: 726,
                  images: [
                    {
                      "@context":
                        "http://iiif.io/api/presentation/2/context.json",
                      "@id": "http://fb5da03a-c39e-4e5c-90f7-ee223b72bbaa",
                      "@type": "oa:Annotation",
                      motivation: "sc:painting",
                      resource: {
                        "@id":
                          "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0006.jpg/full/full/0/default.jpg",
                        "@type": "dctypes:Image",
                        format: "image/jpeg",
                        service: {
                          "@context": "http://iiif.io/api/image/3/context.json",
                          "@id":
                            "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0006.jpg",
                          profile: "level2",
                        },
                        height: 1137,
                        width: 726,
                      },
                      on: "http://f2cf45b6-042a-4b08-a6de-2f49891df0d5",
                    },
                  ],
                  related: "",
                },
                {
                  "@id": "http://56443a97-212d-4eab-88b2-653a37a9e9e3",
                  "@type": "sc:Canvas",
                  label: "7",
                  height: 1137,
                  width: 726,
                  images: [
                    {
                      "@context":
                        "http://iiif.io/api/presentation/2/context.json",
                      "@id": "http://0739ef56-a0d7-4a6a-a6df-873e0e3d654c",
                      "@type": "oa:Annotation",
                      motivation: "sc:painting",
                      resource: {
                        "@id":
                          "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0007.jpg/full/full/0/default.jpg",
                        "@type": "dctypes:Image",
                        format: "image/jpeg",
                        service: {
                          "@context": "http://iiif.io/api/image/3/context.json",
                          "@id":
                            "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0007.jpg",
                          profile: "level2",
                        },
                        height: 1137,
                        width: 726,
                      },
                      on: "http://56443a97-212d-4eab-88b2-653a37a9e9e3",
                    },
                  ],
                  related: "",
                },
                {
                  "@id": "http://72c9db1c-83d7-4de2-b4de-9144f0bb877f",
                  "@type": "sc:Canvas",
                  label: "8",
                  height: 1137,
                  width: 726,
                  images: [
                    {
                      "@context":
                        "http://iiif.io/api/presentation/2/context.json",
                      "@id": "http://97f8d7ff-fa79-424e-a2c3-d94f92cb7a89",
                      "@type": "oa:Annotation",
                      motivation: "sc:painting",
                      resource: {
                        "@id":
                          "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0008.jpg/full/full/0/default.jpg",
                        "@type": "dctypes:Image",
                        format: "image/jpeg",
                        service: {
                          "@context": "http://iiif.io/api/image/3/context.json",
                          "@id":
                            "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0008.jpg",
                          profile: "level2",
                        },
                        height: 1137,
                        width: 726,
                      },
                      on: "http://72c9db1c-83d7-4de2-b4de-9144f0bb877f",
                    },
                  ],
                  related: "",
                },
                {
                  "@id": "http://a2c385c9-9b02-4bb8-89db-023e10072010",
                  "@type": "sc:Canvas",
                  label: "9",
                  height: 1137,
                  width: 726,
                  images: [
                    {
                      "@context":
                        "http://iiif.io/api/presentation/2/context.json",
                      "@id": "http://ebec5630-d67d-4f25-9ad1-e167b3b656bc",
                      "@type": "oa:Annotation",
                      motivation: "sc:painting",
                      resource: {
                        "@id":
                          "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0009.jpg/full/full/0/default.jpg",
                        "@type": "dctypes:Image",
                        format: "image/jpeg",
                        service: {
                          "@context": "http://iiif.io/api/image/3/context.json",
                          "@id":
                            "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0009.jpg",
                          profile: "level2",
                        },
                        height: 1137,
                        width: 726,
                      },
                      on: "http://a2c385c9-9b02-4bb8-89db-023e10072010",
                    },
                  ],
                  related: "",
                },
                {
                  "@id": "http://4b3a0c92-412e-4ed3-b9c7-fd435a1ebaa8",
                  "@type": "sc:Canvas",
                  label: "10",
                  height: 1137,
                  width: 726,
                  images: [
                    {
                      "@context":
                        "http://iiif.io/api/presentation/2/context.json",
                      "@id": "http://19e75dd7-d630-429c-849e-c52a991b8695",
                      "@type": "oa:Annotation",
                      motivation: "sc:painting",
                      resource: {
                        "@id":
                          "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0010.jpg/full/full/0/default.jpg",
                        "@type": "dctypes:Image",
                        format: "image/jpeg",
                        service: {
                          "@context": "http://iiif.io/api/image/3/context.json",
                          "@id":
                            "https://6end2otvnea7nwltme4gscuhou0fusai.lambda-url.ap-southeast-1.on.aws/iiif/2/Vietnam%20Studies%20Journal%2F7%20-%20Pages%20of%20History%2Fimage_0010.jpg",
                          profile: "level2",
                        },
                        height: 1137,
                        width: 726,
                      },
                      on: "http://4b3a0c92-412e-4ed3-b9c7-fd435a1ebaa8",
                    },
                  ],
                  related: "",
                },
              ],
            },
          ],
          structures: [],
          thumbnail: {
            "@id": "http://83974eac-c045-4e1c-af20-f074e10da901",
          },
        })
      );
  }, [documentId]);

  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5 ">
        <h1>{documentData["label"]}</h1>

        {/* Content */}
        <div className="flex flex-row relative">
          {/* General Info and Text OCR section */}
          <div className="w-64">
            {/* Tab */}
            <div className="flex flex-row justify-between">
              <div className="font-bold">General Information</div>
              <div className="text-gray-500">Text OCR</div>
            </div>

            {/* Info display */}
            <div className="flex flex-row justify-between border-solid border-2 p-2 rounded-lg">
              <div className="flex flex-col">
                {documentData["metadata"] &&
                  documentData["metadata"].map((item, index) => (
                    <div key={index}>
                      <div className="font-bold">{item["label"]}: </div>
                      <div>{item["value"]}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Document viewer */}
          <div className="">
            {/* Mirador */}
            <Mirador
              className=""
              config={{
                id: "mirador",
                windows: [
                  {
                    loadedManifest:
                      "https://digitizing-vietnam.s3.ap-southeast-1.amazonaws.com/Vietnam+Studies+Journal/7+-+Pages+of+History/manifest.json",
                    canvasIndex: 1,
                    thumbnailNavigationPosition: "far-bottom",
                  },
                ],
              }}
              plugins={[]}
            />
            {/*  */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
