import Link from "next/link";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/types";

export default function Footer() {
  return (
    <footer className="border-t border-white/8 mt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <img
                src="/logo.jpg"
                alt="TECH & SPACE"
                className="h-8 rounded drop-shadow-[0_0_8px_rgba(0,207,255,0.5)]"
              />
              <span className="font-heading font-bold text-sm tracking-widest text-white/70 uppercase">
                Tech & Space
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              An AI-driven editorial intelligence feed — not just aggregation.
              Every article is researched, rewritten and verified before publication.
              Built for readers who need signal, not noise.
            </p>
            <p className="text-xs text-text-secondary/50 font-mono">
              // Powered by OpenClaw · Continuous publishing pipeline
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-[0.22em] text-text-secondary/60 mb-4">
              // Coverage
            </h3>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={`/category/${cat}`}
                  className="text-sm text-text-secondary hover:text-accent-cyan transition-colors"
                >
                  {CATEGORY_LABELS[cat]}
                </Link>
              ))}
            </div>
          </div>

          {/* Mission */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-[0.22em] text-text-secondary/60 mb-4">
              // Mission
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              The internet drowns in press releases. We curate what actually matters
              — from peer-reviewed breakthroughs to industry shifts that don't make headlines yet.
            </p>
            <p className="text-sm text-text-secondary/60">
              Coverage across AI, Robotics, Space, Medicine, Gaming, Technology and Society.
              Updated around the clock.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-secondary/40 font-mono">
            &copy; {new Date().getFullYear()} TECH &amp; SPACE — All editorial content machine-verified.
          </p>
          <p className="text-xs text-text-secondary/30 font-mono">
            Built with Next.js · Git pipeline · OpenClaw AI
          </p>
        </div>
      </div>
    </footer>
  );
}
