import * as THREE from "three";
import { EARTH_TRACKER_RADIUS, latLonToVector3, type WeatherSample } from "./weatherField";
import type { WeatherLayerHandle } from "./cloudLayer";

interface WindParticle {
  lat: number;
  lon: number;
  life: number;
}

function seededParticle(index: number): WindParticle {
  return {
    lat: ((index * 37.7) % 180) - 90,
    lon: ((index * 71.9) % 360) - 180,
    life: (index * 0.137) % 1,
  };
}

export function createWindLayer(
  isMobile: boolean,
  sampleAt: (lat: number, lon: number, timeMs: number) => WeatherSample,
  getWindAt: (lat: number, lon: number, timeMs: number) => { dLat: number; dLon: number; brightness: number },
): WeatherLayerHandle {
  const particleCount = isMobile ? 220 : 520;
  const particles = Array.from({ length: particleCount }, (_, index) => seededParticle(index));
  const positions = new Float32Array(particleCount * 6);
  const colors = new Float32Array(particleCount * 6);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: isMobile ? 0.42 : 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const segments = new THREE.LineSegments(geometry, material);

  const respawn = (particle: WindParticle, seed: number) => {
    particle.lat = ((seed * 53.1) % 160) - 80;
    particle.lon = ((seed * 91.3) % 360) - 180;
    particle.life = 1;
  };

  return {
    object: segments,
    update: (_elapsed, timeMs) => {
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        if (particle.life <= 0) {
          respawn(particle, i + timeMs * 0.0001);
        }

        const vector = getWindAt(particle.lat, particle.lon, timeMs);
        particle.lat += vector.dLat * (isMobile ? 0.65 : 1);
        particle.lon += vector.dLon * (isMobile ? 0.65 : 1);
        particle.life -= isMobile ? 0.004 : 0.006;

        if (particle.lat > 85 || particle.lat < -85 || particle.lon > 180 || particle.lon < -180) {
          respawn(particle, i * 1.7 + timeMs * 0.00005);
        }

        const sample = sampleAt(particle.lat, particle.lon, timeMs);
        const start = latLonToVector3(particle.lat, particle.lon, EARTH_TRACKER_RADIUS * 1.055);
        const end = latLonToVector3(
          particle.lat + vector.dLat * 120,
          particle.lon + vector.dLon * 120,
          EARTH_TRACKER_RADIUS * 1.07
        );

        positions[i * 6] = start.x;
        positions[i * 6 + 1] = start.y;
        positions[i * 6 + 2] = start.z;
        positions[i * 6 + 3] = end.x;
        positions[i * 6 + 4] = end.y;
        positions[i * 6 + 5] = end.z;

        const brightness = Math.min(1, sample.windSpeedKph / 170);
        const alphaColor = 0.3 + brightness * 0.7;
        const r = 0.08 + brightness * 0.15;
        const g = 0.45 + brightness * 0.35;
        const b = 0.85 + brightness * 0.15;
        colors[i * 6] = r;
        colors[i * 6 + 1] = g;
        colors[i * 6 + 2] = b;
        colors[i * 6 + 3] = r * alphaColor;
        colors[i * 6 + 4] = g * alphaColor;
        colors[i * 6 + 5] = b;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    },
    setVisible: (visible) => {
      segments.visible = visible;
    },
  };
}
