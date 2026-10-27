export interface Collection {
  slug: string;
  title: string;
  subjects: string[];
  datePublished: string;
  dateCreated: string;
  thumbnail: {
    alternativeText: string;
    caption: string;
    formats: ImageFormat;
  };
  abstract: string;
  languages: string[];
  formats: string[];
  collectionLocation: string;
  accessCondition: string;
  collectionItems: CollectionItem[];
  collection_categories: {
    name: string;
    display_order: string;
    description?: string;
  }[];
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
