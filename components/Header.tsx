"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, Volume2, VolumeX, GitBranch, Loader2, Radio } from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_LABELS_HR } from "@/lib/types";
import { playSound, isSoundEnabled, setSoundEnabled } from "@/lib/sounds";
import dynamic from "next/dynamic";

const SpaceProDrawer = dynamic(() => import("./SpaceProDrawer"), { ssr: false });

export default function Header() {
  const pathname = usePathname();
  const isHr = pathname.startsWith("/hr");
  const catLabels = isHr ? CATEGORY_LABELS_HR : CATEGORY_LABELS;

  const [menuOpen, setMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [spaceProOpen, setSpaceProOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  useEffect(() => {
    function onScroll() {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        const scrollArea = document.getElementById("main-scroll-area");
        const y = scrollArea ? scrollArea.scrollTop : window.scrollY;
        if (y < 80) {
          setHidden(false);
        } else if (y > lastScrollY.current + 5) {
          setHidden(true);
          setMenuOpen(false);
        } else if (y < lastScrollY.current - 5) {
          setHidden(false);
        }
        lastScrollY.current = y;
        rafRef.current = null;
      });
    }
    const scrollArea = document.getElementById("main-scroll-area");
    (scrollArea || window).addEventListener("scroll", onScroll, { passive: true } as AddEventListenerOptions);
    return () => {
      (scrollArea || window).removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/sync-github", { method: "POST" });
      const data = await res.json();
      setSyncMsg(data.message || (data.ok ? "✅ Sinhronizacija završena!" : `❌ ${data.error}`));
    } catch {
      setSyncMsg("❌ Greška pri sinhronizaciji");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(""), 5000);
    }
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playSound("click");
  };

  const openSpaceLive = () => {
    playSound("click");
    setSpaceProOpen(true);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full overflow-hidden glass-card !rounded-none !border-x-0 !border-t-0 transition-transform duration-300 bg-space-bg/80 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.35)] ${
          hidden ? "-translate-y-full" : "translate-y-0"
        }`}
        style={{
          boxSizing: "border-box",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        <div className="w-full md:max-w-7xl md:mx-auto px-1 sm:px-4 h-[3.25rem] sm:h-16 min-w-0 flex items-center justify-between gap-1 sm:gap-2">

          {/* Logo — always left */}
          <Link
            href={isHr ? "/hr" : "/"}
            className="flex min-w-0 shrink items-center gap-1.5 group hover:opacity-90 transition-opacity overflow-hidden pl-1"
          >
            <img
              src="/ts-logo-full.svg"
              alt="TECH & SPACE"
              className="h-8 sm:h-10 md:h-11 w-auto max-w-[140px] sm:max-w-[190px] md:max-w-none group-hover:drop-shadow-[0_0_10px_rgba(0,207,255,0.5)] transition-all"
            />
            <span className="live-dot ml-1 hidden sm:inline-block" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={isHr ? `/hr/category/${cat}` : `/category/${cat}`}
                className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
                onMouseEnter={() => playSound("hover")}
                onClick={() => playSound("click")}
              >
                {catLabels[cat]}
              </Link>
            ))}
            <div className="mx-2 h-5 w-px bg-white/10" />
            {/* Space LIVE — desktop */}
            <button
              onClick={openSpaceLive}
              onMouseEnter={() => playSound("hover")}
              className="px-3 py-1.5 text-sm font-semibold text-accent-cyan hover:text-white hover:bg-accent-cyan/15 rounded-lg transition-all border border-accent-cyan/30 hover:border-accent-cyan/60 flex items-center gap-1.5 ml-1 relative"
            >
              <span className="relative flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                <span className="tracking-wide">Space LIVE</span>
                <span className="absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
              </span>
            </button>
          </nav>

          {/* Right controls — always right */}
          <div className="flex items-center gap-0.5 shrink-0 pr-0.5">
            {/* Sync — agent panel only */}
            {process.env.NEXT_PUBLIC_AGENT_PANEL === "true" && (
              <div className="relative">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  title="Sinhronizacija na techand.space"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-green-500/40 text-green-400/80 hover:border-green-400 hover:text-green-300 rounded transition-colors disabled:opacity-50"
                >
                  {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <GitBranch className="w-3 h-3" />}
                  SYNC
                </button>
                {syncMsg && (
                  <div className="absolute top-10 right-0 z-50 w-72 text-xs font-mono bg-space-bg border border-white/20 rounded px-3 py-2 text-text-primary shadow-lg">
                    {syncMsg}
                  </div>
                )}
              </div>
            )}

            {/* Language switcher */}
            <Link
              href={isHr ? pathname.replace(/^\/hr/, "") || "/" : `/hr${pathname}`}
              className="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 text-base font-mono font-bold text-text-primary border border-accent-cyan/40 hover:border-accent-cyan/60 hover:bg-accent-cyan/10 rounded transition-all bg-accent-cyan/5"
              title={isHr ? "Switch to English" : "Prebaci na hrvatski"}
            >
              {isHr ? "🇬🇧" : "🇭🇷"}
            </Link>

            {/* Sound toggle */}
            <button
              className="flex h-9 w-9 items-center justify-center sm:h-8 sm:w-8 text-text-secondary hover:text-accent-cyan transition-colors"
              onClick={toggleSound}
              aria-label={soundOn ? "Mute sounds" : "Enable sounds"}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Space LIVE — mobile pill button */}
            <button
              className="md:hidden flex items-center gap-1 px-2 py-1 rounded-full border border-accent-cyan/40 bg-accent-cyan/8 text-accent-cyan hover:bg-accent-cyan/20 hover:border-accent-cyan/70 transition-all"
              onClick={openSpaceLive}
              aria-label="Space LIVE"
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold tracking-wide leading-none">LIVE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
            </button>

            {/* Hamburger */}
            <button
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/8 transition-all"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Zatvori izbornik" : "Otvori izbornik"}
            >
              {menuOpen
                ? <X className="w-5 h-5" />
                : (
                  <span className="flex flex-col gap-[5px]">
                    <span className="block w-5 h-0.5 bg-current rounded-full" />
                    <span className="block w-4 h-0.5 bg-current rounded-full self-end" />
                    <span className="block w-5 h-0.5 bg-current rounded-full" />
                  </span>
                )
              }
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-[3.25rem] z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <nav className="relative z-50 md:hidden bg-space-bg/98 backdrop-blur-2xl border-t border-white/10 overflow-y-auto"
              style={{ maxHeight: "calc(100dvh - 3.25rem)" }}
            >
              <div className="px-5 py-5 space-y-1">
                {CATEGORIES.map((cat, i) => (
                  <Link
                    key={cat}
                    href={isHr ? `/hr/category/${cat}` : `/category/${cat}`}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-text-secondary hover:text-text-primary hover:bg-white/8 active:bg-white/12 transition-all group"
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={() => { setMenuOpen(false); playSound("click"); }}
                    onMouseEnter={() => playSound("hover")}
                  >
                    <span
                      className="w-1 h-5 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                      style={{ background: getCategoryAccent(cat) }}
                    />
                    <span className="tracking-wide">{catLabels[cat]}</span>
                  </Link>
                ))}
              </div>

              {/* Space LIVE in menu */}
              <div className="px-5 pb-6 pt-1">
                <div className="h-px w-full bg-white/8 mb-4" />
                <button
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border border-accent-cyan/35 bg-accent-cyan/8 text-accent-cyan hover:bg-accent-cyan/15 hover:border-accent-cyan/60 transition-all font-semibold text-sm tracking-wider"
                  onClick={() => { setMenuOpen(false); openSpaceLive(); }}
                >
                  <Radio className="w-4 h-4" />
                  Space LIVE
                  <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
                </button>
              </div>
            </nav>
          </>
        )}
      </header>

      <SpaceProDrawer open={spaceProOpen} onClose={() => setSpaceProOpen(false)} defaultTrackerMode="iss" />
    </>
  );
}

function getCategoryAccent(cat: string): string {
  const map: Record<string, string> = {
    ai: "#6b46c1",
    gaming: "#eab308",
    space: "#8b5cf6",
    technology: "#06b6d4",
    medicine: "#ec4899",
    society: "#f97316",
    robotics: "#10b981",
  };
  return map[cat] ?? "#6b7280";
}
