"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import {
  X,
  Sun,
  Zap,
  Satellite,
  Radio,
  Sparkles,
  Camera,
  Moon,
  Info,
  Map,
} from "lucide-react";
import { useSpaceProData } from "@/lib/space-pro-data";
import { getSunTimes, getMoonPhase } from "@/lib/sunmoon";
import GameWatchlist from "@/components/GameWatchlist";
import dynamic from "next/dynamic";

const SpaceTrackerModal = dynamic(() => import("./SpaceTrackerModal"), { ssr: false });

interface SpaceProDrawerProps {
  open: boolean;
  onClose: () => void;
  persistent?: boolean;
}

const INFO_TEXTS_HR: Record<string, string> = {
  solar:
    "Kp indeks mjeri geomagnetsku aktivnost Zemlje (0-9). Viši = jača magnetska oluja i veća šansa za auroru.",
  flare:
    "Solarna baklja je iznenadni bljesak na Suncu. Klase: A (slaba), B, C, M, X (najjača).",
  wind: "Tok nabijenih čestica sa Sunca. Normalna brzina ~400 km/s.",
  asteroids:
    "Objekti blizu Zemlje praćeni od NASA-e. LD = Lunarna Distanca (~384,400 km).",
  iss: "Međunarodna svemirska postaja kruži Zemljom na ~420 km visine brzinom ~27,600 km/h.",
  deepspace:
    "NASA-ina mreža antena koja komunicira sa sondama u dubokom svemiru.",
  cosmic:
    "Gravitacijski valovi = valovi u prostorvremenu. FRB = misteriozni kratki radio signali iz svemira.",
  apod: "NASA svaki dan objavi novu astronomsku sliku s objašnjenjem.",
  light:
    "Faze Mjeseca i dnevno svjetlo za vašu lokaciju.",
};

const INFO_TEXTS_EN: Record<string, string> = {
  solar:
    "Kp index measures Earth's geomagnetic activity (0-9). Higher = stronger magnetic storm and greater aurora chance.",
  flare:
    "A solar flare is a sudden energy burst on the Sun. Classes: A (weak), B, C, M, X (strongest).",
  wind: "Stream of charged particles from the Sun. Normal speed ~400 km/s.",
  asteroids:
    "Near-Earth objects tracked by NASA. LD = Lunar Distance (~384,400 km).",
  iss: "The International Space Station orbits Earth at ~420 km altitude at ~27,600 km/h.",
  deepspace:
    "NASA's antenna network that communicates with probes in deep space.",
  cosmic:
    "Gravitational waves = ripples in spacetime. FRB = mysterious short radio signals from space.",
  apod: "NASA publishes a new astronomical image with explanation every day.",
  light:
    "Moon phases and daylight hours for your location.",
};

function KpGauge({ value }: { value: number }) {
  const color =
    "#00cfff";
  const pct = Math.min((value / 9) * 100, 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono font-bold" style={{ color }}>
        Kp {value}
      </span>
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </span>
  );
}

type DataQuality = "live" | "delayed" | "estimated";

function QualityBadge({ quality, source, updatedAt }: { quality: DataQuality; source?: string; updatedAt?: string }) {
  const cfg = {
    live:      { dot: "bg-green-400 animate-pulse", label: "LIVE",  text: "text-green-400" },
    delayed:   { dot: "bg-yellow-400",              label: "~15min", text: "text-yellow-400" },
    estimated: { dot: "bg-white/30",                label: "EST",   text: "text-text-secondary/60" },
  }[quality];

  let timeLabel = "";
  if (updatedAt) {
    try {
      const d = new Date(updatedAt);
      const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
      if (!isNaN(diffMin)) timeLabel = diffMin < 2 ? "" : `${diffMin}m ago`;
    } catch {}
  }

  return (
    <div className="flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span className={`text-[9px] font-mono ${cfg.text}`}>{cfg.label}</span>
      {(timeLabel || source) && (
        <span className="text-[8px] font-mono text-text-secondary/30">
          {timeLabel}{timeLabel && source ? " · " : ""}{source}
        </span>
      )}
    </div>
  );
}

function TelemetryRail({ data }: { data: import("@/lib/space-pro-data").DashboardData }) {
  const items: { label: string; value: string; quality: DataQuality }[] = [];

  if (data.iss) {
    items.push({ label: "ISS", value: `${data.iss.altitude}km ↑`, quality: "live" });
  }
  if (data.solar) {
    const kpColor = data.solar.kp_index >= 5 ? "⚠ " : "";
    items.push({ label: "Kp", value: `${kpColor}${data.solar.kp_index} · ${data.solar.flare_class}`, quality: "live" });
  }
  if (data.neo_closest) {
    items.push({ label: "NEO", value: `${data.neo_closest.distance_ld.toFixed(1)} LD`, quality: "estimated" });
  }
  if (data.next_launch) {
    const h = data.next_launch.t_minus_hours;
    const tLabel = h == null ? "TBD" : h < 0 ? "launched" : h < 24 ? `T-${Math.round(h)}h` : `T-${Math.round(h / 24)}d`;
    items.push({ label: "LAUNCH", value: tLabel, quality: "estimated" });
  }
  if (data.dsn_active != null) {
    items.push({ label: "DSN", value: `${data.dsn_active} active`, quality: "delayed" });
  }

  if (items.length === 0) return null;

  return (
    <div className="mx-4 mb-3 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 min-w-max">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 shrink-0"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              item.quality === "live" ? "bg-green-400 animate-pulse" :
              item.quality === "delayed" ? "bg-yellow-400" : "bg-white/30"
            }`} />
            <span className="text-[9px] font-mono text-text-secondary/60 uppercase tracking-wider">{item.label}</span>
            <span className="text-[9px] font-mono text-text-primary font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoToggle({
  id,
  expandedInfo,
  setExpandedInfo,
}: {
  id: string;
  expandedInfo: string | null;
  setExpandedInfo: (id: string | null) => void;
}) {
  return (
    <button
      onClick={() => setExpandedInfo(expandedInfo === id ? null : id)}
      className="p-1 text-text-secondary hover:text-accent-cyan transition-colors cursor-pointer"
      aria-label="Info"
    >
      <Info className="w-3.5 h-3.5" />
    </button>
  );
}

function InfoPanel({ id, expandedInfo, isEn }: { id: string; expandedInfo: string | null; isEn: boolean }) {
  const INFO_TEXTS = isEn ? INFO_TEXTS_EN : INFO_TEXTS_HR;
  if (expandedInfo !== id || !INFO_TEXTS[id]) return null;
  return (
    <div className="glass-card p-2.5 text-xs text-text-secondary leading-relaxed !hover:transform-none">
      {INFO_TEXTS[id]}
    </div>
  );
}

// Zagreb, HR — default location for sun/moon calculations
const DEFAULT_LAT = 45.815;
const DEFAULT_LON = 15.966;

export default function SpaceProDrawer({ open, onClose, persistent = false }: SpaceProDrawerProps) {
  const { data } = useSpaceProData();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);
  const [trackerMode, setTrackerMode] = useState<"iss" | "dsn" | "asteroids" | null>(null);
  const pathname = usePathname();
  const isEn = !pathname.startsWith("/hr");

  // Sun + moon data computed once on mount (changes only daily)
  const sunTimes  = getSunTimes(DEFAULT_LAT, DEFAULT_LON);
  const moonPhase = getMoonPhase();

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      // Don't close drawer when SpaceTrackerModal is open
      if (trackerMode !== null) return;
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose, trackerMode]
  );

  useEffect(() => {
    if (!open || persistent) return;
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, handleEscape, handleClickOutside, persistent]);

  if (!open && !persistent) return null;

  const auroraColors: Record<string, string> = {
    none: "#A7B3D1",
    low: "#34D399",
    moderate: "#FFCF6E",
    high: "#F87171",
    storm: "#EF4444",
  };

  // Persistent desktop sidebar
  if (persistent) {
    return (
      <>
        <div
          ref={drawerRef}
          className="h-full w-[320px] bg-space-bg/80 border-l border-white/10 overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-space-bg/90 backdrop-blur-md border-b border-white/10 px-4 py-3">
            <h2 className="font-heading text-base font-bold text-text-primary">
              Space Pro
            </h2>
            <p className="text-xs text-text-secondary font-mono">
              {isEn ? "// Live Telemetry" : "// Telemetrija uživo"}
            </p>
          </div>

          {/* Telemetry Rail */}
          <TelemetryRail data={data} />

          {/* Cards */}
          <div className="p-4 space-y-3">
            {renderCards()}
          </div>
        </div>

        {/* Space Tracker Modal — portalled to body to escape z-40 stacking context */}
        {trackerMode && typeof document !== "undefined" && createPortal(
          <SpaceTrackerModal
            mode={trackerMode}
            open={true}
            onClose={() => setTrackerMode(null)}
          />,
          document.body
        )}
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm drawer-backdrop" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 z-[60] h-full w-full sm:w-[400px] bg-space-bg/95 backdrop-blur-xl border-l border-white/10 overflow-y-auto drawer-slide-in"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-space-bg/90 backdrop-blur-md border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-text-primary">
              Space Pro
            </h2>
            <p className="text-xs text-text-secondary font-mono">
              {isEn ? "// Live Telemetry" : "// Telemetrija uživo"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Rail */}
        <TelemetryRail data={data} />

        {/* Cards */}
        <div className="p-5 space-y-4">
          {renderCards()}
        </div>
      </div>

      {/* Space Tracker Modal */}
      {trackerMode && (
        <SpaceTrackerModal
          mode={trackerMode}
          open={true}
          onClose={() => setTrackerMode(null)}
        />
      )}
    </>
  );

  function renderCards() {
    return (
      <>
          {/* 1. Solar Activity */}
          <div className="glass-card p-4 space-y-3 !hover:transform-none">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-text-primary">
                {isEn ? "Solar Activity" : "Sunčeva Aktivnost"}
              </h3>
              <InfoToggle id="solar" expandedInfo={expandedInfo} setExpandedInfo={setExpandedInfo} />
              <div className="ml-auto">
                <QualityBadge quality="live" source="NOAA SWPC" updatedAt={data.solar?.updated} />
              </div>
            </div>
            <InfoPanel id="solar" expandedInfo={expandedInfo} isEn={isEn} />
            <KpGauge value={data.solar?.kp_index ?? 0} />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-text-secondary">{isEn ? "Flare" : "Baklja"}</span>
                <p className="font-mono font-bold text-accent-amber">
                  {data.solar?.flare_class ?? "—"}
                </p>
              </div>
              <div>
                <span className="text-text-secondary">{isEn ? "Solar Wind" : "Sunčev Vjetar"}</span>
                <p className="font-mono font-bold text-text-primary">
                  {data.solar?.solar_wind ?? 0} km/s
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-text-secondary">Aurora</span>
                <p
                  className="font-mono font-bold capitalize"
                  style={{
                    color: auroraColors[data.solar?.aurora_chance ?? "none"] || "#A7B3D1",
                  }}
                >
                  {data.solar?.aurora_chance ?? "none"}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Asteroids Today */}
          <div className="glass-card p-4 space-y-3 !hover:transform-none">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent-amber" />
              <h3 className="text-sm font-semibold text-text-primary">
                {isEn ? "Today's Asteroids" : "Asteroidi Danas"}
              </h3>
              <InfoToggle id="asteroids" expandedInfo={expandedInfo} setExpandedInfo={setExpandedInfo} />
              <div className="ml-auto">
                <QualityBadge quality="estimated" source="NASA NeoWs" />
              </div>
            </div>
            <InfoPanel id="asteroids" expandedInfo={expandedInfo} isEn={isEn} />
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-text-secondary">{isEn ? "Count" : "Broj"}</span>
                <p className="font-mono font-bold text-text-primary text-lg">
                  {data.neo_count ?? 0}
                </p>
              </div>
              <div>
                <span className="text-text-secondary">{isEn ? "Closest" : "Najbliži"}</span>
                <p className="font-mono font-bold text-accent-cyan">
                  {data.neo_closest?.distance_ld ?? "—"} LD
                </p>
                <p className="text-text-secondary truncate">
                  {data.neo_closest?.name ?? "—"}
                </p>
              </div>
              <div>
                <span className="text-text-secondary">{isEn ? "Hazardous" : "Opasni"}</span>
                <p
                  className={`font-mono font-bold text-lg ${
                    data.neo_hazardous ?? 0 > 0
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {data.neo_hazardous ?? 0}
                </p>
              </div>
            </div>
            <button
              onClick={() => setTrackerMode("asteroids")}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-400/10 border border-amber-400/20 text-xs font-mono text-accent-amber hover:bg-amber-400/20 transition-colors cursor-pointer"
            >
              <Map className="w-3.5 h-3.5" />
              {isEn ? "Show on Map" : "Prikaži na Karti"}
            </button>
          </div>

          {/* 3. ISS Live */}
          <div className="glass-card p-4 space-y-3 !hover:transform-none">
            <div className="flex items-center gap-2">
              <Satellite className="w-4 h-4 text-accent-cyan" />
              <h3 className="text-sm font-semibold text-text-primary">
                {isEn ? "ISS Live" : "ISS Trenutno"}
              </h3>
              <InfoToggle id="iss" expandedInfo={expandedInfo} setExpandedInfo={setExpandedInfo} />
              <div className="ml-auto">
                <QualityBadge quality="live" source="wheretheiss.at" />
              </div>
            </div>
            <InfoPanel id="iss" expandedInfo={expandedInfo} isEn={isEn} />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-text-secondary">{isEn ? "Altitude" : "Visina"}</span>
                <p className="font-mono font-bold text-text-primary">
                  {data.iss?.altitude ?? 420} km
                </p>
              </div>
              <div>
                <span className="text-text-secondary">{isEn ? "Speed" : "Brzina"}</span>
                <p className="font-mono font-bold text-text-primary">
                  {(data.iss?.speed ?? 0).toLocaleString()} km/h
                </p>
              </div>
              <div>
                <span className="text-text-secondary">{isEn ? "Position" : "Pozicija"}</span>
                <p className="font-mono font-bold text-accent-cyan text-xs">
                  {(data.iss?.lat ?? 0).toFixed(1)}°, {(data.iss?.lon ?? 0).toFixed(1)}°
                </p>
              </div>
              <div>
                <span className="text-text-secondary">{isEn ? "Crew" : "Posada"}</span>
                <p className="font-mono font-bold text-text-primary">
                  {data.crew_count ?? 0}
                </p>
              </div>
            </div>
            <button
              onClick={() => setTrackerMode("iss")}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-xs font-mono text-cyan-400 hover:bg-cyan-400/20 transition-colors cursor-pointer"
            >
              <Map className="w-3.5 h-3.5" />
              {isEn ? "Show on Map" : "Prikaži na Karti"}
            </button>
          </div>

          {/* 4. Deep Space Network */}
          <div className="glass-card p-4 space-y-3 !hover:transform-none">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-text-primary">
                {isEn ? "Deep Space Network" : "Mreža Dubokog Svemira"}
              </h3>
              <InfoToggle id="deepspace" expandedInfo={expandedInfo} setExpandedInfo={setExpandedInfo} />
              <div className="ml-auto">
                <QualityBadge quality="delayed" source="NASA DSN" />
              </div>
            </div>
            <InfoPanel id="deepspace" expandedInfo={expandedInfo} isEn={isEn} />
            <div className="space-y-2">
              {([{name:"Voyager 1",distance:"24.5B km",status:"active"},{name:"JWST",distance:"1.5M km",status:"active"},{name:"Parker Solar",distance:"21M km",status:"active"}]).map((link) => (
                <div
                  key={link.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-text-primary">
                    {link.name}
                  </span>
                  <span className="text-text-secondary">{link.distance}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      link.status === "active"
                        ? "bg-green-400"
                        : "bg-gray-500"
                    }`}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setTrackerMode("dsn")}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-purple-400/10 border border-purple-400/20 text-xs font-mono text-purple-400 hover:bg-purple-400/20 transition-colors cursor-pointer"
            >
              <Map className="w-3.5 h-3.5" />
              {isEn ? "Show on Map" : "Prikaži na Karti"}
            </button>
          </div>

          {/* 5. Cosmic Events */}
          <div className="glass-card p-4 space-y-3 !hover:transform-none">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <h3 className="text-sm font-semibold text-text-primary">
                {isEn ? "Cosmic Events" : "Kozmički Događaji"}
              </h3>
              <InfoToggle id="cosmic" expandedInfo={expandedInfo} setExpandedInfo={setExpandedInfo} />
              <div className="ml-auto">
                <QualityBadge quality="estimated" source="LIGO/GCN" />
              </div>
            </div>
            <InfoPanel id="cosmic" expandedInfo={expandedInfo} isEn={isEn} />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-text-secondary">{isEn ? "Gravitational Waves" : "Gravitacijski Valovi"}</span>
                <p className="font-mono font-bold text-text-primary">
                  {"N/A"}
                </p>
              </div>
              <div>
                <span className="text-text-secondary">
                  {isEn ? "Fast Radio Bursts" : "Brzi Radio Bljeskovi"}
                </span>
                <p className="font-mono font-bold text-accent-cyan">
                  {2} {isEn ? "detected" : "detektirano"}
                </p>
              </div>
            </div>
          </div>

          {/* 6. Astronomy Picture of the Day */}
          <div className="glass-card p-4 space-y-3 !hover:transform-none">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-semibold text-text-primary">
                {isEn ? "Astronomy Picture of the Day" : "Astronomska Slika Dana"}
              </h3>
              <InfoToggle id="apod" expandedInfo={expandedInfo} setExpandedInfo={setExpandedInfo} />
              <div className="ml-auto">
                <StatusBadge label={isEn ? "Daily" : "Dnevno"} color="#A78BFA" />
              </div>
            </div>
            <InfoPanel id="apod" expandedInfo={expandedInfo} isEn={isEn} />
            {data.apod?.media_type === "image" && data.apod?.url && (
              <a href={data.apod.url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer hover:opacity-90 transition-opacity">
                <img src={data.apod.url} alt={data.apod.title} className="w-full h-auto rounded-lg max-h-48 object-cover" />
              </a>
            )}
            <div className="text-xs">
              <p className="font-semibold text-text-primary mb-1">
                {data.apod?.title ?? "—"}
              </p>
              <p className="text-text-secondary line-clamp-3">
                {data.apod?.explanation ?? "—"}
              </p>
            </div>
          </div>

          {/* 7. Light & Moon */}
          <div className="glass-card p-4 space-y-3 !hover:transform-none">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-yellow-200" />
              <h3 className="text-sm font-semibold text-text-primary">
                {isEn ? "Light & Moon" : "Svjetlost i Mjesec"}
              </h3>
              <InfoToggle id="light" expandedInfo={expandedInfo} setExpandedInfo={setExpandedInfo} />
              <div className="ml-auto">
                <StatusBadge label={isEn ? "Live" : "Uživo"} color="#34D399" />
              </div>
            </div>
            <InfoPanel id="light" expandedInfo={expandedInfo} isEn={isEn} />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-text-secondary">{isEn ? "Sunrise" : "Izlazak Sunca"}</span>
                <p className="font-mono font-bold text-accent-amber">
                  {sunTimes.sunrise}
                </p>
              </div>
              <div>
                <span className="text-text-secondary">{isEn ? "Sunset" : "Zalazak Sunca"}</span>
                <p className="font-mono font-bold text-orange-400">
                  {sunTimes.sunset}
                </p>
              </div>
              <div>
                <span className="text-text-secondary">{isEn ? "Moon Phase" : "Faza Mjeseca"}</span>
                <p className="font-mono font-bold text-text-primary">
                  {moonPhase.emoji} {moonPhase.name}
                </p>
              </div>
              <div>
                <span className="text-text-secondary">{isEn ? "Illumination" : "Osvijetljenost"}</span>
                <p className="font-mono font-bold text-yellow-200">
                  {moonPhase.emoji} {moonPhase.illumination}%
                </p>
              </div>
            </div>
            <p className="text-xs text-text-secondary font-mono">
              📍 Zagreb, HR — {sunTimes.dayLengthH > 0
                ? `${Math.floor(sunTimes.dayLengthH)}h ${Math.round((sunTimes.dayLengthH % 1) * 60)}min ${isEn ? "of daylight" : "dnevnog svjetla"}`
                : isEn ? "polar conditions" : "polarne prilike"}
            </p>
          </div>

          {/* 7. Game Radar */}
          <div className="glass-card p-4 space-y-3 !hover:transform-none">
            <GameWatchlist />
          </div>
      </>
    );
  }
}
