import CategorySwimlane from "@/components/CategorySwimlane";
import GameWatchlist from "@/components/GameWatchlist";
import { getArticlesByCategory } from "@/lib/content";
import GamingDashboard from "./GamingDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gaming Intel — Live Gaming Analytics",
  description: "Real-time gaming intelligence: hype index, release radar, player spikes, indie spotlight.",
};

export const dynamic = "force-dynamic";

export default function GamingPage() {
  const gamingArticles = getArticlesByCategory("gaming");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10 overflow-x-hidden">
      <section className="space-y-6">
        <div>
          <span className="category-badge category-badge-gaming mb-3 inline-block">
            Gaming
          </span>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary">
            Gaming Hub
          </h1>
          <p className="text-text-secondary mt-2 max-w-3xl">
            Follow the biggest upcoming releases, then dive straight into the latest gaming coverage.
          </p>
        </div>

        <div className="grid gap-8 min-w-0 xl:grid-cols-[minmax(0,360px),minmax(0,1fr)] xl:items-start">
          <div className="glass-card !p-4 min-w-0">
            <GameWatchlist />
          </div>
          <div className="min-w-0">
            <CategorySwimlane category="gaming" articles={gamingArticles} />
          </div>
        </div>
      </section>

      <GamingDashboard />
    </div>
  );
}
