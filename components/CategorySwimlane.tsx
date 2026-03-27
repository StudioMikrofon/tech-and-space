"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import ArticleCard from "./ArticleCard";
import type { Article } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_LABELS_HR, CATEGORY_COLORS } from "@/lib/types";

interface CategorySwimlaneProps {
  category: string;
  articles: Article[];
  onGeoClick?: (article: Article) => void;
  basePath?: string;
  lang?: "en" | "hr";
}

export default function CategorySwimlane({
  category,
  articles,
  onGeoClick,
  basePath = "",
  lang = "en",
}: CategorySwimlaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  };

  const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ?? "#06b6d4";
  const labels = lang === "hr" ? CATEGORY_LABELS_HR : CATEGORY_LABELS;
  const label = labels[category as keyof typeof labels] ?? category.toUpperCase();

  return (
    <div className="mb-10 min-w-0">
      {/* Row header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          />
          <Link
            href={`${basePath}/category/${category}`}
            className="font-heading font-bold text-lg text-text-primary hover:text-accent-cyan transition-colors"
          >
            {label}
          </Link>
          <span className="text-xs font-mono text-text-secondary/50 ml-1">
            {articles.length} {lang === "hr" ? "članaka" : "articles"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-1 rounded border border-white/10 text-text-secondary/50 hover:text-text-secondary hover:border-white/20 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1 rounded border border-white/10 text-text-secondary/50 hover:text-text-secondary hover:border-white/20 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <Link
            href={`${basePath}/category/${category}`}
            className="text-xs font-mono text-accent-cyan/70 hover:text-accent-cyan transition-colors ml-1"
          >
            {lang === "hr" ? "Pogledaj sve →" : "View all →"}
          </Link>
        </div>
      </div>

      {/* Horizontal scroll track */}
      <div className="relative min-w-0">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto overscroll-x-contain pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {articles.map((article, i) => (
            <div
              key={article.id}
              className="flex-shrink-0 w-[260px] sm:w-[300px]"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <ArticleCard article={article} onGeoClick={onGeoClick} basePath={basePath} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
