const uri = "http://127.0.0.1:8000/dv";

const config = {
  api: {
    manifest:
      "https://gist.githubusercontent.com/panda1835/e2d8027227a0b81bdb0e692a75380d87/raw/46fdb09f7cf94a4888202cd50eb543cd77a531ba/manifest.json",
    ocr: `${uri}/ocr`,
    collection_by_id: `${uri}/collections`,
    collections: `${uri}/collections`,
    blogs: `${uri}/blogs`,
  },
};

export default config;
