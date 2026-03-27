import Link from "next/link";
import { Clock } from "lucide-react";
import type { Article } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_LABELS_HR } from "@/lib/types";

interface RelatedArticlesProps {
  articles: Article[];
  basePath?: string;
  lang?: "en" | "hr";
}

export default function RelatedArticles({ articles, basePath = "", lang = "en" }: RelatedArticlesProps) {
  const isHr = lang === "hr";
  const heading = isHr ? "// Vezane vijesti" : "// Related";
  const locale = isHr ? "hr-HR" : "en-US";
  const categoryLabels = isHr ? CATEGORY_LABELS_HR : CATEGORY_LABELS;

  return (
    <div className="glass-card p-4 !hover:transform-none">
      <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider font-mono">
        {heading}
      </h3>
      <div className="space-y-3">
        {articles.map((a) => (
          <Link
            key={a.id}
            href={`${basePath}/article/${a.category}/${a.id}`}
            className="block group"
          >
            <div className="flex gap-3 items-start">
              {a.image?.url && (
                <img
                  src={a.image.url}
                  alt={a.image.alt}
                  className="w-14 h-14 object-cover rounded flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                />
              )}
              <div className="min-w-0">
                <span className={`category-badge category-badge-${a.category} text-[9px] mb-1 inline-block`}>
                  {categoryLabels[a.category]}
                </span>
                <p className="text-xs text-text-primary group-hover:text-accent-cyan transition-colors leading-tight line-clamp-2">
                  {isHr ? (a.title || a.titleEn) : (a.titleEn || a.title)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-text-secondary/50">
                  <Clock className="w-2.5 h-2.5" />
                  <time dateTime={a.date}>
                    {new Date(a.date).toLocaleDateString(locale, { month: "short", day: "numeric" })}
                  </time>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
