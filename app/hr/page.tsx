import { getAllArticlesHr } from "@/lib/content";
import HeroSection from "@/components/HeroSection";
import ArticleGrid from "@/components/ArticleGrid";
import SpaceBar from "@/components/SpaceBar";
import SolarSystem from "@/components/SolarSystem";
import GamingWidget from "@/components/GamingWidget";

export const dynamic = "force-dynamic";

export default function HomePageHr() {
  const articles = getAllArticlesHr();
  const featured = articles[0] ?? null;

  if (!featured) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <img src="/logo.jpg" alt="TECH & SPACE" className="w-20 h-20 mx-auto mb-6 rounded-xl" />
        <h1 className="font-heading text-4xl font-bold mb-4">TECH & SPACE</h1>
        <p className="text-text-secondary text-lg font-mono">
          // Nema članaka u bazi. Čekamo prvu transmisiju...
        </p>
      </div>
    );
  }

  const gridArticles = articles.filter((a) => a.id !== featured.id);
  const latestPerCategory = articles.reduce<typeof articles>((acc, a) => {
    if (!acc.find((x) => x.category === a.category)) acc.push(a);
    return acc;
  }, []);

  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const headlines24h = articles.filter(a => new Date(a.date) > cutoff24h);
  const headlines = headlines24h.length >= 3 ? headlines24h.slice(0, 12) : articles.slice(0, 8);

  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const recent48h = articles.filter(a => new Date(a.date) > cutoff48h);
  const latestPerCategoryMultiple = (recent48h.length >= 4 ? recent48h : articles)
    .reduce<Record<string, typeof articles>>((acc, a) => {
      if (!acc[a.category]) acc[a.category] = [];
      if (acc[a.category].length < 4) acc[a.category].push(a);
      return acc;
    }, {});

  return (
    <>
      <div className="fixed inset-0 pointer-events-none opacity-[0.15] z-0">
        <SolarSystem interactive />
      </div>
      <HeroSection featured={featured} headlines={headlines} latestPerCategory={latestPerCategory} latestPerCategoryMultiple={latestPerCategoryMultiple} />
      <SpaceBar />
      <section className="w-full max-w-7xl mx-auto px-0 sm:px-4 pb-6">
        <GamingWidget lang="hr" />
      </section>
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <h2 className="section-header font-heading text-2xl font-bold text-text-primary mb-6">
          Najnovije vijesti
        </h2>
        <ArticleGrid articles={gridArticles} basePath="/hr" />
      </section>
    </>
  );
}
