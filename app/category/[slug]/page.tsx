import { notFound } from "next/navigation";
import { getArticlesByCategory } from "@/lib/content";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  type Category,
} from "@/lib/types";
import ArticleGrid from "@/components/ArticleGrid";
import CategoryBanner from "@/components/CategoryBanner";
import CategoryLoadingTerminal from "@/components/CategoryLoadingTerminal";
import GamingWidget from "@/components/GamingWidget";
import HistoryBackButton from "@/components/HistoryBackButton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ slug: cat }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!CATEGORIES.includes(slug as Category)) {
    return { title: "Category Not Found" };
  }
  const label = CATEGORY_LABELS[slug as Category];
  return {
    title: `${label} News`,
    description: `Latest ${label} news and articles from TECH & SPACE.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  if (!CATEGORIES.includes(slug as Category)) {
    notFound();
  }

  const category = slug as Category;
  const articles = getArticlesByCategory(category);
  const label = CATEGORY_LABELS[category];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <HistoryBackButton fallbackHref="/" label="Back" className="mb-6" />

      <CategoryBanner category={category} />
      <CategoryLoadingTerminal category={category} />

      <div className="mb-8">
        <span
          className={`category-badge category-badge-${category} mb-2 inline-block`}
        >
          {label}
        </span>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary">
          {label} News
        </h1>
        <p className="text-text-secondary mt-2">
          {articles.length} article{articles.length !== 1 ? "s" : ""}
        </p>
      </div>

      {category === "gaming" && (
        <div className="mb-8">
          <GamingWidget />
        </div>
      )}

      <ArticleGrid articles={articles} />
    </div>
  );
}
