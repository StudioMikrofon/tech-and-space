export const CATEGORIES = [
  "ai",
  "gaming",
  "space",
  "technology",
  "medicine",
  "society",
  "robotics",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  ai: "AI",
  gaming: "Gaming",
  space: "Space",
  technology: "Technology",
  medicine: "Medicine",
  society: "Society",
  robotics: "Robotics",
};

export const CATEGORY_LABELS_HR: Record<Category, string> = {
  ai: "Umjetna inteligencija",
  gaming: "Gaming",
  space: "Svemir",
  technology: "Tehnologija",
  medicine: "Medicina",
  society: "Društvo",
  robotics: "Robotika",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  ai: "#6b46c1",       // soft purple
  gaming: "#eab308",   // soft yellow
  space: "#8b5cf6",    // soft violet
  technology: "#06b6d4", // soft cyan
  medicine: "#ec4899", // soft pink
  society: "#f97316",  // soft orange
  robotics: "#10b981", // soft emerald
};

export interface GeoLocation {
  name: string;
  lat: number;
  lon: number;
  countryCode: string;
}

export interface ArticleSource {
  name: string;
  url: string;
}

export interface ArticleImage {
  url: string;
  alt: string;
  credit?: string;
  creditUrl?: string;
}

export interface Article {
  id: string;
  dbId?: number;
  title: string;
  titleEn?: string;
  category: Category;
  date: string;
  scrapeDateDate?: string; // Original scrape date, separate from edit date
  excerpt: string;
  excerptEn?: string;
  execSummary?: string; // 2-3 sentence summary from writer (legacy)
  summaryBlock?: string; // 3-4 sentence summary block (HR) - PREMIUM SPEC
  summaryBlockEn?: string; // 3-4 sentence summary block (EN) - PREMIUM SPEC
  keyPoints?: string[]; // 3 short HR bullet highlights
  keyPointsEn?: string[]; // 3 short EN bullet highlights
  source: ArticleSource;
  image: ArticleImage;
  subtitle?: string;
  subtitleEn?: string;
  subtitleImage?: ArticleImage;
  tags: string[];
  geo: GeoLocation;
  featured: boolean;
  approved: boolean;
  likes?: number;
  leadSentenceEn?: string;
  videoUrl?: string;
  content: string;
  part1En?: string; // English content part 1
  part2En?: string; // English content part 2
  lang?: string;
}
