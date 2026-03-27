"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Cloud,
  CloudFog,
  CloudRain,
  MapPin,
  RefreshCw,
  SunMedium,
  Wind,
} from "lucide-react";
import type { WeatherSample } from "@/modules/weather/weatherField";

type Lang = "en" | "hr";

const PRESETS = [
  { id: "zagreb", label: { en: "Zagreb", hr: "Zagreb" }, lat: 45.815, lon: 15.9819 },
  { id: "london", label: { en: "London", hr: "London" }, lat: 51.5072, lon: -0.1276 },
  { id: "newyork", label: { en: "New York", hr: "New York" }, lat: 40.7128, lon: -74.006 },
  { id: "tokyo", label: { en: "Tokyo", hr: "Tokio" }, lat: 35.6764, lon: 139.6500 },
  { id: "sydney", label: { en: "Sydney", hr: "Sydney" }, lat: -33.8688, lon: 151.2093 },
];

const COPY = {
  en: {
    eyebrow: "Live Weather",
    title: "Weather Pulse",
    subtitle: "Quick local conditions without leaving the homepage.",
    useLocation: "Use my location",
    changeRegion: "Change region",
    more: "More details",
    less: "Less",
    loading: "Syncing live weather...",
    failed: "Weather feed unavailable right now.",
    feels: "Surface",
    pressure: "Pressure",
    clouds: "Clouds",
    wind: "Wind",
    precipitation: "Precip",
    source: "Live sample",
    yourRegion: "Your region",
  },
  hr: {
    eyebrow: "Live Vrijeme",
    title: "Weather Pulse",
    subtitle: "Brzi lokalni uvjeti bez izlaska s homepagea.",
    useLocation: "Koristi moju lokaciju",
    changeRegion: "Promijeni regiju",
    more: "Više podataka",
    less: "Manje",
    loading: "Sinkroniziram live vrijeme...",
    failed: "Weather feed trenutno nije dostupan.",
    feels: "Površina",
    pressure: "Tlak",
    clouds: "Oblaci",
    wind: "Vjetar",
    precipitation: "Oborine",
    source: "Live uzorak",
    yourRegion: "Tvoja regija",
  },
} as const;

function weatherIcon(sample: WeatherSample | null) {
  if (!sample) return SunMedium;
  if (sample.precipitationMm >= 2) return CloudRain;
  if (sample.cloudCover >= 80) return Cloud;
  if (sample.cloudCover >= 45) return CloudFog;
  if (sample.windSpeedKph >= 45) return Wind;
  return SunMedium;
}

export default function WeatherPulseWidget({ lang = "en" }: { lang?: Lang }) {
  const copy = COPY[lang];
  const [expanded, setExpanded] = useState(false);
  const [sample, setSample] = useState<WeatherSample | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>("zagreb");
  const [regionLabel, setRegionLabel] = useState(PRESETS[0].label[lang]);

  const currentPreset = useMemo(
    () => PRESETS.find((preset) => preset.id === activePreset) ?? PRESETS[0],
    [activePreset],
  );

  const loadSample = async (lat: number, lon: number, label: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather/sample?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json?.ok || !json.data) throw new Error("Bad payload");
      setSample(json.data as WeatherSample);
      setRegionLabel(label);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSample(currentPreset.lat, currentPreset.lon, currentPreset.label[lang]);
  }, [currentPreset, lang]);

  const requestUserLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void loadSample(position.coords.latitude, position.coords.longitude, copy.yourRegion);
      },
      () => {
        setError("geo-denied");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  };

  const Icon = weatherIcon(sample);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 mb-4">
      {/* Compact bar — always visible */}
      <div
        className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2.5 cursor-pointer hover:border-cyan-400/20 transition-colors"
        onClick={() => setExpanded(p => !p)}
      >
        <Icon className="w-4 h-4 text-cyan-300/70 flex-shrink-0" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-200/50 flex-shrink-0">{copy.eyebrow}</span>
        <span className="text-sm font-semibold text-white/80 flex-shrink-0">
          {loading ? "—" : error || !sample ? "?" : `${sample.temperatureC}°C`}
        </span>
        <span className="text-xs text-slate-400/60 truncate">{regionLabel}</span>
        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          {!loading && !error && sample && (
            <>
              <span className="hidden sm:flex items-center gap-1 text-xs font-mono text-slate-400/60">
                <Wind className="w-3 h-3" />{sample.windSpeedKph}km/h
              </span>
              <span className="hidden sm:flex items-center gap-1 text-xs font-mono text-slate-400/60">
                <Cloud className="w-3 h-3" />{sample.cloudCover}%
              </span>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); requestUserLocation(); }}
            className="p-1 rounded text-slate-400/50 hover:text-cyan-300 transition-colors"
            title={copy.useLocation}
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>
          <span className="text-slate-500/50 text-xs font-mono">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="mt-1 rounded-xl border border-white/8 bg-[rgba(7,15,30,0.92)] p-4">
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
            <div className="rounded-xl border border-white/6 bg-white/4 px-3 py-2 col-span-2 sm:col-span-1">
              <div className="text-[9px] font-mono uppercase tracking-widest text-slate-400/60">{regionLabel}</div>
              {loading ? (
                <div className="mt-1 text-xs text-slate-400/60">{copy.loading}</div>
              ) : error || !sample ? (
                <div className="mt-1 text-xs text-rose-300/60">{copy.failed}</div>
              ) : (
                <div className="mt-1 text-2xl font-bold text-white">{sample.temperatureC}°C</div>
              )}
            </div>
            {[
              { label: copy.wind, val: sample ? `${sample.windSpeedKph} km/h` : "—" },
              { label: copy.clouds, val: sample ? `${sample.cloudCover}%` : "—" },
              { label: copy.pressure, val: sample ? `${sample.pressureHpa} hPa` : "—" },
            ].map(({ label, val }) => (
              <div key={label} className="rounded-xl border border-white/6 bg-white/4 px-3 py-2">
                <div className="text-[9px] font-mono uppercase tracking-widest text-slate-400/60">{label}</div>
                <div className="mt-1 text-lg font-semibold text-white/80">{val}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setActivePreset(preset.id)}
                className={`rounded-full border px-3 py-1 text-[10px] font-mono transition-colors ${
                  activePreset === preset.id
                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                    : "border-white/8 bg-white/4 text-slate-300/60 hover:border-cyan-400/20"
                }`}
              >
                {preset.label[lang]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
