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
  ai: "#a855f7",       // purple
  gaming: "#ff006e",   // hot pink
  space: "#00cfff",    // cyan
  technology: "#f97316", // orange
  medicine: "#22c55e", // green
  society: "#ffd60a",  // yellow
  robotics: "#60a5fa", // blue
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
  source: ArticleSource;
  image: ArticleImage;
  subtitle?: string;
  subtitleEn?: string;
  subtitleImage?: ArticleImage;
  tags: string[];
  geo: GeoLocation;
  featured: boolean;
  approved: boolean;
  videoUrl?: string;
  content: string;
  part1En?: string; // English content part 1
  part2En?: string; // English content part 2
  lang?: string;
}
