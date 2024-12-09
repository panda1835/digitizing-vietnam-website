interface ImageFormat {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: string | null;
  size: number; // Size in KB
  width: number;
  height: number;
  sizeInBytes: number; // Size in bytes
  provider_metadata: {
    public_id: string;
    resource_type: string;
  };
}

interface Formats {
  [key: string]: ImageFormat;
}
