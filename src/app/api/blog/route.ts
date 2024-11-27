import { NextResponse } from "next/server";

import { fetcher } from "@/lib/api";
import { Blog, BlogCategory } from "@/types/blog";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams(searchParams);
  const queryString = params.toString();
  const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/blog-categories?${queryString}`;

  const data = await fetcher(url);
  const allCategories = data.data;
  const blogCategories: BlogCategory[] = [];

  allCategories.forEach((category) => {
    blogCategories.push({
      category_name: category.name,
      description: category.description,
      blogs: category.blogs.map((post) => {
        return {
          title: post.name,
          author: post.blog_authors[0].name,
          date: post.publishedAt,
          slug: post.slug,
          thumbnail:
            post.thumbnail[0].formats.medium ||
            post.thumbnail[0].formats.thumbnail,
        } as Blog;
      }),
    });
  });

  return NextResponse.json({ data: blogCategories }, { status: 200 });
}
