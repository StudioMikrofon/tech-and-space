import { NextRequest, NextResponse } from "next/server";
import { getAllArticles } from "@/lib/content";

export const dynamic = "force-dynamic";

const GAME_KEYWORDS: Record<string, string[]> = {
  gta6: ["GTA", "GTA VI", "GTA 6", "Rockstar", "Grand Theft Auto"],
  witcher4: ["Witcher 4", "Witcher", "CD Projekt", "Ciri", "Polaris"],
  elderscrolls6: ["Elder Scrolls", "Bethesda", "TES6", "Hammerfell"],
  silksong: ["Silksong", "Hollow Knight", "Team Cherry", "Hornet", "Hornette"],
  fable2024: ["Fable", "Playground Games"],
  marathon: ["Marathon", "Bungie", "extraction shooter"],
  unrecord: ["UNRECORD", "bodycam", "DRAMA studio"],
  starcitizen: ["Star Citizen", "Cloud Imperium", "Squadron 42"],
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const keywords = GAME_KEYWORDS[gameId] ?? [gameId];
  const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());
  const articles = getAllArticles();

  const gamingMatches = articles.filter((article) => {
    if (article.category !== "gaming") return false;
    const title = (article.titleEn || article.title || "").toLowerCase();
    return normalizedKeywords.some((keyword) => title.includes(keyword));
  });

  const supplementalAiMatches = gamingMatches.length >= 5
    ? []
    : articles.filter((article) => {
        if (article.category !== "ai") return false;
        const title = (article.titleEn || article.title || "").toLowerCase();
        return normalizedKeywords.some((keyword) => title.includes(keyword));
      });

  const matches = [...gamingMatches, ...supplementalAiMatches]
    .slice(0, 5)
    .map((article) => ({
      id: article.id,
      category: article.category,
      title: article.titleEn || article.title,
      date: article.date,
      lead: article.leadSentenceEn || article.excerptEn || article.excerpt,
      leadSentenceEn: article.leadSentenceEn || article.excerptEn || article.excerpt,
      excerpt: article.excerptEn || article.excerpt,
    }));

  return NextResponse.json(matches);
}
