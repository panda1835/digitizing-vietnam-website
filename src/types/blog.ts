export interface Blog {
  title: string;
  author: string;
  date: string;
  slug: string;
  thumbnail: string;
  content: string;
}

export interface BlogCategory {
  category_name: string;
  description: string;
  blogs: Blog[];
}
