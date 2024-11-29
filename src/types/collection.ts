export interface Collection {
  slug: string;
  title: string;
  subject: string[];
  datePublished: string;
  dateCreated: string;
  thumbnail: {
    alternativeText: string;
    caption: string;
    formats: ImageFormat;
  };
  abstract: string;
  language: string[];
  format: string[];
  collectionLocation: string;
  accessCondition: string;
  collectionItems: CollectionItem[];
}

export interface CollectionItem {
  slug: string;
  title: string;
  contributor: string[];
  dateCreated: string;
  abstract: string;
  subject: string[];
  language: string[];
  format: string;
  placeOfPublication: string;
  publisher: string;
  resourceType: string;
  edition: string;
  fileSize: string;
  identifier: string;
  url: string;
  accessCondition: string;
  relatedWorks: string[];
  thumbnail: string;
  notes: string;
}
