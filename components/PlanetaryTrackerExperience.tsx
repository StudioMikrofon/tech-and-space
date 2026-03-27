"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CloudRain,
  ChevronRight,
  X,
  Gauge,
  Globe2,
  MoonStar,
  Orbit,
  Radio,
  Rocket,
  Satellite,
  Sun,
  Waves,
  Wind,
} from "lucide-react";
import JarvisScene from "./JarvisScene";
import type { FocusTarget, JarvisSceneHandle } from "./JarvisScene";
import { useSpaceProData } from "@/lib/space-pro-data";
import { PROBES_DATASET } from "@/lib/space-tracker-data";
import {
  buildInsight,
  buildStormSystemsFromGrid,
  sampleWeather,
  sampleWeatherFromGrid,
  type WeatherGridSnapshot,
  type WeatherSample,
} from "@/modules/weather/weatherField";

const DEFAULT_ISS = {
  lat: 8,
  lon: -24,
  altitude: 420,
  speed: 27600,
  visibility: "daylight",
  timestamp: 0,
} as const;

const LABELS = {
  en: {
    weatherMode: "Earth Weather Mode",
    spaceMode: "Orbital Space Mode",
    weatherTitle: "Weather Tracker Pro",
    spaceTitle: "Space Tracker Pro",
    weatherSubtitle: "Live cloud decks, wind fields, precipitation bands, and pressure systems mapped onto the same globe.",
    spaceSubtitle: "Live ISS, near-Earth objects, launch telemetry, and deep-space focus controls on the shared engine.",
    navSpace: "Space",
    navWeather: "Weather",
    objects: "Objects",
    telemetry: "Telemetry",
    hideHud: "Hide HUD",
    close: "Close",
    wind: "Wind",
    clouds: "Clouds",
    cloudDeck: "Cloud Deck",
    pressure: "Pressure",
    storms: "Storms",
    noStorms: "No dominant storm cells",
    issOrbit: "ISS Orbit",
    closestNeo: "Closest NEO",
    noLock: "No lock",
    solar: "Solar",
    noFeed: "No feed",
    launchDsn: "Launch / DSN",
    standby: "Standby",
    active: "active",
    aiInsight: "AI Insight",
    trackerInsight: "Tracker Insight",
    syncing: "syncing",
    live: "live",
    liveGrid: "live grid",
    fallbackGrid: "fallback grid",
    gridSync: "grid sync",
    asteroidFeedPending: "Live asteroid feed pending",
    solarPending: "Solar telemetry pending",
    degraded: "degraded",
    earth: "Earth",
    moon: "Moon",
    sun: "Sun",
    goldstone: "Goldstone",
    probes: "Probes",
    noWeatherArticles: "",
    selectedLocked: "locked",
    spaceFeedSummary: "Live space feed active.",
    nearEarthTracked: "near-Earth objects tracked today",
    nextLaunch: "next launch",
    dsnActivity: "DSN activity",
  },
  hr: {
    weatherMode: "Zemaljski vremenski mod",
    spaceMode: "Orbitalni svemirski mod",
    weatherTitle: "Weather Tracker Pro",
    spaceTitle: "Space Tracker Pro",
    weatherSubtitle: "Live oblaci, vjetrovi, oborine i tlak renderirani na istoj Zemlji.",
    spaceSubtitle: "Live ISS, asteroidi blizu Zemlje, lansiranja i deep-space fokus na istom engineu.",
    navSpace: "Svemir",
    navWeather: "Vrijeme",
    objects: "Objekti",
    telemetry: "Podaci",
    hideHud: "Sakrij HUD",
    close: "Zatvori",
    wind: "Vjetar",
    clouds: "Oblaci",
    cloudDeck: "Naoblaka",
    pressure: "Tlak",
    storms: "Oluje",
    noStorms: "Nema dominantnih oluja",
    issOrbit: "ISS Orbita",
    closestNeo: "Najbliži NEO",
    noLock: "Nema lock",
    solar: "Sunce",
    noFeed: "Nema feeda",
    launchDsn: "Lansiranja / DSN",
    standby: "Čekanje",
    active: "aktivno",
    aiInsight: "AI Uvid",
    trackerInsight: "Tracker Uvid",
    syncing: "sinkronizacija",
    live: "live",
    liveGrid: "live grid",
    fallbackGrid: "fallback grid",
    gridSync: "sinkronizacija mreže",
    asteroidFeedPending: "Live asteroid feed još nije stigao",
    solarPending: "Solarna telemetrija još nije stigla",
    degraded: "degradirano",
    earth: "Zemlja",
    moon: "Mjesec",
    sun: "Sunce",
    goldstone: "Goldstone",
    probes: "Sonde",
    noWeatherArticles: "",
    selectedLocked: "zaključan",
    spaceFeedSummary: "Live svemirski feed aktivan.",
    nearEarthTracked: "objekata blizu Zemlje danas",
    nextLaunch: "sljedeće lansiranje",
    dsnActivity: "DSN aktivnost",
  },
} as const;

const OBJECT_LABELS_EN: Record<string, string> = {
  Lokacija: "Location",
  Antene: "Antennas",
  "Primarni dish": "Primary dish",
  "Aktivne misije": "Active missions",
  Signal: "Signal",
  Koordinate: "Coordinates",
  Visina: "Altitude",
  Brzina: "Speed",
  Pozicija: "Position",
  Inklinacija: "Inclination",
  Posada: "Crew",
  "Orbitalni period": "Orbital period",
  Tip: "Type",
  Masa: "Mass",
  Radijus: "Radius",
  "Udaljenost od Sunca": "Distance from Sun",
  "Broj mjeseci": "Moon count",
  Temperatura: "Temperature",
  "Udaljenost od Zemlje": "Distance from Earth",
  Gravitacija: "Gravity",
  Luminozitet: "Luminosity",
  Starost: "Age",
  "Sunčev vjetar": "Solar wind",
  "Korona temp.": "Corona temp.",
  Promjer: "Diameter",
  Udaljenost: "Distance",
  "Udaljenost (km)": "Distance (km)",
  Opasan: "Hazardous",
  "Najbliži prolaz": "Closest approach",
  "Energija udara": "Impact energy",
  "Kut prilaza": "Approach angle",
  Izvor: "Source",
  Misija: "Mission",
  Lansiranje: "Launch",
  Status: "Status",
  "Zadnji signal": "Last signal",
};

const OBJECT_VALUES_EN: Record<string, string> = {
  "Kameni planet": "Rocky planet",
  "Plinski div": "Gas giant",
  "Ledeni div": "Ice giant",
  "Prirodni satelit": "Natural satellite",
  "G2V (žuta patuljica)": "G2V (yellow dwarf)",
  Aktivan: "Active",
  Neaktivan: "Idle",
  Izgubljen: "Lost",
  "DA ⚠": "YES ⚠",
  DA: "YES",
  NE: "NO",
  SAD: "USA",
  Španjolska: "Spain",
  Australija: "Australia",
};

function localizeObjectMeta(
  object: { type: string; name: string; data: Record<string, string> } | null,
  lang: "en" | "hr",
) {
  if (!object) return null;
  if (lang === "hr") return object;

  const typeMap: Record<string, string> = {
    Mjesec: "Moon",
    Zvijezda: "Star",
    Sonda: "Probe",
    Planet: "Planet",
    Asteroid: "Asteroid",
    DSN: "DSN",
    ISS: "ISS",
  };

  const nextData: Record<string, string> = {};
  for (const [label, value] of Object.entries(object.data)) {
    const localizedValue = OBJECT_VALUES_EN[value] || value.replace(" članova", " crew");
    nextData[OBJECT_LABELS_EN[label] || label] = localizedValue;
  }

  return {
    ...object,
    type: typeMap[object.type] || object.type,
    data: nextData,
  };
}

function formatDirection(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return dirs[index];
}

function TelemetryPanel({
  title,
  value,
  detail,
  icon,
  className = "",
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-cyan-400/15 bg-slate-950/35 px-3 py-2 backdrop-blur-sm ${className}`}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-cyan-200/55 font-mono">
        {icon}
        <span>{title}</span>
      </div>
      <div className="mt-1 text-lg font-semibold text-cyan-50">{value}</div>
      <div className="text-[11px] text-slate-300/60 font-mono">{detail}</div>
    </div>
  );
}

function FocusChip({
  label,
  onClick,
  active = false,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors ${
        active
          ? "border-cyan-300/45 bg-cyan-400/16 text-cyan-100"
          : "border-white/10 bg-slate-950/35 text-slate-300/72 hover:border-cyan-400/30 hover:text-cyan-100"
      }`}
    >
      {label}
    </button>
  );
}

export default function PlanetaryTrackerExperience({
  mode,
  lang = "en",
}: {
  mode: "space" | "weather";
  lang?: "en" | "hr";
}) {
  const sceneRef = useRef<JarvisSceneHandle>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [viewport, setViewport] = useState({ width: 1200, height: 900 });
  const [hudExpanded, setHudExpanded] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const [tooltip, setTooltip] = useState<WeatherSample | null>(null);
  const [focusSample, setFocusSample] = useState<WeatherSample>(() => sampleWeather(18, -42));
  const [sampleLoading, setSampleLoading] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);
  const [weatherGrid, setWeatherGrid] = useState<WeatherGridSnapshot | null>(null);
  const [selectedObject, setSelectedObject] = useState<{ type: string; name: string; data: Record<string, string> } | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"none" | "objects" | "telemetry">("none");
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copy = LABELS[lang];
  const trackerBase = lang === "hr" ? "/hr" : "";

  const { data: spaceData, loading: spaceLoading, error: spaceError } = useSpaceProData(mode === "space" ? 30000 : null);

  const stableNeoData = useMemo(
    () => spaceData.neo_objects,
    [spaceData.neo_objects?.length, spaceData.neo_objects?.[0]?.id],
  );

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      const landscape = window.innerWidth > window.innerHeight;
      setIsMobile(mobile);
      setIsLandscape(mobile && landscape);
      setHudVisible(!mobile);
      if (!mobile) setHudExpanded(false);
      if (!mobile) setMobilePanel("none");
      setViewport({ width: window.innerWidth, height: Math.max(window.innerHeight - 56, 600) });
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const touchHud = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setHudVisible(true);
    if (isMobile) {
      hideTimerRef.current = setTimeout(() => {
        setHudVisible(false);
        setHudExpanded(false);
      }, 5000);
    }
  };

  const fetchWeatherGrid = async () => {
    setGridLoading(true);
    try {
      const res = await fetch("/api/weather/grid", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json?.ok && json.data) {
        const nextGrid = json.data as WeatherGridSnapshot;
        setWeatherGrid(nextGrid);
        setFocusSample((current) => sampleWeatherFromGrid(nextGrid, current.lat, current.lon));
        return;
      }
      throw new Error("Bad payload");
    } catch {
      setWeatherGrid(null);
    } finally {
      setGridLoading(false);
    }
  };

  const fetchLiveSample = async (lat: number, lon: number, showTooltip = true) => {
    setSampleLoading(true);
    try {
      const res = await fetch(`/api/weather/sample?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json?.ok && json.data) {
        setFocusSample(json.data as WeatherSample);
        if (showTooltip) setTooltip(json.data as WeatherSample);
        return;
      }
      throw new Error("Bad payload");
    } catch {
      const fallback = sampleWeatherFromGrid(weatherGrid, lat, lon);
      setFocusSample(fallback);
      if (showTooltip) setTooltip(fallback);
    } finally {
      setSampleLoading(false);
    }
  };

  useEffect(() => {
    sceneRef.current?.focusOn({ type: "earth" });
    setTooltip(null);
    setSelectedObject(null);
    setMobilePanel("none");
    setHudVisible(!isMobile);
    if (mode === "weather") {
      void fetchWeatherGrid();
      void fetchLiveSample(18, -42, false);
    }
  }, [mode, isMobile]);

  useEffect(() => {
    if (mode !== "weather") return;
    const timer = setInterval(() => {
      void fetchWeatherGrid();
    }, 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, [mode]);

  const handleEarthSample = (sample: WeatherSample) => {
    void fetchLiveSample(sample.lat, sample.lon);
    touchHud();
  };

  const handleInteraction = () => {
    touchHud();
  };

  const handleObjectSelect = (obj: { type: string; name: string; data: Record<string, string> } | null) => {
    setSelectedObject(obj);
    if (isMobile && obj) setMobilePanel("objects");
    touchHud();
  };

  const focusTarget = (target: FocusTarget) => {
    sceneRef.current?.focusOn(target);
    if (isMobile) setMobilePanel("objects");
    touchHud();
  };

  const title = mode === "weather" ? copy.weatherTitle : copy.spaceTitle;
  const subtitle = mode === "weather"
    ? copy.weatherSubtitle
    : copy.spaceSubtitle;

  const activeStorms = useMemo(() => buildStormSystemsFromGrid(weatherGrid), [weatherGrid]);
  const insight = useMemo(() => buildInsight(focusSample, activeStorms), [focusSample, activeStorms]);
  const showCornerHud = !isMobile || hudExpanded || mobilePanel === "telemetry";
  const displayObject = useMemo(() => localizeObjectMeta(selectedObject, lang), [selectedObject, lang]);

  const spaceInsight = useMemo(() => {
    if (displayObject) {
      const primary = Object.entries(displayObject.data).slice(0, 3);
      const summary = primary.map(([label, value]) => `${label}: ${value}`).join(" · ");
      return `${displayObject.name} ${copy.selectedLocked}. ${summary}`;
    }

    const launch = spaceData.next_launch?.name;
    const neoCount = spaceData.neo_count ?? stableNeoData?.length ?? 0;
    const dsn = spaceData.dsn_active ?? 0;
    return `${copy.spaceFeedSummary} ${neoCount} ${copy.nearEarthTracked}${launch ? `, ${copy.nextLaunch} ${launch}` : ""}, ${copy.dsnActivity} ${dsn}/3.`;
  }, [displayObject, spaceData.next_launch?.name, spaceData.neo_count, spaceData.dsn_active, stableNeoData?.length, copy]);

  const focusChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; target: FocusTarget }> = [
      { id: "earth", label: copy.earth, target: { type: "earth" } },
      { id: "iss", label: "ISS", target: { type: "iss" } },
      { id: "moon", label: copy.moon, target: { type: "moon" } },
      { id: "sun", label: copy.sun, target: { type: "sun" } },
      { id: "dsn-goldstone", label: copy.goldstone, target: { type: "dsn", id: "dsn-goldstone" } },
    ];

    for (const asteroid of (stableNeoData ?? []).slice(0, 4)) {
      chips.push({
        id: asteroid.id,
        label: asteroid.name,
        target: { type: "asteroid", id: asteroid.id },
      });
    }

    for (const probe of PROBES_DATASET.entries.slice(0, 3)) {
      chips.push({
        id: probe.id,
        label: probe.name,
        target: { type: "probe", id: probe.id },
      });
    }

    return chips;
  }, [stableNeoData, copy]);

  const activeObjectName = displayObject?.name;
  const useMobileSpaceSplit = isMobile && mode === "space";
  const mobileSceneWidth = isLandscape ? Math.round(viewport.width * 0.58) : viewport.width;
  const mobileSceneHeight = isLandscape
    ? viewport.height
    : Math.min(Math.max(Math.round(viewport.height * 0.42), 300), 430);

  if (useMobileSpaceSplit) {
    return (
      <section className="relative min-h-[calc(100dvh-3rem)] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_42%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(2,6,23,0.9))]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.1),transparent_28%),radial-gradient(circle_at_80%_12%,rgba(56,189,248,0.08),transparent_24%)] pointer-events-none" />
        <div className={`relative z-10 flex min-h-[calc(100dvh-3rem)] ${isLandscape ? "flex-row" : "flex-col"}`}>
          <div className={`relative shrink-0 overflow-hidden border-white/10 ${isLandscape ? "w-[58%] border-r" : "h-[42dvh] border-b"}`}>
            <JarvisScene
              ref={sceneRef}
              width={mobileSceneWidth}
              height={mobileSceneHeight}
              issData={spaceData.iss ?? DEFAULT_ISS}
              neoData={stableNeoData}
              crewCount={spaceData.crew_count}
              trackerMode={mode}
              weatherGrid={weatherGrid}
              onSelectObject={handleObjectSelect}
              onInteraction={handleInteraction}
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 p-4">
              <div className="max-w-md">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-slate-950/55 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-200/65">
                  <Orbit className="h-3.5 w-3.5" />
                  <span>{copy.spaceMode}</span>
                </div>
                <h1 className="mt-2 font-heading text-2xl font-bold text-white">{title}</h1>
              </div>
            </div>
          </div>

          <div className={`relative min-h-0 flex-1 overflow-y-auto bg-slate-950/72 backdrop-blur-md ${isLandscape ? "w-[42%]" : ""}`}>
            <div className="space-y-5 px-4 py-4 pb-8">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 p-1">
                <Link
                  href={`${trackerBase}/space-tracker`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-cyan-400/15 px-3 py-2 text-xs font-mono text-cyan-100"
                >
                  <Orbit className="h-3.5 w-3.5" />
                  {copy.navSpace}
                </Link>
                <Link
                  href={`${trackerBase}/weather-tracker`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-mono text-slate-300/72"
                >
                  <CloudRain className="h-3.5 w-3.5" />
                  {copy.navWeather}
                </Link>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-200/55">{copy.objects}</div>
                {focusChips.slice(0, 5).map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => focusTarget(chip.target)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left ${
                      activeObjectName === chip.label ? "border-cyan-400/30 bg-cyan-400/10" : "border-white/8 bg-slate-900/70"
                    }`}
                  >
                    <span className="text-sm text-white">{chip.label}</span>
                    <ChevronRight className="h-4 w-4 text-cyan-200/60" />
                  </button>
                ))}
              </div>

              {!!stableNeoData?.length && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-200/55">NEO</div>
                  {stableNeoData.slice(0, 8).map((asteroid) => (
                    <button
                      key={asteroid.id}
                      onClick={() => focusTarget({ type: "asteroid", id: asteroid.id })}
                      className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left ${
                        activeObjectName === asteroid.name ? "border-cyan-400/30 bg-cyan-400/10" : "border-white/8 bg-slate-900/70"
                      }`}
                    >
                      <div>
                        <div className="text-sm text-white">{asteroid.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{asteroid.distance_ld.toFixed(2)} LD</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-cyan-200/60" />
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-200/55">{copy.probes}</div>
                {PROBES_DATASET.entries.slice(0, 6).map((probe) => (
                  <button
                    key={probe.id}
                    onClick={() => focusTarget({ type: "probe", id: probe.id })}
                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left ${
                      activeObjectName === probe.name ? "border-cyan-400/30 bg-cyan-400/10" : "border-white/8 bg-slate-900/70"
                    }`}
                  >
                    <span className="text-sm text-white">{probe.name}</span>
                    <ChevronRight className="h-4 w-4 text-cyan-200/60" />
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-200/55">{copy.telemetry}</div>
                <TelemetryPanel
                  title={copy.issOrbit}
                  value={`${Math.round(spaceData.iss?.speed ?? DEFAULT_ISS.speed).toLocaleString()} km/h`}
                  detail={`${(spaceData.iss?.lat ?? DEFAULT_ISS.lat).toFixed(2)}°, ${(spaceData.iss?.lon ?? DEFAULT_ISS.lon).toFixed(2)}°${spaceLoading ? ` · ${copy.syncing}` : ` · ${copy.live}`}`}
                  icon={<Satellite className="h-3.5 w-3.5" />}
                />
                <TelemetryPanel
                  title={copy.closestNeo}
                  value={spaceData.neo_closest ? `${spaceData.neo_closest.distance_ld.toFixed(2)} LD` : copy.noLock}
                  detail={spaceData.neo_closest ? `${spaceData.neo_closest.name} · ${(spaceData.neo_closest.speed_kmh / 1000).toFixed(1)}k km/h` : copy.asteroidFeedPending}
                  icon={<Orbit className="h-3.5 w-3.5" />}
                />
                <TelemetryPanel
                  title={copy.solar}
                  value={spaceData.solar ? `Kp ${spaceData.solar.kp_index}` : copy.noFeed}
                  detail={spaceData.solar ? `${spaceData.solar.flare_class} flare · ${spaceData.solar.solar_wind} km/s` : copy.solarPending}
                  icon={<Sun className="h-3.5 w-3.5" />}
                />
                <TelemetryPanel
                  title={copy.launchDsn}
                  value={spaceData.next_launch ? copy.live : copy.standby}
                  detail={spaceData.next_launch ? `${spaceData.next_launch.name} · ${spaceData.dsn_active ?? 0}/3 DSN` : `${spaceData.dsn_active ?? 0}/3 DSN active${spaceError ? ` · ${copy.degraded}` : ""}`}
                  icon={<Rocket className="h-3.5 w-3.5" />}
                />
              </div>

              {displayObject && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-200/55">{displayObject.type}</div>
                  <div className="rounded-2xl border border-cyan-400/18 bg-slate-900/80 px-3 py-3 space-y-2">
                    <div className="text-base font-semibold text-white">{displayObject.name}</div>
                    {Object.entries(displayObject.data).slice(0, 8).map(([label, value]) => (
                      <div key={label} className="flex items-start justify-between gap-3 text-sm">
                        <span className="text-slate-400">{label}</span>
                        <span className="text-right text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-cyan-400/12 bg-slate-950/28 px-4 py-3 text-sm text-slate-100/78">
                <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/50 font-mono">{copy.trackerInsight}</div>
                <p className="mt-1">{spaceInsight}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[calc(100dvh-3rem)] sm:min-h-[calc(100dvh-4rem)] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_42%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(2,6,23,0.9))]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.1),transparent_28%),radial-gradient(circle_at_80%_12%,rgba(56,189,248,0.08),transparent_24%)] pointer-events-none" />

      <div className="absolute inset-0 z-0">
        <JarvisScene
          ref={sceneRef}
          width={viewport.width}
          height={viewport.height}
          issData={spaceData.iss ?? DEFAULT_ISS}
          neoData={stableNeoData}
          crewCount={spaceData.crew_count}
          trackerMode={mode}
          weatherGrid={weatherGrid}
          onSelectObject={mode === "space" ? handleObjectSelect : undefined}
          onEarthSample={mode === "weather" ? handleEarthSample : undefined}
          onInteraction={handleInteraction}
        />
      </div>

      <div className="relative z-10 flex min-h-[calc(100dvh-3rem)] sm:min-h-[calc(100dvh-4rem)] flex-col justify-between px-4 py-5 sm:px-6 sm:py-6 pointer-events-none">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-slate-950/35 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-200/65">
              {mode === "weather" ? <CloudRain className="h-3.5 w-3.5" /> : <Orbit className="h-3.5 w-3.5" />}
              <span>{mode === "weather" ? copy.weatherMode : copy.spaceMode}</span>
            </div>
            <h1 className="mt-2 sm:mt-3 font-heading text-2xl font-bold text-white sm:text-5xl">{title}</h1>
            {!isMobile && <p className="mt-2 max-w-2xl text-sm text-slate-200/72 sm:text-base">{subtitle}</p>}
          </div>

          <div className="pointer-events-auto hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/30 p-1 backdrop-blur-sm">
            <Link
              href={`${trackerBase}/space-tracker`}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-mono transition-colors ${mode === "space" ? "bg-cyan-400/15 text-cyan-200" : "text-slate-300/65 hover:text-cyan-200"}`}
            >
              <Orbit className="h-3.5 w-3.5" />
              {copy.navSpace}
            </Link>
            <Link
              href={`${trackerBase}/weather-tracker`}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-mono transition-colors ${mode === "weather" ? "bg-cyan-400/15 text-cyan-200" : "text-slate-300/65 hover:text-cyan-200"}`}
            >
              <CloudRain className="h-3.5 w-3.5" />
              {copy.navWeather}
            </Link>
          </div>
        </div>

        {mode === "space" && !isMobile && (
          <div className="pointer-events-auto flex overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/30 px-2 py-2 backdrop-blur-sm">
              {focusChips.map((chip) => (
                <FocusChip
                  key={chip.id}
                  label={chip.label}
                  active={activeObjectName === chip.label}
                  onClick={() => focusTarget(chip.target)}
                />
              ))}
            </div>
          </div>
        )}

        {mode === "weather" && tooltip && !showCornerHud && hudVisible && (
          <div className="mx-auto mb-3 w-full max-w-xs rounded-2xl border border-cyan-400/18 bg-slate-950/45 px-4 py-3 backdrop-blur-md pointer-events-none">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-200/55">{tooltip.regionLabel}</div>
            <div className="mt-1 flex items-center justify-between text-sm text-white">
              <span>{copy.wind}: {tooltip.windSpeedKph} km/h</span>
              <span>{copy.clouds}: {tooltip.cloudCover}%</span>
            </div>
          </div>
        )}

        {showCornerHud && (!isMobile || mobilePanel === "telemetry") && (
          <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-4 ${isMobile ? "mb-4" : ""}`}>
            {mode === "weather" ? (
              <>
                <TelemetryPanel
                  title={copy.wind}
                  value={`${focusSample.windSpeedKph} km/h`}
                  detail={`${formatDirection(focusSample.windDirDeg)} flow · ${focusSample.regionLabel}${sampleLoading ? ` · ${copy.syncing}` : ` · ${copy.live}`}`}
                  icon={<Wind className="h-3.5 w-3.5" />}
                />
                <TelemetryPanel
                  title={copy.cloudDeck}
                  value={`${focusSample.cloudCover}%`}
                  detail={`${focusSample.precipitationMm} mm precip potential`}
                  icon={<CloudRain className="h-3.5 w-3.5" />}
                />
                <TelemetryPanel
                  title={copy.pressure}
                  value={`${focusSample.pressureHpa} hPa`}
                  detail={`${focusSample.temperatureC}°C surface model${gridLoading ? ` · ${copy.gridSync}` : weatherGrid?.source === "open-meteo" ? ` · ${copy.liveGrid}` : ` · ${copy.fallbackGrid}`}`}
                  icon={<Gauge className="h-3.5 w-3.5" />}
                />
                <TelemetryPanel
                  title={copy.storms}
                  value={`${activeStorms.length} ${copy.active}`}
                  detail={activeStorms.map((storm) => storm.name).join(" · ") || copy.noStorms}
                  icon={<Waves className="h-3.5 w-3.5" />}
                />
              </>
            ) : (
              <>
                <TelemetryPanel
                  title={copy.issOrbit}
                  value={`${Math.round(spaceData.iss?.speed ?? DEFAULT_ISS.speed).toLocaleString()} km/h`}
                  detail={`${(spaceData.iss?.lat ?? DEFAULT_ISS.lat).toFixed(2)}°, ${(spaceData.iss?.lon ?? DEFAULT_ISS.lon).toFixed(2)}°${spaceLoading ? ` · ${copy.syncing}` : ` · ${copy.live}`}`}
                  icon={<Satellite className="h-3.5 w-3.5" />}
                />
                <TelemetryPanel
                  title={copy.closestNeo}
                  value={spaceData.neo_closest ? `${spaceData.neo_closest.distance_ld.toFixed(2)} LD` : copy.noLock}
                  detail={spaceData.neo_closest ? `${spaceData.neo_closest.name} · ${(spaceData.neo_closest.speed_kmh / 1000).toFixed(1)}k km/h` : copy.asteroidFeedPending}
                  icon={<Orbit className="h-3.5 w-3.5" />}
                />
                <TelemetryPanel
                  title={copy.solar}
                  value={spaceData.solar ? `Kp ${spaceData.solar.kp_index}` : copy.noFeed}
                  detail={spaceData.solar ? `${spaceData.solar.flare_class} flare · ${spaceData.solar.solar_wind} km/s` : copy.solarPending}
                  icon={<Sun className="h-3.5 w-3.5" />}
                />
                <TelemetryPanel
                  title={copy.launchDsn}
                  value={spaceData.next_launch ? copy.live : copy.standby}
                  detail={spaceData.next_launch ? `${spaceData.next_launch.name} · ${spaceData.dsn_active ?? 0}/3 DSN` : `${spaceData.dsn_active ?? 0}/3 DSN active${spaceError ? ` · ${copy.degraded}` : ""}`}
                  icon={<Rocket className="h-3.5 w-3.5" />}
                />
              </>
            )}
          </div>
        )}

        <div className="flex items-end justify-between gap-4">
          {(!isMobile || hudExpanded || mobilePanel === "telemetry") && (
            <div className="max-w-xl rounded-2xl border border-cyan-400/12 bg-slate-950/28 px-4 py-3 text-sm text-slate-100/78 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/50 font-mono">
                {mode === "weather" ? copy.aiInsight : copy.trackerInsight}
              </div>
              <p className="mt-1">{mode === "weather" ? insight : spaceInsight}</p>
            </div>
          )}

          <div className="pointer-events-auto flex items-center gap-2">
            {isMobile && mode === "weather" && (
              <button
                onClick={() => {
                  const next = mobilePanel === "telemetry" ? "none" : "telemetry";
                  setMobilePanel(next);
                  setHudExpanded(next === "telemetry");
                  touchHud();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-slate-950/45 px-3 py-2 text-xs font-mono text-cyan-100/80 backdrop-blur-sm"
              >
                <Globe2 className="h-3.5 w-3.5" />
                {mobilePanel === "telemetry" ? copy.hideHud : copy.telemetry}
              </button>
            )}
          </div>
        </div>

        {mode === "space" && displayObject && !isMobile && (
          <div className="pointer-events-none mt-4 w-full max-w-2xl rounded-2xl border border-cyan-400/14 bg-slate-950/32 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-200/55">
              {displayObject.type === "ISS" ? <Satellite className="h-3.5 w-3.5" /> : displayObject.type === "Asteroid" ? <Orbit className="h-3.5 w-3.5" /> : displayObject.type === "DSN" ? <Radio className="h-3.5 w-3.5" /> : displayObject.type === "Moon" || displayObject.type === "Mjesec" ? <MoonStar className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              <span>{displayObject.type}</span>
            </div>
            <h2 className="mt-2 text-xl font-semibold text-white">{displayObject.name}</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {Object.entries(displayObject.data).slice(0, 6).map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/8 bg-slate-950/32 px-3 py-2">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400/70">{label}</div>
                  <div className="mt-1 text-sm text-slate-100">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isMobile && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
          <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 p-2 backdrop-blur-md">
            {mode === "space" && (
              <button
                onClick={() => {
                  setMobilePanel((prev) => (prev === "objects" ? "none" : "objects"));
                  touchHud();
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs font-mono text-slate-100"
              >
                <Orbit className="h-3.5 w-3.5" />
                {copy.objects}
              </button>
            )}
            <button
              onClick={() => {
                setMobilePanel((prev) => (prev === "telemetry" ? "none" : "telemetry"));
                touchHud();
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-slate-900/70 px-3 py-2 text-xs font-mono text-cyan-100"
            >
              <Globe2 className="h-3.5 w-3.5" />
              {copy.telemetry}
            </button>
          </div>
        </div>
      )}

      {isMobile && mobilePanel === "objects" && mode === "space" && (
        <div className="pointer-events-auto fixed inset-x-3 bottom-20 z-30 max-h-[60dvh] overflow-hidden rounded-3xl border border-cyan-400/18 bg-slate-950/92 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="text-sm font-semibold text-white">{copy.objects}</div>
            <button
              onClick={() => setMobilePanel("none")}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] font-mono text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
              {copy.close}
            </button>
          </div>
          <div className="max-h-[calc(60dvh-3.25rem)] overflow-y-auto px-4 py-4 space-y-4">
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-200/55">Core</div>
              {focusChips.slice(0, 5).map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => focusTarget(chip.target)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-slate-900/70 px-3 py-3 text-left"
                >
                  <span className="text-sm text-white">{chip.label}</span>
                  <ChevronRight className="h-4 w-4 text-cyan-200/60" />
                </button>
              ))}
            </div>
            {!!stableNeoData?.length && (
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-200/55">NEO</div>
                {stableNeoData.slice(0, 6).map((asteroid) => (
                  <button
                    key={asteroid.id}
                    onClick={() => focusTarget({ type: "asteroid", id: asteroid.id })}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-slate-900/70 px-3 py-3 text-left"
                  >
                    <div>
                      <div className="text-sm text-white">{asteroid.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{asteroid.distance_ld.toFixed(2)} LD</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-cyan-200/60" />
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-200/55">{copy.probes}</div>
              {PROBES_DATASET.entries.slice(0, 5).map((probe) => (
                <button
                  key={probe.id}
                  onClick={() => focusTarget({ type: "probe", id: probe.id })}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-slate-900/70 px-3 py-3 text-left"
                >
                  <span className="text-sm text-white">{probe.name}</span>
                  <ChevronRight className="h-4 w-4 text-cyan-200/60" />
                </button>
              ))}
            </div>
            {displayObject && (
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-200/55">{displayObject.type}</div>
                <div className="rounded-2xl border border-cyan-400/18 bg-slate-900/80 px-3 py-3 space-y-2">
                  <div className="text-base font-semibold text-white">{displayObject.name}</div>
                  {Object.entries(displayObject.data).slice(0, 6).map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-right text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isMobile && mobilePanel === "telemetry" && (
        <div className="pointer-events-auto fixed inset-x-3 bottom-20 z-30 max-h-[60dvh] overflow-hidden rounded-3xl border border-cyan-400/18 bg-slate-950/92 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="text-sm font-semibold text-white">{copy.telemetry}</div>
            <button
              onClick={() => setMobilePanel("none")}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] font-mono text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
              {copy.close}
            </button>
          </div>
          <div className="max-h-[calc(60dvh-3.25rem)] overflow-y-auto px-4 py-4 space-y-3">
            {mode === "space" ? (
              <>
                <TelemetryPanel
                  title={copy.issOrbit}
                  value={`${Math.round(spaceData.iss?.speed ?? DEFAULT_ISS.speed).toLocaleString()} km/h`}
                  detail={`${(spaceData.iss?.lat ?? DEFAULT_ISS.lat).toFixed(2)}°, ${(spaceData.iss?.lon ?? DEFAULT_ISS.lon).toFixed(2)}°${spaceLoading ? ` · ${copy.syncing}` : ` · ${copy.live}`}`}
                  icon={<Satellite className="h-3.5 w-3.5" />}
                />
                <TelemetryPanel
                  title={copy.closestNeo}
                  value={spaceData.neo_closest ? `${spaceData.neo_closest.distance_ld.toFixed(2)} LD` : copy.noLock}
                  detail={spaceData.neo_closest ? `${spaceData.neo_closest.name} · ${(spaceData.neo_closest.speed_kmh / 1000).toFixed(1)}k km/h` : copy.asteroidFeedPending}
                  icon={<Orbit className="h-3.5 w-3.5" />}
                />
                <TelemetryPanel
                  title={copy.solar}
                  value={spaceData.solar ? `Kp ${spaceData.solar.kp_index}` : copy.noFeed}
                  detail={spaceData.solar ? `${spaceData.solar.flare_class} flare · ${spaceData.solar.solar_wind} km/s` : copy.solarPending}
                  icon={<Sun className="h-3.5 w-3.5" />}
                />
                <TelemetryPanel
                  title={copy.launchDsn}
                  value={spaceData.next_launch ? copy.live : copy.standby}
                  detail={spaceData.next_launch ? `${spaceData.next_launch.name} · ${spaceData.dsn_active ?? 0}/3 DSN` : `${spaceData.dsn_active ?? 0}/3 DSN active${spaceError ? ` · ${copy.degraded}` : ""}`}
                  icon={<Rocket className="h-3.5 w-3.5" />}
                />
                <div className="rounded-2xl border border-cyan-400/12 bg-slate-950/28 px-4 py-3 text-sm text-slate-100/78">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/50 font-mono">{copy.trackerInsight}</div>
                  <p className="mt-1">{spaceInsight}</p>
                </div>
              </>
            ) : (
              <>
                <TelemetryPanel
                  title={copy.wind}
                  value={`${focusSample.windSpeedKph} km/h`}
                  detail={`${formatDirection(focusSample.windDirDeg)} flow · ${focusSample.regionLabel}${sampleLoading ? ` · ${copy.syncing}` : ` · ${copy.live}`}`}
                  icon={<Wind className="h-3.5 w-3.5" />}
                />
                <TelemetryPanel
                  title={copy.cloudDeck}
                  value={`${focusSample.cloudCover}%`}
                  detail={`${focusSample.precipitationMm} mm precip potential`}
                  icon={<CloudRain className="h-3.5 w-3.5" />}
                />
                <TelemetryPanel
                  title={copy.pressure}
                  value={`${focusSample.pressureHpa} hPa`}
                  detail={`${focusSample.temperatureC}°C surface model${gridLoading ? ` · ${copy.gridSync}` : weatherGrid?.source === "open-meteo" ? ` · ${copy.liveGrid}` : ` · ${copy.fallbackGrid}`}`}
                  icon={<Gauge className="h-3.5 w-3.5" />}
                />
                <TelemetryPanel
                  title={copy.storms}
                  value={`${activeStorms.length} ${copy.active}`}
                  detail={activeStorms.map((storm) => storm.name).join(" · ") || copy.noStorms}
                  icon={<Waves className="h-3.5 w-3.5" />}
                />
                <div className="rounded-2xl border border-cyan-400/12 bg-slate-950/28 px-4 py-3 text-sm text-slate-100/78">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/50 font-mono">{copy.aiInsight}</div>
                  <p className="mt-1">{insight}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
