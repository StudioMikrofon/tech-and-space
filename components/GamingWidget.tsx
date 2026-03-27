"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Gamepad2, TrendingUp, Zap, Star, Clock, ChevronRight, Users } from "lucide-react";

interface HypeEntry { name: string; appid: string; hype_score: number; }
interface SpikeAlert { name: string; appid: string; growth_pct: number; severity: string; current_players: number; }
interface ReleaseEntry { name: string; appid: string; anticipation_score: number; header_image?: string; }
interface IndieGame { name: string; appid: string; header_image?: string; final_price?: number; }

interface DashboardData {
  hype_leaderboard: HypeEntry[];
  spike_alerts: SpikeAlert[];
  release_radar: ReleaseEntry[];
  indie_spotlight: IndieGame[];
}

type Tab = "hype" | "releases" | "spikes" | "indie";
type WidgetLang = "en" | "hr";

const TABS: Record<WidgetLang, { id: Tab; label: string; icon: React.ElementType; color: string }[]> = {
  en: [
    { id: "hype",     label: "Hype",      icon: TrendingUp, color: "text-cyan-400 border-cyan-400" },
    { id: "releases", label: "Releases",  icon: Clock,      color: "text-amber-400 border-amber-400" },
    { id: "spikes",   label: "Spikes",    icon: Zap,        color: "text-red-400 border-red-400" },
    { id: "indie",    label: "Indie",     icon: Star,       color: "text-purple-400 border-purple-400" },
  ],
  hr: [
    { id: "hype",     label: "Hype",      icon: TrendingUp, color: "text-cyan-400 border-cyan-400" },
    { id: "releases", label: "Izdanja",   icon: Clock,      color: "text-amber-400 border-amber-400" },
    { id: "spikes",   label: "Skokovi",   icon: Zap,        color: "text-red-400 border-red-400" },
    { id: "indie",    label: "Indie",     icon: Star,       color: "text-purple-400 border-purple-400" },
  ],
};

const COPY: Record<WidgetLang, Record<string, string>> = {
  en: {
    title: "Gaming Intel",
    full: "full dashboard",
    noReleases: "No upcoming releases",
    noSpikes: "No spikes detected",
    needsData: "needs ~1h of data",
    noIndie: "No indie data",
    now: "now",
  },
  hr: {
    title: "Gaming Pregled",
    full: "cijeli panel",
    noReleases: "Nema skorih izdanja",
    noSpikes: "Nema velikih skokova",
    needsData: "potrebno ~1h podataka",
    noIndie: "Nema indie podataka",
    now: "sada",
  },
};

function SteamA({ appid, children }: { appid: string; children: React.ReactNode }) {
  return (
    <a href={`https://store.steampowered.com/app/${appid}`} target="_blank" rel="noopener noreferrer"
      className="hover:text-cyan-400 transition-colors">
      {children}
    </a>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-4 h-2.5 rounded bg-white/5" />
          <div className="flex-1 h-2.5 rounded bg-white/5" />
          <div className="w-6 h-2.5 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

// Tab content renderers
function HypeList({ entries }: { entries: HypeEntry[] }) {
  return (
    <div className="space-y-1.5">
      {entries.slice(0, 7).map((g, i) => {
        const pct = Math.round(g.hype_score);
        const color = pct >= 70 ? "bg-cyan-400" : pct >= 40 ? "bg-amber-400" : "bg-slate-500";
        return (
          <div key={g.appid} className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-text-secondary/30 w-4 text-right shrink-0">{i + 1}</span>
            <SteamA appid={g.appid}>
              <div className="flex-1 min-w-0 group" style={{ width: "calc(100% - 2.5rem)" }}>
                <span className="text-[11px] font-medium text-text-primary truncate block group-hover:text-cyan-400 transition-colors">
                  {g.name}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] font-mono text-text-secondary/30 w-5 text-right">{pct}</span>
                </div>
              </div>
            </SteamA>
          </div>
        );
      })}
    </div>
  );
}

function ReleaseList({ entries, lang }: { entries: ReleaseEntry[]; lang: WidgetLang }) {
  if (!entries.length) return <p className="text-[11px] font-mono text-text-secondary/30 text-center py-4">{COPY[lang].noReleases}</p>;
  return (
    <div className="space-y-1.5">
      {entries.slice(0, 6).map((g) => (
        <div key={g.appid} className="flex items-center gap-2">
          {g.header_image ? (
            <img src={g.header_image} alt="" className="w-12 h-7 object-cover rounded shrink-0 opacity-70" />
          ) : (
            <div className="w-12 h-7 rounded bg-white/5 shrink-0" />
          )}
          <SteamA appid={g.appid}>
            <span className="text-[11px] font-medium text-text-primary hover:text-amber-400 transition-colors line-clamp-1">{g.name}</span>
          </SteamA>
          <span className="ml-auto text-[10px] font-mono text-amber-400/60 shrink-0">{g.anticipation_score}</span>
        </div>
      ))}
    </div>
  );
}

function SpikeList({ alerts, lang }: { alerts: SpikeAlert[]; lang: WidgetLang }) {
  if (!alerts.length) return (
    <div className="text-center py-4">
      <Users className="w-5 h-5 text-text-secondary/20 mx-auto mb-1" />
      <p className="text-[11px] font-mono text-text-secondary/30">{COPY[lang].noSpikes}</p>
      <p className="text-[10px] font-mono text-text-secondary/20">{COPY[lang].needsData}</p>
    </div>
  );
  const COLORS: Record<string, string> = { moderate: "text-yellow-400", high: "text-orange-400", extreme: "text-red-400" };
  return (
    <div className="space-y-2">
      {alerts.slice(0, 5).map((a) => (
        <div key={a.appid} className="flex items-center justify-between gap-2">
          <SteamA appid={a.appid}>
            <span className="text-[11px] font-medium text-text-primary hover:text-red-400 transition-colors truncate">{a.name}</span>
          </SteamA>
          <div className="text-right shrink-0">
            <span className={`text-xs font-mono font-bold ${COLORS[a.severity] ?? "text-text-secondary"}`}>
              +{Math.round(a.growth_pct)}%
            </span>
            <p className="text-[9px] font-mono text-text-secondary/30">{a.current_players?.toLocaleString()} {COPY[lang].now}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function IndieList({ entries, lang }: { entries: IndieGame[]; lang: WidgetLang }) {
  if (!entries.length) return <p className="text-[11px] font-mono text-text-secondary/30 text-center py-4">{COPY[lang].noIndie}</p>;
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {entries.slice(0, 6).map((g) => (
        <SteamA key={g.appid} appid={g.appid}>
          <div className="group rounded overflow-hidden border border-white/5 hover:border-purple-400/20 transition-colors">
            {g.header_image ? (
              <img src={g.header_image} alt="" className="w-full aspect-video object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
            ) : (
              <div className="w-full aspect-video bg-purple-900/20 flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-purple-400/30" />
              </div>
            )}
            <p className="text-[10px] font-medium text-text-primary px-1.5 py-1 truncate">{g.name}</p>
          </div>
        </SteamA>
      ))}
    </div>
  );
}

export default function GamingWidget({ lang = "en" }: { lang?: WidgetLang }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<Tab>("releases");

  useEffect(() => {
    fetch("/api/gaming/api/intel/dashboard", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setData(d))
      .catch(() => {});
  }, []);

  const spikeCount = data?.spike_alerts?.length ?? 0;

  return (
    <div className="glass-card p-4 border border-cyan-500/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">{COPY[lang].title}</span>
          {spikeCount > 0 && (
            <span className="text-[9px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />{spikeCount}
            </span>
          )}
        </div>
        <Link href={lang === "hr" ? "/hr/gaming" : "/gaming"} className="text-[10px] font-mono text-text-secondary/40 hover:text-cyan-400 transition-colors flex items-center gap-0.5">
          {COPY[lang].full} <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 border-b border-white/5 overflow-x-auto scrollbar-hide">
        {TABS[lang].map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap shrink-0 border-b-2 transition-colors ${
              tab === id ? `${color} border-current` : "text-text-secondary/30 border-transparent hover:text-text-secondary/60"
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
            {id === "spikes" && spikeCount > 0 && (
              <span className="w-3.5 h-3.5 rounded-full bg-red-500/30 text-red-400 text-[8px] flex items-center justify-center font-bold">{spikeCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {!data ? <Skeleton /> : (
        <>
          {tab === "hype"     && <HypeList entries={data.hype_leaderboard ?? []} />}
          {tab === "releases" && <ReleaseList entries={data.release_radar ?? []} lang={lang} />}
          {tab === "spikes"   && <SpikeList alerts={data.spike_alerts ?? []} lang={lang} />}
          {tab === "indie"    && <IndieList entries={data.indie_spotlight ?? []} lang={lang} />}
        </>
      )}
    </div>
  );
}
