"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_LABELS_HR } from "@/lib/types";

const T = {
  en: {
    brand: "Editorial intelligence for the frontier of technology — AI, Space, Robotics, and what comes next.",
    pipeline: "// Continuous publishing pipeline",
    coverage: "// Coverage",
    mission: "// Mission",
    missionText: "The internet drowns in press releases. We surface what actually matters — peer-reviewed breakthroughs, industry shifts, and signals that don't make headlines yet.",
    updated: "Updated around the clock.",
    copyright: "All editorial content machine-verified.",
    stack: "Next.js · AI Pipeline · Open Source",
  },
  hr: {
    brand: "Uredničko informiranje s fronte tehnologije — UI, svemir, robotika i sve što dolazi.",
    pipeline: "// Kontinuirani pipeline objavljivanja",
    coverage: "// Kategorije",
    mission: "// Misija",
    missionText: "Internet je preplavljen priopćenjima. Mi izvlačimo ono što stvarno vrijedi — recenzirane proboje, industrijske pomake i signale koji još ne dospijevaju u naslove.",
    updated: "Ažurirano neprestano.",
    copyright: "Sav sadržaj provjeren AI sustavom.",
    stack: "Next.js · AI Pipeline · Open Source",
  },
};

export default function Footer() {
  const pathname = usePathname();
  const isHr = pathname.startsWith("/hr");
  const t = isHr ? T.hr : T.en;
  const catLabels = isHr ? CATEGORY_LABELS_HR : CATEGORY_LABELS;

  return (
    <footer className="border-t border-white/8 mt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="space-y-4">
            <img
              src="/ts-logo-full.svg"
              alt="TECH & SPACE"
              className="h-8 w-auto drop-shadow-[0_0_8px_rgba(0,207,255,0.5)]"
            />
            <p className="text-sm text-text-secondary leading-relaxed">
              {t.brand}
            </p>
            <p className="text-xs text-text-secondary/40 font-mono">
              {t.pipeline}
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-[0.22em] text-text-secondary/60 mb-4">
              {t.coverage}
            </h3>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={isHr ? `/hr/category/${cat}` : `/category/${cat}`}
                  className="text-sm text-text-secondary hover:text-accent-cyan transition-colors"
                >
                  {catLabels[cat]}
                </Link>
              ))}
            </div>
          </div>

          {/* Mission */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-[0.22em] text-text-secondary/60 mb-4">
              {t.mission}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              {t.missionText}
            </p>
            <p className="text-sm text-text-secondary/50">
              {t.updated}
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-secondary/40 font-mono">
            &copy; {new Date().getFullYear()} TECH &amp; SPACE — {t.copyright}
          </p>
          <p className="text-xs text-text-secondary/25 font-mono">
            {t.stack}
          </p>
        </div>
      </div>
    </footer>
  );
}
