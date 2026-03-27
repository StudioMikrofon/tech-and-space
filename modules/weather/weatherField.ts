import * as THREE from "three";

export const EARTH_TRACKER_RADIUS = 2;

export interface WeatherSample {
  lat: number;
  lon: number;
  windSpeedKph: number;
  windDirDeg: number;
  cloudCover: number;
  pressureHpa: number;
  precipitationMm: number;
  temperatureC: number;
  storminess: number;
  regionLabel: string;
}

export interface WeatherGridCell {
  lat: number;
  lon: number;
  windSpeedKph: number;
  windDirDeg: number;
  cloudCover: number;
  pressureHpa: number;
  precipitationMm: number;
  temperatureC: number;
  regionLabel?: string;
  updatedAt?: string;
}

export interface WeatherGridSnapshot {
  updatedAt: string;
  source: string;
  cells: WeatherGridCell[];
  spacing?: {
    lat: number;
    lon: number;
  };
}

export interface StormSystem {
  id: string;
  name: string;
  lat: number;
  lon: number;
  radiusDeg: number;
  intensity: number;
  pressureHpa: number;
  headingDeg: number;
  speedKph: number;
  path: Array<{ lat: number; lon: number }>;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function wrapLon(lon: number) {
  let next = lon;
  while (next < -180) next += 360;
  while (next > 180) next -= 360;
  return next;
}

function softNoise(lat: number, lon: number, timePhase: number) {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const waveA = Math.sin(latRad * 2.3 + timePhase * 0.8) * Math.cos(lonRad * 1.4 - timePhase * 0.4);
  const waveB = Math.sin(lonRad * 3.1 + latRad * 0.8 + timePhase * 1.1);
  const waveC = Math.cos(latRad * 4.6 - lonRad * 2.4 + timePhase * 0.2);
  return (waveA * 0.45 + waveB * 0.35 + waveC * 0.2 + 1) * 0.5;
}

export function getRegionLabel(lat: number, lon: number) {
  if (lat > 50 && lon > -60 && lon < 60) return "North Atlantic";
  if (lat > 10 && lat < 35 && lon > -85 && lon < -15) return "Tropical Atlantic";
  if (lat > 5 && lat < 35 && lon > 110 && lon < 170) return "West Pacific";
  if (lat > -40 && lat < -5 && lon > 40 && lon < 110) return "Indian Ocean";
  if (lat > 25 && lon > -130 && lon < -100) return "West Coast North America";
  if (lat > 30 && lon > 120 && lon < 150) return "East Asia";
  if (lat < -20 && lon > 110) return "Southern Ocean";
  if (lat > 0 && lon > -20 && lon < 45) return "North Africa";
  if (lat > 20 && lon > -100 && lon < -60) return "Caribbean";
  if (lat > 35 && lon > -15 && lon < 40) return "Mediterranean";
  return "Open Ocean";
}

export function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function deriveStorminess(
  windSpeedKph: number,
  precipitationMm: number,
  pressureHpa: number,
  cloudCover: number,
) {
  return clamp(
    (windSpeedKph / 170) * 0.42 +
      (precipitationMm / 15) * 0.28 +
      (Math.max(0, 1008 - pressureHpa) / 55) * 0.2 +
      (cloudCover / 100) * 0.1,
    0,
    1,
  );
}

function bandFactor(lat: number) {
  return Math.cos((Math.abs(lat) * Math.PI) / 180);
}

export function sampleWeather(lat: number, lon: number, timeMs = Date.now()): WeatherSample {
  const hours = timeMs / 3_600_000;
  const phase = hours * 0.08;
  const latAbs = Math.abs(lat);
  const equatorial = Math.cos((latAbs * Math.PI) / 180);
  const noise = softNoise(lat, lon, phase);

  const stormSystems = getStormSystems(timeMs);
  let storminess = 0;
  for (const storm of stormSystems) {
    const dLat = lat - storm.lat;
    const dLon = wrapLon(lon - storm.lon) * Math.cos((lat * Math.PI) / 180);
    const dist = Math.sqrt(dLat * dLat + dLon * dLon);
    storminess += Math.max(0, 1 - dist / storm.radiusDeg) * storm.intensity;
  }
  storminess = clamp(storminess, 0, 1);

  const jet = clamp(1 - Math.abs(latAbs - 35) / 25, 0, 1) * 45;
  const trade = equatorial * 28;
  const polar = clamp((latAbs - 55) / 25, 0, 1) * 35;
  const windSpeedKph = Math.round(clamp(18 + jet + trade + polar + noise * 30 + storminess * 90, 8, 220));
  const windDirDeg = wrapLon(
    (lat >= 0 ? 65 : -65) +
      Math.sin((lon + phase * 30) * Math.PI / 180) * 35 +
      Math.cos((lat - phase * 12) * Math.PI / 180) * 18 +
      storminess * 55
  );

  const cloudCover = Math.round(clamp(22 + noise * 58 + equatorial * 18 + storminess * 28, 0, 100));
  const precipitationMm = Number(clamp((cloudCover - 52) * 0.11 + storminess * 10 + noise * 1.2, 0, 26).toFixed(1));
  const pressureHpa = Math.round(clamp(1022 - cloudCover * 0.18 - storminess * 42 + Math.sin(phase + lon / 40) * 5, 930, 1038));
  const temperatureC = Math.round(clamp(31 - latAbs * 0.52 + Math.sin(phase * 1.8 + lon / 60) * 5 - storminess * 4, -32, 39));

  return {
    lat,
    lon,
    windSpeedKph,
    windDirDeg,
    cloudCover,
    pressureHpa,
    precipitationMm,
    temperatureC,
    storminess,
    regionLabel: getRegionLabel(lat, lon),
  };
}

function sampleFromCell(cell: WeatherGridCell): WeatherSample {
  return {
    lat: cell.lat,
    lon: cell.lon,
    windSpeedKph: cell.windSpeedKph,
    windDirDeg: cell.windDirDeg,
    cloudCover: cell.cloudCover,
    pressureHpa: cell.pressureHpa,
    precipitationMm: cell.precipitationMm,
    temperatureC: cell.temperatureC,
    storminess: deriveStorminess(cell.windSpeedKph, cell.precipitationMm, cell.pressureHpa, cell.cloudCover),
    regionLabel: cell.regionLabel || getRegionLabel(cell.lat, cell.lon),
  };
}

export function sampleWeatherFromGrid(
  grid: WeatherGridSnapshot | null | undefined,
  lat: number,
  lon: number,
  timeMs = Date.now(),
): WeatherSample {
  if (!grid?.cells?.length) {
    return sampleWeather(lat, lon, timeMs);
  }

  const nearest = grid.cells
    .map((cell) => {
      const dLat = lat - cell.lat;
      const dLon = wrapLon(lon - cell.lon) * Math.max(0.28, bandFactor((lat + cell.lat) * 0.5));
      return {
        cell,
        dist: Math.sqrt(dLat * dLat + dLon * dLon),
      };
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 4);

  if (!nearest.length) {
    return sampleWeather(lat, lon, timeMs);
  }

  if (nearest[0].dist < 0.01) {
    const direct = sampleFromCell(nearest[0].cell);
    return { ...direct, lat, lon };
  }

  let weightSum = 0;
  let windSpeedKph = 0;
  let cloudCover = 0;
  let pressureHpa = 0;
  let precipitationMm = 0;
  let temperatureC = 0;
  let windX = 0;
  let windY = 0;

  for (const entry of nearest) {
    const weight = 1 / Math.max(25, entry.dist * entry.dist);
    const sample = sampleFromCell(entry.cell);
    weightSum += weight;
    windSpeedKph += sample.windSpeedKph * weight;
    cloudCover += sample.cloudCover * weight;
    pressureHpa += sample.pressureHpa * weight;
    precipitationMm += sample.precipitationMm * weight;
    temperatureC += sample.temperatureC * weight;
    const angle = (sample.windDirDeg * Math.PI) / 180;
    windX += Math.cos(angle) * weight;
    windY += Math.sin(angle) * weight;
  }

  const windDirDeg = ((Math.atan2(windY, windX) * 180) / Math.PI + 360) % 360;
  const resolvedWind = windSpeedKph / Math.max(weightSum, 1e-6);
  const resolvedCloud = cloudCover / Math.max(weightSum, 1e-6);
  const resolvedPressure = pressureHpa / Math.max(weightSum, 1e-6);
  const resolvedPrecip = precipitationMm / Math.max(weightSum, 1e-6);
  const resolvedTemp = temperatureC / Math.max(weightSum, 1e-6);

  return {
    lat,
    lon,
    windSpeedKph: Math.round(resolvedWind),
    windDirDeg,
    cloudCover: Math.round(resolvedCloud),
    pressureHpa: Math.round(resolvedPressure),
    precipitationMm: Number(resolvedPrecip.toFixed(1)),
    temperatureC: Math.round(resolvedTemp),
    storminess: deriveStorminess(resolvedWind, resolvedPrecip, resolvedPressure, resolvedCloud),
    regionLabel: nearest[0].cell.regionLabel || getRegionLabel(lat, lon),
  };
}

export function getWindVector(
  lat: number,
  lon: number,
  timeMs = Date.now(),
  grid?: WeatherGridSnapshot | null,
) {
  const sample = sampleWeatherFromGrid(grid, lat, lon, timeMs);
  const speedDeg = sample.windSpeedKph / 16000;
  const angle = (sample.windDirDeg * Math.PI) / 180;
  return {
    dLat: Math.cos(angle) * speedDeg * 0.7,
    dLon: Math.sin(angle) * speedDeg / Math.max(0.3, Math.cos((lat * Math.PI) / 180)),
    brightness: clamp(sample.windSpeedKph / 160, 0.2, 1),
  };
}

export function getStormSystems(timeMs = Date.now()): StormSystem[] {
  const day = timeMs / 86_400_000;
  const systems: Array<Omit<StormSystem, "path">> = [
    {
      id: "atlantic-alpha",
      name: "Atlantic Alpha",
      lat: 18 + Math.sin(day * 0.45) * 8,
      lon: wrapLon(-48 + Math.cos(day * 0.32) * 18),
      radiusDeg: 16,
      intensity: 0.92,
      pressureHpa: 962,
      headingDeg: 305,
      speedKph: 34,
    },
    {
      id: "pacific-gamma",
      name: "Pacific Gamma",
      lat: 14 + Math.cos(day * 0.36) * 10,
      lon: wrapLon(145 + Math.sin(day * 0.28) * 22),
      radiusDeg: 18,
      intensity: 0.86,
      pressureHpa: 968,
      headingDeg: 292,
      speedKph: 28,
    },
    {
      id: "indian-sigma",
      name: "Indian Sigma",
      lat: -18 + Math.sin(day * 0.4) * 9,
      lon: wrapLon(78 + Math.cos(day * 0.33) * 14),
      radiusDeg: 13,
      intensity: 0.72,
      pressureHpa: 978,
      headingDeg: 248,
      speedKph: 22,
    },
  ];

  return systems.map((storm) => {
    const path = Array.from({ length: 6 }, (_, i) => {
      const step = i * 0.9;
      const heading = (storm.headingDeg * Math.PI) / 180;
      return {
        lat: storm.lat + Math.cos(heading) * step * 1.4,
        lon: wrapLon(storm.lon + Math.sin(heading) * step * 2.1),
      };
    });

    return { ...storm, path };
  });
}

export function buildStormSystemsFromGrid(
  grid: WeatherGridSnapshot | null | undefined,
  timeMs = Date.now(),
): StormSystem[] {
  if (!grid?.cells?.length) {
    return getStormSystems(timeMs);
  }

  const ranked = grid.cells
    .map((cell) => {
      const storminess = deriveStorminess(cell.windSpeedKph, cell.precipitationMm, cell.pressureHpa, cell.cloudCover);
      const pressurePenalty = Math.max(0, 1008 - cell.pressureHpa) / 40;
      return {
        cell,
        score: storminess + pressurePenalty,
      };
    })
    .filter((entry) => entry.score > 0.62 || entry.cell.pressureHpa < 1000 || entry.cell.windSpeedKph > 80)
    .sort((a, b) => b.score - a.score);

  const selected: typeof ranked = [];
  for (const entry of ranked) {
    const tooClose = selected.some((picked) => {
      const dLat = Math.abs(entry.cell.lat - picked.cell.lat);
      const dLon = Math.abs(wrapLon(entry.cell.lon - picked.cell.lon));
      return Math.sqrt(dLat * dLat + dLon * dLon) < 22;
    });
    if (!tooClose) {
      selected.push(entry);
    }
    if (selected.length === 4) break;
  }

  if (!selected.length) {
    return getStormSystems(timeMs);
  }

  return selected.map((entry, index) => {
    const intensity = clamp(entry.score / 1.6, 0.48, 1);
    const radiusDeg = 10 + intensity * 10;
    const headingDeg = entry.cell.windDirDeg;
    const speedKph = Math.max(18, Math.round(entry.cell.windSpeedKph * 0.45));
    const heading = (headingDeg * Math.PI) / 180;
    const path = Array.from({ length: 6 }, (_, stepIndex) => {
      const step = stepIndex * (speedKph / 80);
      return {
        lat: clamp(entry.cell.lat + Math.cos(heading) * step * 1.6, -85, 85),
        lon: wrapLon(entry.cell.lon + Math.sin(heading) * step * 2.2),
      };
    });

    return {
      id: `live-storm-${index}-${entry.cell.lat.toFixed(1)}-${entry.cell.lon.toFixed(1)}`,
      name: `${entry.cell.regionLabel || getRegionLabel(entry.cell.lat, entry.cell.lon)} Cell`,
      lat: entry.cell.lat,
      lon: entry.cell.lon,
      radiusDeg,
      intensity,
      pressureHpa: entry.cell.pressureHpa,
      headingDeg,
      speedKph,
      path,
    };
  });
}

export function buildInsight(sample: WeatherSample, storms = getStormSystems()) {
  const activeStorm = storms.find((storm) => {
    const dLat = sample.lat - storm.lat;
    const dLon = wrapLon(sample.lon - storm.lon);
    return Math.sqrt(dLat * dLat + dLon * dLon) < storm.radiusDeg * 1.4;
  });

  if (activeStorm) {
    return `${activeStorm.name} intensifying near ${sample.regionLabel}. Pressure down to ${activeStorm.pressureHpa} hPa with cyclone bands expanding.`;
  }

  if (sample.windSpeedKph > 120) {
    return `Jet stream acceleration over ${sample.regionLabel}. Winds now near ${sample.windSpeedKph} km/h with bright upper-atmosphere shear.`;
  }

  if (sample.precipitationMm > 8) {
    return `Heavy precipitation cluster over ${sample.regionLabel}. Moisture feed remains elevated with ${sample.cloudCover}% cloud cover.`;
  }

  return `Weather stable over ${sample.regionLabel}. Pressure ${sample.pressureHpa} hPa and cloud deck ${sample.cloudCover}%.`;
}
