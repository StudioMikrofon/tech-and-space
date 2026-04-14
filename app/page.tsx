import {
  getAllArticles,
  getFeaturedArticle,
  getLatestPerCategory,
} from "@/lib/content";
import { CATEGORIES } from "@/lib/types";
import dynamicImport from "next/dynamic";
import HeroSection from "@/components/HeroSection";
import SpaceBar from "@/components/SpaceBar";
import GamingWidget from "@/components/GamingWidget";
import CategorySwimlane from "@/components/CategorySwimlane";
import WeatherPulseWidget from "@/components/WeatherPulseWidget";
import MostLiked from "@/components/MostLiked";
import CountdownToAGI from "@/components/CountdownToAGI";

const SolarSystem = dynamicImport(() => import("@/components/SolarSystem"), { loading: () => null });

export const dynamic = "force-dynamic";

export default function HomePage() {
  const articles = getAllArticles();
  const featured = getFeaturedArticle();
  const latestPerCategory = getLatestPerCategory();

  // Headlines: last 24h, fallback to latest 8 if none
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const headlines24h = articles.filter(a => new Date(a.date) > cutoff24h);
  const headlines = headlines24h.length >= 3 ? headlines24h.slice(0, 12) : articles.slice(0, 8);

  // Per-category: last 48h per category, up to 4 per cat (for hero carousel)
  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const recent48h = articles.filter(a => new Date(a.date) > cutoff48h);
  const latestPerCategoryMultiple = (recent48h.length >= 4 ? recent48h : articles)
    .reduce<Record<string, typeof articles>>((acc, a) => {
      if (!acc[a.category]) acc[a.category] = [];
      if (acc[a.category].length < 4) acc[a.category].push(a);
      return acc;
    }, {});

  if (!featured) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <img src="/logo.jpg" alt="TECH & SPACE" className="w-20 h-20 mx-auto mb-6 rounded-xl" />
        <h1 className="font-heading text-4xl font-bold mb-4">TECH & SPACE</h1>
        <p className="text-text-secondary text-lg font-mono">
          // No articles in database. Awaiting first transmission...
        </p>
      </div>
    );
  }

  // Build swimlane data: articles per category, sorted by date, skip featured
  const nonFeatured = articles.length > 1 ? articles.filter(a => a.id !== featured.id) : articles;
  const swimlaneData = CATEGORIES.map(cat => ({
    category: cat,
    articles: nonFeatured.filter(a => a.category === cat),
  })).filter(s => s.articles.length > 0);

  // Sort swimlanes: categories with most recent articles first
  swimlaneData.sort((a, b) => {
    const latestA = new Date(a.articles[0]?.date ?? 0).getTime();
    const latestB = new Date(b.articles[0]?.date ?? 0).getTime();
    return latestB - latestA;
  });

  return (
    <>
      {/* Subtle solar system ambient background behind starfield */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.15] z-0">
        <SolarSystem interactive />
      </div>
      <HeroSection featured={featured} headlines={headlines} latestPerCategory={latestPerCategory} latestPerCategoryMultiple={latestPerCategoryMultiple} lang="en" />
      <SpaceBar />

      {/* Gaming Hub widget */}
      <section className="w-full max-w-7xl mx-auto px-0 sm:px-4 pb-6">
        <GamingWidget />
      </section>

      {/* Weather bar — compact, between gaming and news */}
      <WeatherPulseWidget />

      {/* AGI Countdown — below weather, above most liked */}
      <div className="w-full max-w-7xl mx-auto px-0 sm:px-4 mb-4">
        <CountdownToAGI />
      </div>

      {/* Most Liked — reader picks, before Latest News */}
      <MostLiked />

      {/* Latest News — by category swimlanes */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <h2 className="section-header font-heading text-2xl font-bold text-text-primary mb-8">
          Latest News
        </h2>
        {swimlaneData.map(({ category, articles: catArticles }) => (
          <CategorySwimlane
            key={category}
            category={category}
            articles={catArticles}
          />
        ))}
      </section>
    </>
  );
}
