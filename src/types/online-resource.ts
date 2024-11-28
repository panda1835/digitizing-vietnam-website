export interface OnlineResource {
  title: string;
  description: string;
  url: string;
}

export interface ResourceCategory {
  category_name: string;
  description: string;
  image_url: string;
  resources: OnlineResource[];
}
