"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Gamepad2, TrendingUp, Zap, Star, BarChart2,
  RefreshCw, AlertTriangle, ChevronRight, Clock, Users,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HypeEntry {
  name: string;
  appid: string;
  hype_score: number;
  rank: number;
  components: { reddit_score: number; steam_score: number; rawg_score: number; delta_score: number };
}

interface ReleaseEntry {
  appid: string;
  name: string;
  anticipation_score: number;
  header_image?: string;
  metacritic_score?: number;
  platforms?: { windows?: boolean; mac?: boolean; linux?: boolean };
}

interface SpikeAlert {
  appid: string;
  name: string;
  current_players: number;
  previous_players: number;
  growth_pct: number;
  severity: "moderate" | "high" | "extreme";
  detected_at: string;
}

interface IndieGame {
  appid: string;
  name: string;
  header_image?: string;
  final_price?: number;
  indie_score?: number;
}

interface DashboardData {
  timestamp: string;
  release_radar: ReleaseEntry[];
  spike_alerts: SpikeAlert[];
  hype_leaderboard: HypeEntry[];
  indie_spotlight: IndieGame[];
  ai_market_summary: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function useGamingData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/gaming/api/intel/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
      setLastRefresh(new Date());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, 60_000);
    return () => clearInterval(t);
  }, [fetch_]);

  return { data, loading, error, refresh: fetch_, lastRefresh };
}

// ---------------------------------------------------------------------------
// Severity colours
// ---------------------------------------------------------------------------

const SEVERITY_COLOR: Record<string, string> = {
  moderate: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  high: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  extreme: "text-red-400 border-red-400/30 bg-red-400/10",
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function HypeBar({ score }: { score: number }) {
  const pct = Math.round(score);
  const color = pct >= 70 ? "bg-cyan-400" : pct >= 40 ? "bg-amber-400" : "bg-slate-500";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-mono text-text-secondary w-7 text-right">{pct}</span>
    </div>
  );
}

function SteamLink({ appid, children }: { appid: string; children: React.ReactNode }) {
  return (
    <a
      href={`https://store.steampowered.com/app/${appid}`}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-cyan-400 transition-colors"
    >
      {children}
    </a>
  );
}

function TimeAgo({ iso }: { iso: string }) {
  const d = new Date(iso);
  const diff = Math.round((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return <span>just now</span>;
  if (diff < 60) return <span>{diff}m ago</span>;
  return <span>{Math.round(diff / 60)}h ago</span>;
}

// ---------------------------------------------------------------------------
// Section: Hype Leaderboard
// ---------------------------------------------------------------------------

function HypeLeaderboard({ entries }: { entries: HypeEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entries : entries.slice(0, 8);

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        <h2 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">Hype Index</h2>
        <span className="ml-auto text-[10px] font-mono text-text-secondary/40">live · 15 min</span>
      </div>
      <div className="space-y-1.5">
        {visible.map((e, i) => (
          <div
            key={e.appid || e.name}
            className="glass-card !p-2.5 flex items-center gap-2.5 group cursor-default"
          >
            <span className="text-[11px] font-mono text-text-secondary/50 w-5 text-right shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <SteamLink appid={e.appid}>
                <p className="text-xs font-semibold text-text-primary truncate">{e.name}</p>
              </SteamLink>
              <HypeBar score={e.hype_score} />
            </div>
            <div className="hidden sm:flex gap-2 shrink-0 text-[10px] font-mono text-text-secondary/50">
              <span title="Steam">🎮 {Math.round(e.components.steam_score)}</span>
              <span title="Reddit">💬 {Math.round(e.components.reddit_score)}</span>
            </div>
          </div>
        ))}
      </div>
      {entries.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 w-full text-[11px] font-mono text-text-secondary/40 hover:text-cyan-400 transition-colors text-center"
        >
          {expanded ? "show less" : `+${entries.length - 8} more`}
        </button>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Release Radar
// ---------------------------------------------------------------------------

function ReleaseRadar({ entries }: { entries: ReleaseEntry[] }) {
  if (!entries.length) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-amber-400" />
        <h2 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">Coming Soon</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {entries.map((g) => (
          <SteamLink key={g.appid} appid={g.appid}>
            <div className="glass-card !p-0 overflow-hidden flex flex-col group">
              {g.header_image && (
                <div className="relative w-full aspect-[16/7] overflow-hidden">
                  <img
                    src={g.header_image}
                    alt={g.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-space-bg/90 to-transparent" />
                  <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-amber-400/20 border border-amber-400/40 text-amber-300 px-1.5 py-0.5 rounded">
                    {g.anticipation_score}/100
                  </span>
                </div>
              )}
              <div className="p-2.5">
                <p className="text-xs font-semibold text-text-primary truncate">{g.name}</p>
                <div className="flex gap-2 mt-1 text-[10px] font-mono text-text-secondary/50">
                  {g.metacritic_score && <span>MC {g.metacritic_score}</span>}
                  {g.platforms?.windows && <span>Win</span>}
                  {g.platforms?.mac && <span>Mac</span>}
                </div>
              </div>
            </div>
          </SteamLink>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Spike Alerts
// ---------------------------------------------------------------------------

function SpikeAlerts({ alerts }: { alerts: SpikeAlert[] }) {
  if (!alerts.length) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-red-400" />
        <h2 className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">Player Spikes</h2>
        <span className="ml-1 text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full">
          {alerts.length}
        </span>
      </div>
      <div className="space-y-2">
        {alerts.map((a) => (
          <div key={a.appid} className={`glass-card !p-2.5 border ${SEVERITY_COLOR[a.severity]}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <SteamLink appid={a.appid}>
                  <p className="text-xs font-bold truncate">{a.name}</p>
                </SteamLink>
                <div className="flex gap-3 mt-1 text-[10px] font-mono opacity-70">
                  <span>{a.previous_players.toLocaleString()} → {a.current_players.toLocaleString()}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-sm font-mono font-bold">+{Math.round(a.growth_pct)}%</span>
                <p className="text-[10px] font-mono uppercase opacity-70">{a.severity}</p>
              </div>
            </div>
            <p className="text-[10px] font-mono opacity-40 mt-1">
              <TimeAgo iso={a.detected_at} />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Indie Spotlight
// ---------------------------------------------------------------------------

function IndieSpotlight({ entries }: { entries: IndieGame[] }) {
  if (!entries.length) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-purple-400" />
        <h2 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">Indie Spotlight</h2>
        <span className="ml-auto text-[10px] font-mono text-text-secondary/40">new · low coverage</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {entries.map((g) => (
          <SteamLink key={g.appid} appid={g.appid}>
            <div className="glass-card !p-0 overflow-hidden group">
              {g.header_image ? (
                <div className="w-full aspect-video overflow-hidden">
                  <img
                    src={g.header_image}
                    alt={g.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                  />
                </div>
              ) : (
                <div className="w-full aspect-video bg-purple-900/20 flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-purple-400/40" />
                </div>
              )}
              <div className="p-2">
                <p className="text-[11px] font-semibold text-text-primary line-clamp-2 leading-tight">{g.name}</p>
                {g.final_price != null && (
                  <p className="text-[10px] font-mono text-purple-400/70 mt-0.5">
                    {g.final_price === 0 ? "Free" : `$${(g.final_price / 100).toFixed(2)}`}
                  </p>
                )}
              </div>
            </div>
          </SteamLink>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: AI Summary
// ---------------------------------------------------------------------------

function MarketSummary({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const preview = text.slice(0, 180);

  return (
    <section className="glass-card !p-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart2 className="w-4 h-4 text-cyan-400/70" />
        <h2 className="text-xs font-mono font-bold text-cyan-400/70 uppercase tracking-widest">Market Briefing</h2>
      </div>
      <p className="text-[12px] leading-relaxed text-text-secondary">
        {open ? text : preview + (text.length > 180 ? "…" : "")}
      </p>
      {text.length > 180 && (
        <button
          onClick={() => setOpen(!open)}
          className="mt-2 text-[11px] font-mono text-cyan-400/50 hover:text-cyan-400 transition-colors flex items-center gap-1"
        >
          {open ? "collapse" : "read full briefing"}
          <ChevronRight className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`} />
        </button>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type Tab = "hype" | "releases" | "spikes" | "indie" | "briefing";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "hype",     label: "Hype",     icon: TrendingUp },
  { id: "releases", label: "Releases", icon: Clock },
  { id: "spikes",   label: "Spikes",   icon: Zap },
  { id: "indie",    label: "Indie",    icon: Star },
  { id: "briefing", label: "Brief",    icon: BarChart2 },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function GamingDashboard() {
  const { data, loading, error, refresh, lastRefresh } = useGamingData();
  const [tab, setTab] = useState<Tab>("releases");

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-cyan-400 animate-pulse" />
          <p className="text-xs font-mono text-text-secondary">loading intel…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-xs font-mono text-text-secondary">Gaming intel service unavailable</p>
          <button onClick={refresh} className="text-[11px] font-mono text-cyan-400/60 hover:text-cyan-400 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> retry
          </button>
        </div>
      </div>
    );
  }

  const spikeCount = data.spike_alerts?.length ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Gamepad2 className="w-5 h-5 text-cyan-400" />
          <div>
            <h1 className="text-sm font-mono font-bold text-text-primary uppercase tracking-widest">
              Gaming Intel
            </h1>
            {lastRefresh && (
              <p className="text-[10px] font-mono text-text-secondary/30">
                updated <TimeAgo iso={lastRefresh.toISOString()} />
              </p>
            )}
          </div>
        </div>
        <button
          onClick={refresh}
          className="p-2 rounded-lg hover:bg-white/5 text-text-secondary/40 hover:text-cyan-400 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: "Tracked", value: data.hype_leaderboard?.length ?? 0, color: "text-cyan-400" },
          { label: "Releases", value: data.release_radar?.length ?? 0, color: "text-amber-400" },
          { label: "Spikes", value: spikeCount, color: spikeCount > 0 ? "text-red-400" : "text-text-secondary/40" },
          { label: "Indie", value: data.indie_spotlight?.length ?? 0, color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="glass-card !p-2.5 text-center">
            <p className={`text-base font-mono font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-mono text-text-secondary/40 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-5 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-mono uppercase tracking-wider whitespace-nowrap shrink-0 border-b-2 transition-colors ${
              tab === id
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-text-secondary/40 hover:text-text-secondary"
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
            {id === "spikes" && spikeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500/30 text-red-400 text-[9px] flex items-center justify-center font-bold">
                {spikeCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-6">
        {tab === "hype"     && <HypeLeaderboard entries={data.hype_leaderboard ?? []} />}
        {tab === "releases" && (
          data.release_radar?.length
            ? <ReleaseRadar entries={data.release_radar} />
            : <p className="text-xs font-mono text-text-secondary/40 text-center py-8">No upcoming releases data</p>
        )}
        {tab === "spikes" && (
          spikeCount > 0
            ? <SpikeAlerts alerts={data.spike_alerts} />
            : <div className="text-center py-10">
                <Users className="w-6 h-6 text-text-secondary/20 mx-auto mb-2" />
                <p className="text-xs font-mono text-text-secondary/40">No spikes detected</p>
                <p className="text-[10px] font-mono text-text-secondary/20 mt-1">needs 2+ snapshots (~1h)</p>
              </div>
        )}
        {tab === "indie"    && (
          data.indie_spotlight?.length
            ? <IndieSpotlight entries={data.indie_spotlight} />
            : <p className="text-xs font-mono text-text-secondary/40 text-center py-8">No indie data</p>
        )}
        {tab === "briefing" && <MarketSummary text={data.ai_market_summary ?? ""} />}
      </div>
    </div>
  );
}
