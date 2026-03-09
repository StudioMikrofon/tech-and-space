import type { MetadataRoute } from "next";
import { getAllArticles, getAllArticlesHr } from "@/lib/content";
import { CATEGORIES } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://techand.space";

export default function sitemap(): MetadataRoute.Sitemap {
  try {
    const articles = getAllArticles().filter((a) => {
      try {
        const d = new Date(a.date);
        return !isNaN(d.getTime());
      } catch {
        return false;
      }
    });

    const articlesHr = getAllArticlesHr().filter((a) => {
      try {
        const d = new Date(a.date);
        return !isNaN(d.getTime());
      } catch {
        return false;
      }
    });

    const now = new Date();
    const staticPages: MetadataRoute.Sitemap = [
      { url: SITE_URL, lastModified: now, priority: 1.0, changeFrequency: "daily" },
      { url: `${SITE_URL}/hr`, lastModified: now, priority: 0.9, changeFrequency: "daily" },
      ...CATEGORIES.map((cat) => ({
        url: `${SITE_URL}/category/${cat}`,
        lastModified: now,
        priority: 0.8,
        changeFrequency: "daily" as const,
      })),
      ...CATEGORIES.map((cat) => ({
        url: `${SITE_URL}/hr/category/${cat}`,
        lastModified: now,
        priority: 0.7,
        changeFrequency: "daily" as const,
      })),
    ];

    const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
      url: `${SITE_URL}/article/${a.category}/${a.id}`,
      lastModified: new Date(a.date),
      priority: 0.7,
      changeFrequency: "weekly" as const,
    }));

    const hrArticlePages: MetadataRoute.Sitemap = articlesHr.map((a) => ({
      url: `${SITE_URL}/hr/article/${a.category}/${a.id}`,
      lastModified: new Date(a.date),
      priority: 0.6,
      changeFrequency: "weekly" as const,
    }));

    return [...staticPages, ...articlePages, ...hrArticlePages];
  } catch (e) {
    console.error("Sitemap error:", e);
    return [{ url: SITE_URL, priority: 1.0, changeFrequency: "daily" }];
  }
}
