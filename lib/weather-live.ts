import {
  getRegionLabel,
  sampleWeather,
  deriveStorminess,
  type WeatherGridCell,
  type WeatherGridSnapshot,
  type WeatherSample,
} from "@/modules/weather/weatherField";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const GRID_LATITUDES = [-75, -45, -15, 15, 45, 75];
const GRID_LONGITUDES = [-165, -135, -105, -75, -45, -15, 15, 45, 75, 105, 135, 165];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildForecastUrl(latitudes: number[], longitudes: number[]) {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", latitudes.map((value) => value.toFixed(2)).join(","));
  url.searchParams.set("longitude", longitudes.map((value) => value.toFixed(2)).join(","));
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "precipitation",
      "cloud_cover",
      "pressure_msl",
      "wind_speed_10m",
      "wind_direction_10m",
    ].join(","),
  );
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("timezone", "GMT");
  return url;
}

async function fetchOpenMeteo(latitudes: number[], longitudes: number[]) {
  const res = await fetch(buildForecastUrl(latitudes, longitudes).toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo error ${res.status}`);
  }

  return res.json();
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function payloadToEntries(payload: unknown) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray((payload as { responses?: unknown[] }).responses)) {
      return (payload as { responses: unknown[] }).responses;
    }
    return [payload];
  }
  return [];
}

function parseGridCells(payload: unknown) {
  const entries = payloadToEntries(payload);
  const cells: WeatherGridCell[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const current = (entry as { current?: Record<string, unknown> }).current ?? {};
    const lat = asNumber((entry as { latitude?: unknown }).latitude);
    const lon = asNumber((entry as { longitude?: unknown }).longitude);
    if (lat === null || lon === null) continue;

    const fallback = sampleWeather(lat, lon);
    const windSpeedKph = asNumber(current.wind_speed_10m) ?? fallback.windSpeedKph;
    const windDirDeg = asNumber(current.wind_direction_10m) ?? fallback.windDirDeg;
    const cloudCover = asNumber(current.cloud_cover) ?? fallback.cloudCover;
    const pressureHpa = asNumber(current.pressure_msl) ?? fallback.pressureHpa;
    const precipitationMm = asNumber(current.precipitation) ?? fallback.precipitationMm;
    const temperatureC = asNumber(current.temperature_2m) ?? fallback.temperatureC;

    cells.push({
      lat,
      lon,
      windSpeedKph,
      windDirDeg,
      cloudCover,
      pressureHpa,
      precipitationMm,
      temperatureC,
      regionLabel: getRegionLabel(lat, lon),
      updatedAt: typeof current.time === "string" ? current.time : undefined,
    });
  }

  return cells;
}

export async function getLiveWeatherSample(lat: number, lon: number): Promise<WeatherSample> {
  const fallback = sampleWeather(lat, lon);

  try {
    const json = await fetchOpenMeteo([lat], [lon]);
    const cell = parseGridCells(json)[0];
    if (!cell) return fallback;

    return {
      lat,
      lon,
      windSpeedKph: cell.windSpeedKph,
      windDirDeg: cell.windDirDeg,
      cloudCover: cell.cloudCover,
      pressureHpa: cell.pressureHpa,
      precipitationMm: cell.precipitationMm,
      temperatureC: cell.temperatureC,
      storminess: deriveStorminess(cell.windSpeedKph, cell.precipitationMm, cell.pressureHpa, cell.cloudCover),
      regionLabel: cell.regionLabel || fallback.regionLabel,
    };
  } catch {
    return fallback;
  }
}

export async function getLiveWeatherGrid(): Promise<WeatherGridSnapshot> {
  const latitudes: number[] = [];
  const longitudes: number[] = [];

  for (const lat of GRID_LATITUDES) {
    for (const lon of GRID_LONGITUDES) {
      latitudes.push(lat);
      longitudes.push(lon);
    }
  }

  try {
    const json = await fetchOpenMeteo(latitudes, longitudes);
    const cells = parseGridCells(json);
    if (!cells.length) {
      throw new Error("Open-Meteo returned no cells");
    }

    return {
      updatedAt: new Date().toISOString(),
      source: "open-meteo",
      spacing: { lat: 30, lon: 30 },
      cells,
    };
  } catch {
    const fallbackCells: WeatherGridCell[] = [];
    for (const lat of GRID_LATITUDES) {
      for (const lon of GRID_LONGITUDES) {
        const fallback = sampleWeather(lat, lon);
        fallbackCells.push({
          lat,
          lon,
          windSpeedKph: fallback.windSpeedKph,
          windDirDeg: fallback.windDirDeg,
          cloudCover: fallback.cloudCover,
          pressureHpa: fallback.pressureHpa,
          precipitationMm: fallback.precipitationMm,
          temperatureC: fallback.temperatureC,
          regionLabel: fallback.regionLabel,
        });
      }
    }

    return {
      updatedAt: new Date().toISOString(),
      source: "fallback-model",
      spacing: { lat: 30, lon: 30 },
      cells: fallbackCells,
    };
  }
}

export function estimateLiveStorminess(sample: WeatherSample) {
  return clamp(sample.storminess, 0, 1);
}
