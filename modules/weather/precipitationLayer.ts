import * as THREE from "three";
import { EARTH_TRACKER_RADIUS, type WeatherSample } from "./weatherField";
import type { WeatherLayerHandle } from "./cloudLayer";

export function createPrecipitationLayer(
  isMobile: boolean,
  sampleAt: (lat: number, lon: number, timeMs: number) => WeatherSample,
): WeatherLayerHandle {
  const canvas = document.createElement("canvas");
  canvas.width = isMobile ? 256 : 512;
  canvas.height = isMobile ? 128 : 256;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_TRACKER_RADIUS * 1.04, 48, 48),
    material
  );

  let lastRedraw = 0;

  const redraw = (timeMs: number) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y += 3) {
      const lat = 90 - (y / canvas.height) * 180;
      for (let x = 0; x < canvas.width; x += 3) {
        const lon = (x / canvas.width) * 360 - 180;
        const sample = sampleAt(lat, lon, timeMs);
        if (sample.precipitationMm < 0.25) continue;
        const intensity = Math.min(1, sample.precipitationMm / 10);
        const r = Math.round(38 + intensity * 42);
        const g = Math.round(150 + intensity * 70);
        const b = Math.round(235 + intensity * 12);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.14 + intensity * 0.52})`;
        ctx.fillRect(x, y, 3, 3);
      }
    }
    texture.needsUpdate = true;
  };

  return {
    object: mesh,
    update: (elapsed, timeMs) => {
      mesh.rotation.y = -elapsed * 0.024;
      texture.offset.x = (-elapsed * 0.01) % 1;
      texture.offset.y = (elapsed * 0.002) % 1;
      if (timeMs - lastRedraw > (isMobile ? 2600 : 1800)) {
        redraw(timeMs);
        lastRedraw = timeMs;
      }
    },
    setVisible: (visible) => {
      mesh.visible = visible;
    },
  };
}
