"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

// ── Target moment ────────────────────────────────────────────────────────────
// 17 Sep 2027, 21:27 Zagreb/CET (CEST at that date = UTC+2)
// → UTC: 2027-09-17T19:27:00Z
const TARGET_UTC = new Date("2027-09-17T19:27:00.000Z");

// ── World clocks ─────────────────────────────────────────────────────────────
const WORLD_CLOCKS = [
  { city: "Zagreb",       tz: "Europe/Zagreb"      },
  { city: "London",       tz: "Europe/London"       },
  { city: "New York",     tz: "America/New_York"    },
  { city: "Los Angeles",  tz: "America/Los_Angeles" },
  { city: "Tokyo",        tz: "Asia/Tokyo"          },
  { city: "Dubai",        tz: "Asia/Dubai"          },
] as const;

const TARGET_DISPLAY = "17 Sep 2027";
const TARGET_TIME_LABEL = "21:27 CET";

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad(n: number, width = 2) {
  return String(n).padStart(width, "0");
}

function getRemaining() {
  const total = TARGET_UTC.getTime() - Date.now();
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const days    = Math.floor(total / 86_400_000);
  const hours   = Math.floor((total % 86_400_000) / 3_600_000);
  const minutes = Math.floor((total % 3_600_000)  / 60_000);
  const seconds = Math.floor((total % 60_000)      / 1000);
  return { days, hours, minutes, seconds, done: false };
}

function formatWorldTime(tz: string) {
  const timeStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(TARGET_UTC);

  const dayStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, day: "numeric",
  }).format(TARGET_UTC);

  const refDay = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zagreb", day: "numeric",
  }).format(TARGET_UTC);

  const diff = Number(dayStr) - Number(refDay);
  const dayOffset = diff > 0 ? " +1d" : diff < 0 ? " −1d" : "";

  let tzLabel = "";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, timeZoneName: "short",
    }).formatToParts(TARGET_UTC);
    tzLabel = parts.find(p => p.type === "timeZoneName")?.value ?? "";
  } catch { /* ignore */ }

  return { timeStr, dayOffset, tzLabel };
}

// ── Corner bracket ────────────────────────────────────────────────────────────
function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const S = 14;
  const paths = {
    tl: `M${S},0 L0,0 L0,${S}`,
    tr: `M0,0 L${S},0 L${S},${S}`,
    bl: `M0,0 L0,${S} L${S},${S}`,
    br: `M${S},0 L${S},${S} L0,${S}`,
  };
  const corners = { tl: "top-0 left-0", tr: "top-0 right-0", bl: "bottom-0 left-0", br: "bottom-0 right-0" };
  return (
    <svg width={S + 2} height={S + 2} className={`absolute ${corners[pos]} z-20 pointer-events-none`}>
      <path d={paths[pos]} fill="none" stroke="#00cfff" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

// ── Inline digit ──────────────────────────────────────────────────────────────
function InlineDigit({ value, label, digits = 2 }: { value: number; label: string; digits?: number }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="font-mono tabular-nums leading-none"
        style={{
          fontSize: "clamp(1.05rem, 3.4vw, 2rem)",
          fontWeight: 700,
          color: "#00cfff",
          textShadow: "0 0 12px rgba(0,207,255,0.8), 0 0 30px rgba(0,207,255,0.4)",
          letterSpacing: "0.04em",
        }}
      >
        {pad(value, digits)}
      </span>
      <span className="font-mono uppercase" style={{ fontSize: "0.44rem", letterSpacing: "0.2em", color: "rgba(0,207,255,0.38)" }}>
        {label}
      </span>
    </div>
  );
}

// ── Collapsed (teaser) digit — compact floating bar ───────────────────────────
function CollapsedDigit({ value, label, digits = 2 }: { value: number; label: string; digits?: number }) {
  return (
    <div className="flex flex-col items-center flex-1">
      <span
        className="font-mono tabular-nums leading-none"
        style={{
          fontSize: "clamp(0.85rem, 2.2vw, 1.3rem)",
          fontWeight: 700,
          color: "#00cfff",
          textShadow: "0 0 10px rgba(0,207,255,0.7)",
          letterSpacing: "0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {pad(value, digits)}
      </span>
      <span className="font-mono uppercase mt-0.5" style={{ fontSize: "0.38rem", letterSpacing: "0.18em", color: "rgba(0,207,255,0.35)" }}>
        {label}
      </span>
    </div>
  );
}

function ColonBig() {
  return (
    <span
      className="font-mono leading-none self-start pt-0.5"
      style={{
        fontSize: "clamp(0.55rem, 1.5vw, 1rem)",
        fontWeight: 700,
        color: "rgba(0,207,255,0.5)",
        userSelect: "none",
        animation: "colon-blink 1s step-end infinite",
        flexShrink: 0,
      }}
    >
      :
    </span>
  );
}

// ── Expanded digit block — normal readable size ──────────────────────────────
function DigitBlock({ value, label, digits = 2 }: { value: number; label: string; digits?: number }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="font-mono tabular-nums leading-none"
        style={{
          fontSize: "clamp(2rem, 6vw, 3rem)",
          fontWeight: 700,
          color: "#00cfff",
          textShadow: "0 0 16px rgba(0,207,255,0.8), 0 0 40px rgba(0,207,255,0.4)",
          letterSpacing: "0.02em",
          fontVariantNumeric: "tabular-nums",
          transition: "font-size 0.4s ease",
        }}
      >
        {pad(value, digits)}
      </div>
      <span className="font-mono uppercase mt-1.5" style={{ fontSize: "0.48rem", letterSpacing: "0.22em", color: "rgba(0,207,255,0.40)" }}>
        {label}
      </span>
    </div>
  );
}

function Colon({ small = false }: { small?: boolean }) {
  return (
    <span
      className="font-mono leading-none"
      style={{
        fontSize: small ? "clamp(0.8rem, 2.4vw, 1.4rem)" : "clamp(1.2rem, 3vw, 1.8rem)",
        fontWeight: 700,
        color: "rgba(0,207,255,0.65)",
        userSelect: "none",
        marginBottom: small ? "0.8rem" : "0.6rem",
        animation: "colon-blink 1s step-end infinite",
      }}
    >
      :
    </span>
  );
}

function PlaceholderDigit({ label, chars }: { label: string; chars: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="font-mono leading-none" style={{ fontSize: "clamp(2rem, 6vw, 3rem)", fontWeight: 700, color: "rgba(0,207,255,0.18)", letterSpacing: "0.02em" }}>
        {"—".repeat(chars)}
      </div>
      <span className="font-mono uppercase mt-1.5" style={{ fontSize: "0.48rem", letterSpacing: "0.22em", color: "rgba(0,207,255,0.22)" }}>{label}</span>
    </div>
  );
}

// Collapsed loading state — same edge-to-edge layout as CollapsedDigit but with dashes
function CollapsedPlaceholder({ chars, label }: { chars: number; label: string }) {
  return (
    <div className="flex flex-col items-center flex-1">
      <span
        className="font-mono leading-none"
        style={{
          fontSize: "clamp(1.1rem, 3vw, 1.9rem)",
          fontWeight: 700,
          color: "rgba(0,207,255,0.15)",
          letterSpacing: "0.02em",
          animation: "agi-ph-pulse 1.8s ease-in-out infinite",
        }}
      >
        {"—".repeat(chars)}
      </span>
      <span className="font-mono uppercase mt-0.5" style={{ fontSize: "0.42rem", letterSpacing: "0.2em", color: "rgba(0,207,255,0.15)" }}>
        {label}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CountdownToAGI() {
  const [remaining, setRemaining] = useState<ReturnType<typeof getRemaining> | null>(null);
  const [expanded, setExpanded]   = useState(false);

  useEffect(() => {
    setRemaining(getRemaining());
    const iv = setInterval(() => {
      setRemaining(getRemaining());
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const worldTimes = WORLD_CLOCKS.map(c => ({ city: c.city, ...formatWorldTime(c.tz) }));
  const isDone = remaining?.done ?? false;

  return (
    <div
      className="relative w-full select-none cursor-pointer"
      aria-label="Countdown to AGI"
      onClick={() => setExpanded(e => !e)}
    >
      {/* Ambient glow */}
      <div className="absolute -inset-px rounded-sm pointer-events-none" style={{ boxShadow: "0 0 60px rgba(0,207,255,0.06)", zIndex: -1 }} />

      <div
        className="relative overflow-hidden"
        style={{
          background: "transparent",
          border: "none",
          borderRadius: "2px",
          transition: "box-shadow 0.3s ease",
        }}
      >

        {/* Top accent line */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(0,207,255,0.75) 50%, transparent)" }} />

        {/* Scanline */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,207,255,0.01) 3px, rgba(0,207,255,0.01) 4px)" }} />

        {/* ── Collapsed bar — dramatic teaser when closed, compact when expanded ── */}
        <div className="relative z-10" style={{ transition: "padding 0.4s ease" }}>
          {!expanded ? (
            /* --- Compact floating teaser bar --- */
            <div className="py-1.5 px-3 sm:px-5">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {/* Label — visible when collapsed so users know what this is */}
                <span
                  className="font-heading font-black uppercase flex-shrink-0"
                  style={{
                    fontSize: "clamp(0.45rem, 1.2vw, 0.62rem)",
                    letterSpacing: "clamp(0.12em, 0.6vw, 0.28em)",
                    color: "rgba(0,207,255,0.5)",
                  }}
                >
                  COUNTDOWN TO AGI
                </span>
                <span className="w-px h-3 bg-white/10 flex-shrink-0" />
              {/* Numbers */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                {isDone ? (
                  <span className="font-heading font-bold uppercase" style={{ fontSize: "clamp(1.2rem, 5vw, 2rem)", color: "#00cfff", textShadow: "0 0 30px rgba(0,207,255,0.8)", letterSpacing: "0.18em" }}>
                    THRESHOLD REACHED
                  </span>
                ) : remaining ? (
                  <>
                    <CollapsedDigit value={remaining.days}    label="days"  digits={3} />
                    <ColonBig />
                    <CollapsedDigit value={remaining.hours}   label="hrs"   digits={2} />
                    <ColonBig />
                    <CollapsedDigit value={remaining.minutes} label="min"   digits={2} />
                    <ColonBig />
                    <CollapsedDigit value={remaining.seconds} label="sec"   digits={2} />
                  </>
                ) : (
                  <>
                    <CollapsedPlaceholder chars={3} label="days" />
                    <ColonBig />
                    <CollapsedPlaceholder chars={2} label="hrs" />
                    <ColonBig />
                    <CollapsedPlaceholder chars={2} label="min" />
                    <ColonBig />
                    <CollapsedPlaceholder chars={2} label="sec" />
                  </>
                )}
              </div>
                <ChevronDown className="shrink-0 ml-1" style={{ width: "10px", height: "10px", color: "rgba(0,207,255,0.3)" }} />
              </div>
            </div>
          ) : (
            /* --- Compact expanded header --- */
            <div className="px-3 sm:px-5 py-2.5 sm:py-3 flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-6">
              <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-center min-w-0">
                {isDone ? (
                  <span className="font-heading font-bold uppercase" style={{ fontSize: "clamp(0.8rem, 3vw, 1rem)", color: "#00cfff", letterSpacing: "0.16em" }}>
                    THRESHOLD REACHED
                  </span>
                ) : remaining ? (
                  <>
                    <InlineDigit value={remaining.days}    label="days"  digits={3} />
                    <Colon small />
                    <InlineDigit value={remaining.hours}   label="hrs"   digits={2} />
                    <Colon small />
                    <InlineDigit value={remaining.minutes} label="min"   digits={2} />
                    <Colon small />
                    <InlineDigit value={remaining.seconds} label="sec"   digits={2} />
                  </>
                ) : (
                  <span className="font-mono" style={{ color: "rgba(0,207,255,0.2)", fontSize: "1.4rem" }}>——— : —— : —— : ——</span>
                )}
              </div>
              <span className="font-mono shrink-0 hidden sm:block" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", color: "rgba(214,242,255,0.3)" }}>
                {TARGET_DISPLAY} · <span style={{ color: "rgba(0,207,255,0.55)" }}>{TARGET_TIME_LABEL}</span>
              </span>
              <ChevronDown
                className="shrink-0 transition-transform duration-300 ml-auto sm:ml-0"
                style={{
                  width: "14px", height: "14px",
                  color: "rgba(0,207,255,0.4)",
                  transform: "rotate(180deg)",
                }}
              />
            </div>
          )}
        </div>

        {/* ── Expanded panel ── */}
        <div
          style={{
            maxHeight: expanded ? "900px" : "0px",
            overflow: "hidden",
            transition: "max-height 0.45s cubic-bezier(0.4,0,0.2,1)",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Shimmer sweep */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" style={{ background: "linear-gradient(180deg, rgba(0,207,255,0.025) 0%, transparent 60%)", animation: "agi-shimmer 6s ease-in-out infinite" }} />

          <div className="relative z-10 pb-7 sm:pb-9 pt-0 space-y-0">
            {/* COUNTDOWN TO AGI — edge-to-edge stretched title */}
            <div
              className="w-full flex items-center justify-center overflow-hidden"
              style={{ padding: "0.6rem 0" }}
            >
              <span
                className="font-heading font-black uppercase tracking-widest w-full text-center block"
                style={{
                  fontSize: "clamp(0.9rem, 4.5vw, 2rem)",
                  letterSpacing: "clamp(0.4em, 3vw, 1.2em)",
                  color: "rgba(0,207,255,0.55)",
                  textShadow: "0 0 20px rgba(0,207,255,0.3)",
                  wordSpacing: "-0.1em",
                }}
              >
                COUNTDOWN TO AGI
              </span>
            </div>

            <div className="px-6 sm:px-10 pt-5">
            {/* Divider */}
            <div className="w-full h-px mb-6" style={{ background: "linear-gradient(90deg, transparent, rgba(0,207,255,0.14) 30%, rgba(0,207,255,0.14) 70%, transparent)" }} />

            <div className="mb-6 px-4 py-3 text-center sm:text-left">
              <div className="font-mono uppercase" style={{ fontSize: "0.56rem", letterSpacing: "0.2em", color: "rgba(0,207,255,0.44)" }}>
                Target Date
              </div>
              <div className="mt-1 font-heading font-bold" style={{ fontSize: "clamp(0.95rem, 3.2vw, 1.2rem)", color: "rgba(214,242,255,0.92)", letterSpacing: "0.06em" }}>
                {TARGET_DISPLAY}
              </div>
              <div className="mt-1 font-mono" style={{ fontSize: "0.72rem", color: "rgba(0,207,255,0.72)", letterSpacing: "0.12em" }}>
                {TARGET_TIME_LABEL} · Zagreb
              </div>
            </div>

            {/* Big digits */}
            {isDone ? (
              <div className="text-center py-4 mb-6">
                <p className="font-heading font-bold uppercase" style={{ fontSize: "clamp(1.2rem, 5vw, 2rem)", color: "#00cfff", textShadow: "0 0 30px rgba(0,207,255,0.8)", letterSpacing: "0.18em" }}>
                  THRESHOLD REACHED
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-7">
                {remaining ? (
                  <>
                    <DigitBlock value={remaining.days}    label="days"  digits={3} />
                    <Colon />
                    <DigitBlock value={remaining.hours}   label="hours" digits={2} />
                    <Colon />
                    <DigitBlock value={remaining.minutes} label="min"   digits={2} />
                    <Colon />
                    <DigitBlock value={remaining.seconds} label="sec"   digits={2} />
                  </>
                ) : (
                  <>
                    <PlaceholderDigit label="days"  chars={3} />
                    <Colon />
                    <PlaceholderDigit label="hours" chars={2} />
                    <Colon />
                    <PlaceholderDigit label="min"   chars={2} />
                    <Colon />
                    <PlaceholderDigit label="sec"   chars={2} />
                  </>
                )}
              </div>
            )}

            {/* World clocks */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5 mb-5 px-1">
              {worldTimes.map(({ city, timeStr, dayOffset, tzLabel }) => (
                <div key={city} className="flex items-center justify-between gap-2 min-w-0">
                  <span className="font-mono truncate" style={{ fontSize: "0.6rem", letterSpacing: "0.16em", color: "rgba(0,207,255,0.38)", textTransform: "uppercase" }}>{city}</span>
                  <span className="font-mono font-bold shrink-0" style={{ fontSize: "0.72rem", color: "rgba(214,242,255,0.78)", letterSpacing: "0.04em" }}>
                    {timeStr}
                    <span style={{ fontSize: "0.55rem", fontWeight: 400, color: "rgba(0,207,255,0.48)", marginLeft: "3px" }}>{tzLabel}</span>
                    {dayOffset && <span style={{ fontSize: "0.52rem", color: "rgba(255,207,80,0.6)", marginLeft: "2px" }}>{dayOffset}</span>}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center">
              <span className="font-mono uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "rgba(0,207,255,0.22)" }}>
                Global synchronization active
              </span>
            </div>
            </div>{/* close px-6 wrapper */}
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(0,207,255,0.45) 50%, transparent)" }} />
      </div>

      <style jsx global>{`
        @keyframes agi-shimmer {
          0%, 100% { opacity: 0.6; transform: translateY(-20%); }
          50%       { opacity: 0;   transform: translateY(120%);  }
        }
        @keyframes colon-blink {
          0%, 49% { color: rgba(0,207,255,0.65); }
          50%, 100% { color: rgba(0,207,255,0.12); }
        }
        @keyframes agi-ph-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
