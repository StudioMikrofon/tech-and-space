"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, Volume2, VolumeX, Telescope, GitBranch, Loader2 } from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/types";
import { playSound, isSoundEnabled, setSoundEnabled } from "@/lib/sounds";
import dynamic from "next/dynamic";

const SpaceProDrawer = dynamic(() => import("./SpaceProDrawer"), { ssr: false });

export default function Header() {
  const pathname = usePathname();
  const isHr = pathname.startsWith("/hr");
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [spaceProOpen, setSpaceProOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  const lastScrollY = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  // Auto-hide header on scroll
  useEffect(() => {
    function onScroll() {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        const y = window.scrollY;
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
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Body scroll lock when mobile menu is open
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
    } catch (e) {
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
        <div className="w-full md:max-w-7xl md:mx-auto px-0.5 sm:px-4 h-[3rem] sm:h-16 min-w-0 flex items-center justify-between gap-0.5 sm:gap-2">
          {/* Logo */}
          <Link href="/" className="flex min-w-0 shrink items-center gap-1.5 group hover:opacity-90 transition-opacity overflow-hidden pl-2">
            <img
              src="/ts-logo-full.svg"
              alt="TECH & SPACE"
              className="hidden sm:block h-10 md:h-11 w-auto max-w-[190px] md:max-w-none group-hover:drop-shadow-[0_0_10px_rgba(0,207,255,0.5)] transition-all"
            />
            <img
              src="/ts-icon.svg"
              alt="TS"
              className="sm:hidden h-6.5 w-6.5 shrink-0 group-hover:drop-shadow-[0_0_8px_rgba(0,207,255,0.5)] transition-all"
            />
            <span className="sm:hidden min-w-0 font-heading text-[0.72rem] leading-none tracking-[0.22em] text-text-primary whitespace-nowrap">
              TECH &amp; SPACE
            </span>
            <span className="live-dot ml-1 hidden sm:inline-block" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/category/${cat}`}
                className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
                onMouseEnter={() => playSound("hover")}
                onClick={() => playSound("click")}
              >
                {CATEGORY_LABELS[cat]}
              </Link>
            ))}
            <button
              onClick={() => {
                playSound("click");
                setSpaceProOpen(true);
              }}
              onMouseEnter={() => playSound("hover")}
              className="px-3 py-1.5 text-sm text-accent-cyan hover:text-text-primary hover:bg-accent-cyan/10 rounded-lg transition-colors border border-accent-cyan/20 hover:border-accent-cyan/40 flex items-center gap-1.5 ml-2"
            >
              <Telescope className="w-3.5 h-3.5" />
              Space Pro
            </button>
          </nav>

          <div className="flex items-center gap-0 shrink-0 pr-0.5">
            {/* SINHRONIZACIJA — samo na test site */}
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
              className="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 text-xs sm:text-xs font-mono font-bold text-text-primary border border-accent-cyan/40 hover:border-accent-cyan/60 hover:bg-accent-cyan/10 rounded transition-all bg-accent-cyan/5"
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
              {soundOn ? <Volume2 className="w-4 h-4 sm:w-4 sm:h-4" /> : <VolumeX className="w-4 h-4 sm:w-4 sm:h-4" />}
            </button>

            {/* Mobile Space Pro button */}
            <button
              className="md:hidden flex h-9 w-9 items-center justify-center text-accent-cyan hover:text-text-primary transition-colors"
              onClick={() => {
                playSound("click");
                setSpaceProOpen(true);
              }}
              aria-label="Space Pro"
            >
              <Telescope className="w-4.5 h-4.5" />
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex h-9 w-9 items-center justify-center text-text-secondary hover:text-text-primary"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 top-14 sm:top-16 z-40 bg-black/50"
              onClick={() => setMenuOpen(false)}
            />
            <nav className="relative z-50 md:hidden bg-space-bg/95 backdrop-blur-xl border-t border-white/10 px-4 pb-4 max-h-[calc(100dvh-3.5rem)] sm:max-h-[calc(100dvh-4rem)] overflow-y-auto">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={`/category/${cat}`}
                  className="block px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {CATEGORY_LABELS[cat]}
                </Link>
              ))}
            </nav>
          </>
        )}
      </header>

      {/* SpaceProDrawer is a sibling of <header>, not a child — avoids backdrop-filter containing block trap */}
      <SpaceProDrawer open={spaceProOpen} onClose={() => setSpaceProOpen(false)} />
    </>
  );
}
