const REACT_APP_BACKEND_URI =
  "https://digitizing-vietnam-85e1a0248f95.herokuapp.com/dv";

const config = {
  api: {
    manifest: `${REACT_APP_BACKEND_URI}/manifest`,
    ocr: `${REACT_APP_BACKEND_URI}/ocr`,
    collections: `${REACT_APP_BACKEND_URI}/collections`,
    blogs: `${REACT_APP_BACKEND_URI}/blogs`,
    onlineResources: `${REACT_APP_BACKEND_URI}/online-resources`,
  },
};

export default config;
