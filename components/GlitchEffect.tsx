"use client";

import { useEffect, useState } from "react";

/**
 * GlitchEffect — brief signal-corruption overlay on mount (article open/change).
 * Shows a ~500ms glitch on every article page load. No session check — always fires.
 */
export default function GlitchEffect() {
  const [phase, setPhase] = useState<"active" | "fading" | "done">("active");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("fading"), 380);
    const t2 = setTimeout(() => setPhase("done"), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "done") return null;

  return (
    <>
      <style>{`
        @keyframes glitch-h {
          0%   { clip-path: inset(8% 0 85% 0);  transform: translateX(-6px) skewX(-1deg); opacity: 1; }
          15%  { clip-path: inset(45% 0 40% 0); transform: translateX(5px)  skewX(2deg);  opacity: 0.8; }
          30%  { clip-path: inset(70% 0 15% 0); transform: translateX(-3px) skewX(-2deg); opacity: 0.9; }
          50%  { clip-path: inset(20% 0 65% 0); transform: translateX(4px)  skewX(1deg);  opacity: 0.7; }
          70%  { clip-path: inset(55% 0 30% 0); transform: translateX(-2px);              opacity: 0.6; }
          85%  { clip-path: inset(5% 0 88% 0);  transform: translateX(2px);               opacity: 0.4; }
          100% { clip-path: inset(0 0 0 0);     transform: none;                          opacity: 0; }
        }
        @keyframes glitch-scan {
          0%   { top: -10%; opacity: 0.6; }
          100% { top: 110%; opacity: 0; }
        }
        @keyframes glitch-rgb-r {
          0%   { transform: translateX(-3px); opacity: 0.4; }
          50%  { transform: translateX(3px);  opacity: 0.3; }
          100% { transform: translateX(-1px); opacity: 0; }
        }
        @keyframes glitch-rgb-b {
          0%   { transform: translateX(3px);  opacity: 0.3; }
          50%  { transform: translateX(-2px); opacity: 0.4; }
          100% { transform: translateX(1px);  opacity: 0; }
        }

        .glitch-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          pointer-events: none;
          overflow: hidden;
          transition: opacity 0.22s ease-out;
        }
        .glitch-overlay.fading {
          opacity: 0;
        }

        /* Main glitch slice */
        .glitch-slice {
          position: absolute;
          inset: 0;
          background: rgba(0, 255, 65, 0.04);
          animation: glitch-h 0.38s steps(1) forwards;
        }

        /* Horizontal scan bar */
        .glitch-scan {
          position: absolute;
          left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, rgba(0,255,65,0.7) 40%, rgba(0,200,255,0.5) 60%, transparent);
          animation: glitch-scan 0.32s ease-in forwards;
        }

        /* RGB channel splits */
        .glitch-rgb-r {
          position: absolute;
          inset: 0;
          background: rgba(255, 0, 60, 0.06);
          mix-blend-mode: screen;
          animation: glitch-rgb-r 0.38s ease-out forwards;
        }
        .glitch-rgb-b {
          position: absolute;
          inset: 0;
          background: rgba(0, 80, 255, 0.06);
          mix-blend-mode: screen;
          animation: glitch-rgb-b 0.38s ease-out forwards;
        }

        /* Brief noise static at start */
        .glitch-static {
          position: absolute;
          inset: 0;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 150px 150px;
          animation: glitch-rgb-r 0.2s steps(2) forwards;
        }
      `}</style>

      <div className={`glitch-overlay${phase === "fading" ? " fading" : ""}`}>
        <div className="glitch-static" />
        <div className="glitch-slice" />
        <div className="glitch-scan" />
        <div className="glitch-rgb-r" />
        <div className="glitch-rgb-b" />
      </div>
    </>
  );
}
