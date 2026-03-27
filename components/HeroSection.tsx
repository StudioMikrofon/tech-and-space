"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Satellite } from "lucide-react";
import { playSound } from "@/lib/sounds";
import Globe from "./Globe";
import type { GlobeHandle } from "./GlobeWrapper";
import type { Article } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/types";
import { formatDistanceToNow } from "@/lib/utils";


interface HeroSectionProps {
  featured: Article;
  headlines?: Article[];
  latestPerCategory?: Article[];
  latestPerCategoryMultiple?: Record<string, Article[]>;
}

/* ── Headline Sequence ─────────────────────────────────────────────────── */
type Phase = "in" | "hold" | "out";
const TIMING = { in: 500, hold: 2800, out: 350 } as const;

// Slide variants — enter/exit directions as separate X/Y for CSS custom props
const SLIDE_VARIANTS = [
  { ex: "110%",  ey: "0%",   xx: "-110%", xy: "0%"  },
  { ex: "-110%", ey: "0%",   xx: "110%",  xy: "0%"  },
  { ex: "0%",    ey: "-55%", xx: "0%",    xy: "55%" },
  { ex: "80%",   ey: "-28%", xx: "-80%",  xy: "28%" },
  { ex: "-80%",  ey: "-28%", xx: "80%",   xy: "28%" },
];

function pickVariant() { return Math.floor(Math.random() * SLIDE_VARIANTS.length); }

function HeadlineSequence({ headlines }: { headlines: Article[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("in");
  const [showStreak, setShowStreak] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [variantIdx, setVariantIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerGlitch = useCallback(() => {
    setGlitching(true);
    playSound("glitch");
    setTimeout(() => setGlitching(false), 340);
  }, []);

  useEffect(() => {
    if (headlines.length <= 1) { setPhase("hold"); return; }
    const clear = () => { if (timerRef.current) clearTimeout(timerRef.current); };

    if (phase === "in") {
      setShowStreak(true);
      triggerGlitch();
      timerRef.current = setTimeout(() => {
        setShowStreak(false);
        setShaking(true);
        setTimeout(() => setShaking(false), 260);
        setPhase("hold");
      }, TIMING.in);
    } else if (phase === "hold") {
      clear();
      timerRef.current = setTimeout(() => setPhase("out"), TIMING.hold);
    } else if (phase === "out") {
      clear();
      timerRef.current = setTimeout(() => {
        setPrevIndex(activeIndex);
        setActiveIndex((i) => (i + 1) % headlines.length);
        setVariantIdx(pickVariant());
        setPhase("in");
      }, TIMING.out);
    }
    return clear;
  }, [phase, activeIndex, headlines.length, triggerGlitch]);

  if (headlines.length === 0) return null;

  const variant = SLIDE_VARIANTS[variantIdx];
  const active = headlines[activeIndex];
  const prev = prevIndex !== null ? headlines[prevIndex] : null;
  const activeClass = phase === "in" ? "hl-enter" : phase === "hold" ? "headline-hold" : "hl-exit";

  const renderHeadline = (article: Article, cls: string, key: string, isActive = false) => (
    <Link
      key={key}
      href={`/article/${article.category}/${article.id}`}
      className={`absolute inset-0 flex flex-col items-center justify-center text-center px-5 sm:px-10 overflow-hidden ${cls}`}
      style={{
        willChange: "transform, opacity, filter",
        "--hl-ex": variant.ex, "--hl-ey": variant.ey,
        "--hl-xx": variant.xx, "--hl-xy": variant.xy,
      } as React.CSSProperties}
    >
      <div className={`relative max-w-xl sm:max-w-2xl mx-auto ${isActive && glitching ? "hl-glitching" : ""} ${isActive && shaking ? "hl-transmit" : ""}`}>
        {/* Chromatic aberration ghosts — cyan left + magenta right */}
        {isActive && glitching && (
          <>
            <div className="hl-glitch-cyan" aria-hidden>
              <span className={`category-badge category-badge-${article.category} inline-block mb-2 sm:mb-3`}>
                {CATEGORY_LABELS[article.category]}
              </span>
              <h2 className="font-heading text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] mb-1">
                {article.titleEn || article.title}
              </h2>
            </div>
            <div className="hl-glitch-magenta" aria-hidden>
              <span className={`category-badge category-badge-${article.category} inline-block mb-2 sm:mb-3`}>
                {CATEGORY_LABELS[article.category]}
              </span>
              <h2 className="font-heading text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] mb-1">
                {article.titleEn || article.title}
              </h2>
            </div>
          </>
        )}
        <span className={`category-badge category-badge-${article.category} inline-block mb-2 sm:mb-3`}>
          {CATEGORY_LABELS[article.category]}
        </span>
        <h2
          className="font-heading text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.05] mb-1"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,1), 0 4px 48px rgba(0,0,0,0.9), 0 0 100px rgba(0,0,0,0.7)" }}
        >
          {article.titleEn || article.title}
        </h2>
        {article.source?.name && (
          <p className="text-[11px] font-mono tracking-widest uppercase mt-1"
            style={{ color: "rgba(0,207,255,0.55)", textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>
            {article.source.name}
          </p>
        )}
        {/* Scanline — subtle highlight traveling down during hold */}
        {isActive && !glitching && <div className="hl-scanline" aria-hidden />}
      </div>
    </Link>
  );

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      {/* Cyan streak trace on entry — main line + faint shadow line */}
      {showStreak && (
        <>
          <div
            className="absolute top-0 bottom-0 w-[5px] z-20 pointer-events-none"
            style={{
              animation: `hl-streak ${TIMING.in}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
              background: "linear-gradient(to bottom, transparent 0%, rgba(0,207,255,1) 35%, rgba(143,211,255,1) 50%, rgba(0,207,255,1) 65%, transparent 100%)",
              boxShadow: "0 0 24px 8px rgba(0,207,255,0.6), 0 0 60px 18px rgba(0,207,255,0.2), 0 0 100px 30px rgba(0,207,255,0.08)",
            }}
          />
          <div
            className="absolute top-0 bottom-0 w-[2px] z-20 pointer-events-none"
            style={{
              animation: `hl-streak-shadow ${TIMING.in * 1.15}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
              background: "linear-gradient(to bottom, transparent 0%, rgba(0,207,255,0.3) 40%, rgba(0,207,255,0.3) 60%, transparent 100%)",
              marginLeft: "10px",
            }}
          />
        </>
      )}
      {/* Horizontal interference noise bars on entry */}
      {showStreak && (
        <>
          <div className="hl-noise-bar" />
          <div className="hl-noise-bar" />
          <div className="hl-noise-bar" />
        </>
      )}
      <div className="relative w-full h-full pointer-events-auto">
        {phase === "in" && prev && prevIndex !== activeIndex &&
          renderHeadline(prev, "hl-exit", `prev-${prevIndex}`, false)}
        {renderHeadline(active, activeClass, `active-${activeIndex}`, true)}
      </div>
    </div>
  );
}

function CategoryCarousel({ articles, staggerIndex }: { articles: Article[]; staggerIndex: number }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (articles.length <= 1) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let fadeTimeoutId: ReturnType<typeof setTimeout> | null = null;

    // Stagger start: delay first transition by staggerIndex * 800ms
    const startDelay = setTimeout(() => {
      intervalId = setInterval(() => {
        // Fade out
        setVisible(false);
        // After fade-out completes (500ms), switch article and fade in
        fadeTimeoutId = setTimeout(() => {
          setActiveIndex((prev) => (prev + 1) % articles.length);
          setVisible(true);
        }, 500);
      }, 5000);
    }, staggerIndex * 800);

    return () => {
      clearTimeout(startDelay);
      if (intervalId) clearInterval(intervalId);
      if (fadeTimeoutId) clearTimeout(fadeTimeoutId);
    };
  }, [articles.length, staggerIndex]);

  const article = articles[activeIndex];
  if (!article) return null;

  return (
    <Link
      href={`/article/${article.category}/${article.id}`}
      className="block py-1.5 px-2 rounded hover:bg-white/5 transition-colors duration-150"
    >
      <div className={visible ? "cat-jump-in" : "cat-jump-out"}>
        <div className="flex items-start gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full mt-[5px] shrink-0"
            style={{ backgroundColor: CATEGORY_COLORS[article.category] }}
          />
          <div>
            <p className="text-[11px] font-medium text-text-primary/80 line-clamp-2 leading-snug">
              {article.titleEn || article.title}
            </p>
            <span className="text-[10px] font-mono" style={{ color: CATEGORY_COLORS[article.category] }}>
              {CATEGORY_LABELS[article.category]}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HeroSection({
  featured,
  headlines = [],
  latestPerCategoryMultiple = {},
}: HeroSectionProps) {
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeHandle>(null);
  const [globeSize, setGlobeSize] = useState(600);
  const [globeHeight, setGlobeHeight] = useState(600);
  const [articlePins, setArticlePins] = useState<{ lat: number; lng: number; label: string; color: string; id: string; size?: number }[]>([]);

  // ── Loading gate: wait for globe + pins before revealing ──
  const [pinsLoaded, setPinsLoaded] = useState(false);
  const [globeTimedIn, setGlobeTimedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [progressDone, setProgressDone] = useState(false);

  // Globe has no onReady callback — use timeout (max 2s wait)
  useEffect(() => {
    const t = setTimeout(() => setGlobeTimedIn(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Mark ready when both conditions met
  useEffect(() => {
    if ((pinsLoaded || globeTimedIn) && globeTimedIn) {
      setReady(true);
      // Briefly show progress at 100% then fade
      setTimeout(() => setProgressDone(true), 50);
    }
  }, [pinsLoaded, globeTimedIn]);

  useEffect(() => {
    function updateSize() {
      if (globeContainerRef.current) {
        const w = globeContainerRef.current.clientWidth;
        setGlobeSize(Math.min(w, 900));
        setGlobeHeight(Math.min(w, 900));
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    fetch("/api/globe-pins")
      .then(r => r.json())
      .then(pins => { setArticlePins(pins); setPinsLoaded(true); })
      .catch(() => { setPinsLoaded(true); });
  }, []);

  return (
    <section className="relative overflow-hidden bg-space-bg" ref={globeContainerRef}>

      {/* ── Loading progress bar ── */}
      {!progressDone && (
        <div className={`hero-progress-bar ${ready ? "hero-progress-done" : ""}`} />
      )}

      {/* ── JARVIS terminal loading overlay ── */}
      {!ready && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center"
          style={{ background: "rgba(0,2,8,0.97)", minHeight: "clamp(340px, 52vw, 680px)" }}
        >
          {/* CRT scan lines */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,207,255,0.018) 3px, rgba(0,207,255,0.018) 4px)"
          }} />
          {/* Jarvis content */}
          <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
            <span className="font-mono uppercase tracking-[0.35em]" style={{ fontSize: "0.6rem", color: "rgba(0,207,255,0.45)", letterSpacing: "0.35em" }}>
              INITIALIZING ORBITAL FEED
            </span>
            <div className="tp-dots"><span /><span /><span /></div>
            <span className="font-mono uppercase" style={{ fontSize: "0.5rem", letterSpacing: "0.2em", color: "rgba(0,207,255,0.22)" }}>
              SYNCING GLOBAL NETWORK...
            </span>
          </div>
        </div>
      )}

      {/* ── Globe + Headline zone: fixed-height container so globe and text overlap on all viewports ── */}
      <div
        className="relative"
        style={{
          minHeight: "clamp(340px, 52vw, 680px)",
          opacity: ready ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        {/* Globe */}
        <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none">
          <div className="globe-glow">
            <Globe
              ref={globeRef}
              pins={articlePins}
              width={globeSize}
              height={globeHeight}
              autoRotate={true}
              enableZoom={false}
              initialAltitude={1.5}
            />
          </div>
        </div>

        {/* Live feed indicator */}
        <div className="absolute top-4 sm:top-5 left-0 right-0 z-20 flex items-center justify-center gap-2 text-xs font-mono text-accent-cyan/70 pointer-events-none">
          <Satellite className="w-3 h-3 animate-pulse shrink-0" />
          <span className="terminal-text whitespace-nowrap">LIVE FEED // ORBITAL NETWORK</span>
          <span className="live-dot shrink-0" />
        </div>

        {/* Animated headline sequence */}
        {headlines.length > 0 && <HeadlineSequence headlines={headlines} />}

        {/* Static featured article fallback — no headlines */}
        {headlines.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 px-6">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <Link
                href={`/category/${featured.category}`}
                className={`category-badge category-badge-${featured.category} inline-block cursor-pointer hover:opacity-80 transition-opacity`}
              >
                {CATEGORY_LABELS[featured.category]}
              </Link>
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1]"
                style={{ textShadow: "0 2px 16px rgba(0,0,0,1), 0 4px 48px rgba(0,0,0,0.9)" }}>
                {featured.title}
              </h1>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
                {featured.excerpt}
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-text-secondary">
                <Clock className="w-4 h-4" />
                <span>{formatDistanceToNow(featured.date)}</span>
              </div>
              <Link
                href={`/article/${featured.category}/${featured.id}`}
                className="article-link-cta inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-accent-cyan/10 border border-accent-cyan/30 rounded-xl text-accent-cyan font-semibold text-base sm:text-lg hover:bg-accent-cyan/20 transition-all duration-300"
              >
                Read Article
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}
      </div>{/* end globe+headline zone */}

      {/* Latest per category — no background, directly on page */}
      {Object.keys(latestPerCategoryMultiple).length > 0 && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-x-3 gap-y-0">
            {Object.entries(latestPerCategoryMultiple).slice(0, 8).map(([category, articles], index) => (
              <CategoryCarousel key={category} articles={articles} staggerIndex={index} />
            ))}
          </div>
        </div>
      )}

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-space-bg to-transparent z-10 pointer-events-none" />
    </section>
  );
}
