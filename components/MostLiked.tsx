import Link from "next/link";
import { ThumbsUp, TrendingUp } from "lucide-react";
import Database from "better-sqlite3";
import { getAllArticles } from "@/lib/content";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/types";

const DB_PATH = "/opt/openclaw/futurepulse/db/futurepulse.db";

interface LikedRow {
  id: number;
  likes: number;
}

function getTopLiked(limit = 6): LikedRow[] {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const rows = db.prepare(
      "SELECT id, likes FROM articles WHERE github_uploaded=1 AND likes > 0 ORDER BY likes DESC, published_at DESC LIMIT ?"
    ).all(limit) as LikedRow[];
    db.close();
    return rows;
  } catch {
    return [];
  }
}

export default function MostLiked() {
  const topLiked = getTopLiked(6);
  if (topLiked.length === 0) return null;

  // Cross-reference with content to get full article info (id/slug, title, category)
  const articles = getAllArticles();
  const dbIdMap = new Map(articles.map(a => [a.dbId, a]));

  const likedArticles = topLiked
    .map(row => ({ likes: row.likes, article: dbIdMap.get(row.id) }))
    .filter((x): x is { likes: number; article: NonNullable<typeof x.article> } => !!x.article);

  if (likedArticles.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 mb-12">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-5 h-5 text-accent-amber" />
        <h2 className="font-heading text-xl font-bold text-text-primary">Most Liked</h2>
        <span className="text-xs font-mono text-text-secondary/40 ml-1">// reader picks</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {likedArticles.map(({ likes, article }) => {
          const color = CATEGORY_COLORS[article.category];
          const label = CATEGORY_LABELS[article.category];
          return (
            <Link
              key={article.id}
              href={`/article/${article.category}/${article.id}`}
              className="glass-card p-4 flex gap-3 items-start hover:border-accent-amber/30 transition-colors group !hover:transform-none"
            >
              <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
                <ThumbsUp className="w-4 h-4 text-accent-amber/70" />
                <span className="text-xs font-mono font-bold text-accent-amber/80">{likes}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary/50">{label}</span>
                </div>
                <p className="text-sm font-semibold text-text-primary leading-snug line-clamp-2 group-hover:text-accent-cyan transition-colors">
                  {article.titleEn || article.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
