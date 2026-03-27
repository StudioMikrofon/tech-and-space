import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft, ExternalLink, Clock, Tag, MapPin } from "lucide-react";
import Link from "next/link";
import {
  getAllArticles,
  getArticleBySlug,
  getRelatedArticles,
} from "@/lib/content";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/lib/types";
import { formatDistanceToNow } from "@/lib/utils";
import ArticleGlobeBackground from "@/components/ArticleGlobeBackground";
import SolarSystemBackground from "@/components/SolarSystemBackground";
import Comments from "@/components/Comments";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import GlobeModal from "@/components/GlobeModal";
import LangSwitcher from "@/components/LangSwitcher";
import RelatedArticles from "@/components/RelatedArticles";
import ArticleDeleteButton from "@/components/ArticleDeleteButton";
import GlitchEffect from "@/components/GlitchEffect";
import GlobeWithQuiz from "@/components/GlobeWithQuiz";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://techand.space";
export const dynamic = "force-dynamic";
export const dynamicParams = true;

function hasUnsafeMdxAngles(text: string): boolean {
  // MDX treats '<' as JSX start. Reject obvious non-tag uses like n<50.
  return /<(?!\/?[A-Za-z]|!--)/.test(text);
}

interface PageProps {
  params: Promise<{ category: string; id: string }>;
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((a) => ({
    category: a.category,
    id: a.id,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, id } = await params;
  const article = getArticleBySlug(category, id);
  if (!article) return { title: "Article Not Found" };

  const canonicalUrl = `${SITE_URL}/article/${category}/${id}`;
  const ogImage = article.image?.url?.startsWith("http")
    ? article.image.url
    : article.image?.url
    ? `${SITE_URL}${article.image.url}`
    : `${SITE_URL}/logo.jpg`;

  // Use English version if available
  const title = article.titleEn || article.title;
  const description = article.excerptEn || article.excerpt;

  return {
    title: title,
    description: description,
    keywords: article.tags.join(", "),
    alternates: {
      canonical: canonicalUrl,
      languages: { "hr": `${SITE_URL}/hr/article/${category}/${id}` },
    },
    openGraph: {
      title: title,
      description: description,
      type: "article",
      url: canonicalUrl,
      publishedTime: article.date,
      tags: article.tags,
      siteName: "TECH & SPACE",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [ogImage],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { category, id } = await params;
  const article = getArticleBySlug(category, id);

  if (!article) notFound();

  const related = getRelatedArticles(article.id, article.category, article.tags);

  const canonicalUrl = `${SITE_URL}/article/${category}/${id}`;
  const ogImage = article.image?.url?.startsWith("http")
    ? article.image.url
    : article.image?.url
    ? `${SITE_URL}${article.image.url}`
    : `${SITE_URL}/logo.jpg`;

  // Use English version if available
  const displayTitle = article.titleEn || article.title;
  const displayExcerpt = article.excerptEn || article.excerpt;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: displayTitle,
    description: displayExcerpt,
    image: ogImage,
    datePublished: article.date,
    dateModified: article.date,
    author: { "@type": "Organization", name: article.source.name, url: article.source.url },
    publisher: {
      "@type": "Organization",
      name: "TECH & SPACE",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.jpg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    articleSection: article.category,
    keywords: article.tags.join(", "),
    ...(article.videoUrl ? { video: { "@type": "VideoObject", url: article.videoUrl } } : {}),
  };

  // Determine which celestial body to highlight for space articles
  const spaceHighlight = (() => {
    if (article.category !== "space") return undefined;
    const text = (article.title + " " + article.excerpt + " " + article.content).toLowerCase();
    const bodies = ["moon", "mars", "jupiter", "saturn", "venus", "mercury", "earth", "sun"];
    return bodies.find((b) => text.includes(b));
  })();

  return (
    <>
      <GlitchEffect />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Background: Solar system for space articles, globe for others */}
      {article.category === "space" ? (
        <SolarSystemBackground highlightPlanet={spaceHighlight} />
      ) : (
        article.geo && (
          <ArticleGlobeBackground
            geo={article.geo}
            categoryColor={CATEGORY_COLORS[article.category]}
          />
        )
      )}
      <article 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8"
        data-article-db-id={article.dbId || ""}
      >
        {/* Back link + lang switch */}
        <div className="article-enter flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent-cyan transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <LangSwitcher lang="en" href={`/hr/article/${category}/${id}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main content */}
          <div>
            {/* Header */}
              <div className="article-enter-delay-1">
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <Link
                  href={`/category/${article.category}`}
                  className={`category-badge category-badge-${article.category} cursor-pointer hover:opacity-80 transition-opacity`}
                >
                  {CATEGORY_LABELS[article.category]}
                </Link>
                {process.env.NEXT_PUBLIC_AGENT_PANEL === "true" && (
                  <>
                    <span className={`text-[10px] font-mono border rounded px-1.5 py-0.5 ${article.dbId ? "text-accent-cyan/60 border-accent-cyan/20" : "text-red-400/50 border-red-400/20"}`}>
                      {article.dbId ? `db#${article.dbId}` : "no db_id"}
                    </span>
                    {article.dbId && <ArticleDeleteButton articleId={article.dbId} />}
                  </>
                )}
              </div>

              <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary leading-tight mb-4">
                {article.titleEn || article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-text-secondary">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <time dateTime={article.date}>
                    {new Date(article.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    <span className="ml-1 opacity-50">
                      {new Date(article.date).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </span>
                  </time>
                  <span className="ml-1 opacity-60">
                    ({formatDistanceToNow(article.date)})
                  </span>
                </div>
                {article.geo && (
                  <div className="flex items-center gap-1 text-accent-cyan/70">
                    <MapPin className="w-3 h-3" />
                    <span>{article.geo.name}</span>
                  </div>
                )}
                {article.source.url && article.source.url.startsWith("http") && (
                  <a
                    href={article.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-accent-cyan transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {article.source.name || (() => { try { return new URL(article.source.url).hostname.replace(/^www\./, ""); } catch { return "Source"; } })()}
                  </a>
                )}
              </div>
            </div>

            {/* Article image */}
            <div className="article-enter-delay-2">
              {article.image?.url && (
                <div className="glass-card overflow-hidden !hover:transform-none">
                  <img
                    src={article.image.url}
                    alt={article.image.alt}
                    className="w-full h-auto max-h-[400px] object-cover"
                  />
                </div>
              )}
              {/* Image source credit */}
              <p className="text-[0.68rem] font-mono tracking-wider text-text-secondary/40 mt-2 mb-8 px-0.5">
                {article.image?.url
                  ? article.image.credit
                    ? article.image.creditUrl
                      ? <><span>📷 </span><a href={article.image.creditUrl} target="_blank" rel="noopener noreferrer" className="hover:text-text-secondary/70 underline underline-offset-2 transition-colors">{article.image.credit}</a></>
                      : <>📷 {article.image.credit}</>
                    : article.image.url.startsWith("http")
                      ? `Image: ${article.source?.name || "External source"}`
                      : "Illustration: AI Generated"
                  : null}
              </p>
            </div>

            {/* Key Points — 3 short bullet highlights */}
            {(article.keyPointsEn || article.keyPoints) && (
              <div className="article-enter-delay-3 mb-6 not-prose">
                <ul className="space-y-2.5 border-l-4 border-yellow-400/50 pl-4">
                  {(article.keyPointsEn || article.keyPoints)!.slice(0, 3).map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 leading-snug">
                      <span className="mt-0.5 text-base flex-shrink-0 animate-pulse" style={{ color: "#f5c518", textShadow: "0 0 8px #f5c518, 0 0 18px #f5a500aa" }}>★</span>
                      <span className="text-xl italic text-text-primary">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* MDX content with ArticleBreak injected between part1 and part2 */}
            <div className="article-enter-delay-3 article-prose max-w-none mt-8">
              {(() => {
                // Use English content if available, otherwise Croatian
                const enFromParts = article.part1En && article.part2En
                  ? `${article.part1En}\n\n<ArticleBreak />\n\n${article.part2En}`
                  : article.part1En
                  ? article.part1En
                  : null;
                const enContent = enFromParts && !hasUnsafeMdxAngles(enFromParts) ? enFromParts : null;

                const displaySubtitle = article.subtitleEn || article.subtitle;
                const contentToRender = enContent || article.content;

                return (
                  <MDXRemote
                    source={contentToRender}
                    components={{
                      YouTubeEmbed,
                      ArticleBreak: () => (
                        <div className="not-prose my-8 pt-6 border-t border-white/10">
                          {(() => {
                            const videoCandidate = article.videoUrl || article.source?.url || "";
                            if (!videoCandidate) return null;
                            const match = videoCandidate.match(
                              /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/
                            );
                            const videoId = match?.[1];
                            return videoId ? <YouTubeEmbed id={videoId} title={article.title} /> : null;
                          })()}
                          {article.subtitleImage?.url && (
                            <div className="glass-card overflow-hidden mb-4 !hover:transform-none">
                              <img
                                src={article.subtitleImage.url}
                                alt={article.subtitleImage?.alt}
                                className="w-full h-auto max-h-[400px] object-cover"
                              />
                            </div>
                          )}
                          {displaySubtitle && (
                            <p className="text-text-secondary italic text-lg leading-relaxed font-medium">
                              {displaySubtitle}
                            </p>
                          )}
                        </div>
                      ),
                    }}
                  />
                );
              })()}
            </div>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="article-enter-delay-3 mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-text-secondary" />
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full bg-white/5 text-text-secondary border border-white/10 hover:border-accent-cyan/30 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <Comments term={`${article.category}/${article.id}`} />

            {/* Edit button — only on test site */}
            {process.env.NEXT_PUBLIC_AGENT_PANEL === "true" && article.dbId && (
              <div className="mt-6 flex justify-end">
                <a
                  href={`/foto-review?id=${article.dbId}`}
                  className="text-xs px-3 py-1.5 rounded border border-white/15 text-white/35 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
                >
                  Uredi u foto-review →
                </a>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 article-enter-delay-2">
            {/* Globe widget + quiz */}
            {article.geo && (
              <GlobeWithQuiz
                geo={article.geo}
                categoryColor={CATEGORY_COLORS[article.category]}
              />
            )}

            {/* Source info */}
            {article.source.url && article.source.url.startsWith("http") && (
              <div className="glass-card p-4 !hover:transform-none">
                <h3 className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wider font-mono">
                  // Source
                </h3>
                <a
                  href={article.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-accent-cyan hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  {article.source.name || (() => { try { return new URL(article.source.url).hostname.replace(/^www\./, ""); } catch { return "Source"; } })()}
                </a>
              </div>
            )}

            {/* Related articles */}
            {related.length > 0 && <RelatedArticles articles={related} />}
          </aside>
        </div>
      </article>
      {article.geo && (
        <GlobeModal
          pins={[
            {
              lat: article.geo.lat,
              lng: article.geo.lon,
              label: article.geo.name,
              color: CATEGORY_COLORS[article.category],
              id: "article-location",
            },
          ]}
          initialGeo={article.geo}
        />
      )}
    </>
  );
}
